# AutoWASI: 让 `os/exec` 自动识别 WASM 二进制类型，选择合适的 worker driver

## 背景

Wanix 有两个 WASM 任务 driver:

| Driver | 适用目标 | Worker 模板 |
|--------|---------|-------------|
| **gojs** | Go 标准 `GOOS=js GOARCH=wasm` | `wasm_exec.js` 的 `Go()` class，async callback |
| **wasi** | TinyGo/WASI 标准二进制 | `SharedArrayBuffer` + `CallBuffer` 同步 RPC，使用 `browser_wasi_shim` |

## 问题

Go 程序（使用 forked toolchain 编译为 `GOOS=js GOARCH=wasm`）中调用 `os/exec` 时，调用链为：

```
os/exec.Command("foo.wasm")
  → syscall.StartProcess (forked Go toolchain)
    → js.Global().Get("child_process").Call("spawn", ...)
      → gojs/worker/worker.js: child_process.spawn
        → WanixHandle.spawn (RPC)
          → api/spawn.go: syscaller.spawn
            → parent.Alloc("gojs")     ← 硬编码，永远是 gojs
```

**`api/spawn.go:52` 硬编码了 `parent.Alloc("gojs")`**。无论目标是 Go 标准 WASM 还是 TinyGo/WASI WASM，都走 gojs worker 模板，TinyGo/WASI 二进制无法运行。

## 方案：基于 WASM 二进制检测自动选择 driver

### 核心改动

1. **`api/spawn.go`**: 将 `parent.Alloc("gojs")` 改为 `parent.Alloc("auto")`
2. **`gojs/driver.go` `Check()`**: 真实检测 WASM 二进制，匹配 Go JS WASM（import "go" module）
3. **`wasi/driver.go` `Check()`**: 真实检测 WASM 二进制，匹配 WASI（import "wasi_snapshot_preview1"）
4. **新增 `wasm/detect.go`**: 共享的 WASM 二进制检测工具函数

### WASM 二进制检测逻辑

```
读取 WASM 文件头 + import section:
  1. 验证 magic (\x00asm) + version (\x01\x00\x00\x00)
  2. 解析 section 直到找到 Import section (id=2)
  3. 遍历 import entries，检查 module name:
     - "wasi_snapshot_preview1" → WASI
     - "go" → Go JS
  4. 都不匹配 → Go JS fallback
```

### 自动选择流程

```
api/spawn.go 收到 spawn RPC
  → parent.Alloc("auto")
    → 写 cmd / env / dir / stdio
    → 写 "start" → autoDriver.Start()
      → 遍历所有 driver:
        wasi.Driver.Check():
          ├─ import wasi_snapshot_preview1 → t.kind="wasi", wasi.Start()
          └─ 不匹配 → 继续
        gojs.Driver.Check():
          ├─ import go module 或非 WASI → t.kind="gojs", gojs.Start()
          └─ 不匹配 → 继续
```

### 优势

- **对 Go 程序透明**: `os/exec.Command("tinygo_app.wasm")` 自动走 wasi worker；`os/exec.Command("go_wasm_app.wasm")` 自动走 gojs worker
- **无需改动 JS 侧**: `child_process.spawn` 的 JS 接口不变，所有改动在 Go 侧完成
- **无额外依赖**: WASM 解析是标准格式，几十行代码即可完成
