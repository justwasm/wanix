# WASI Worker 完善计划

## 项目背景

Wanix 是一个 web-native OS toolkit，支持两种 WASM 任务 driver：

| Driver | 适用目标 | Worker 模板 |
|--------|---------|-------------|
| **gojs** | Go 标准 `GOOS=js GOARCH=wasm` | `wasm_exec.js` 的 `Go()` class，async callback |
| **wasi** | TinyGo/WASI 标准二进制 | `SharedArrayBuffer` + `CallBuffer` 同步 RPC，使用 `browser_wasi_shim` |

两种 worker 通过同一个 `web/worker/worker.go:Resource.Start()` 创建，port 绑定到子 task 的 Go-side syscaller。父-子进程通信不依赖 worker 类型（详见 `interop.md`）。

## 当前状态

**gojs→wasi 交叉 spawn 已可工作**（`path_open`、`fd_write` 成功），但 wasi worker 与 gojs worker 之间存在多项功能差距。

## 已完成

| # | 项目 | 文件 | 说明 |
|---|------|------|------|
| ✅ | WASM 二进制类型检测 | `wasmdetect.go` | 解析 import section，区分 `wasi_snapshot_preview1` vs `go` module |
| ✅ | auto driver | `api/spawn.go` | `parent.Alloc("auto")` 替代硬编码 `"gojs"` |
| ✅ | gojs/wasi Check() | `gojs/driver.go`, `wasi/driver.go` | 调用 `DetectWASMKind()` 真实检测 |
| ✅ | fdFS — `#task/{id}/fd/{n}` 路径 | `task.go` | 暴露 FD 表为 fs 目录，wasi 的 `path_open` 可找到 stdout/stderr |
| ✅ | VFS fallback 恢复 | `task.go` | 保留 `Task.FD()` 的 VFS fallback，term/pipe 模式的 fd 通过 NS 找到 |

## 待修复差异

按严重程度排序：

### #1 stdin (fd 0) — 最高优先级

**位置**: `wasi/worker/worker.js:131-132`

**问题**: 当前使用 `OpenEmptyFile()`，真实 stdin 被注释掉：
```javascript
new OpenEmptyFile(),                                     // fd 0: 永远 EOF
// new OpenFile(new File(new FileHandle(caller, e.data.stdin))),  // 被注释
```

**影响**: 交互式程序（TUI、shell、chat）无法读取用户输入。

**修复**:
1. 取消注释真实 stdin 行
2. `path_open` 现在可以打开 `#task/{tid}/fd/0`（fdFS 已修复）

---

### #2 工作目录 — 高优先级

**位置**: `wasi/worker/worker.js:29-48`（`initializeSyncWorker`）

**gojs 对照** (`gojs/worker/worker.js:22`):
```javascript
globalThis.cwd = (await fs.readText(`${TASKNS}/${tid}/dir`)).trim() || "/";
```

**WASI**: 完全没有读取 `#task/{tid}/dir`，也没有设置 cwd。

**影响**: 程序用相对路径读写文件会失败。

**修复**: 在 `initializeSyncWorker` 中读取 dir 并设置 `globalThis.cwd`。

---

### #3 child_process.spawn — 高优先级

**位置**: `wasi/worker/worker.js`

**gojs 对照** (`gojs/worker/worker.js:450-471`):
```javascript
globalThis.child_process = {
    async spawn(name, args, opts, callback) { ... sys.spawn(name, args, opts) ... },
    async wait(pid, callback) { ... sys.wait(pid) ... },
};
```

**WASI**: 完全没有 `child_process` 实现。

**影响**: WASI 程序内部的 `os/exec.Command()` 无法创建子进程。

**修复**: 在 wasi worker 的 `initializeSyncWorker` 中（或全局）添加 `globalThis.child_process`。

---

### #4 cleanpath — 中优先级

**位置**: `wasi/worker/worker.js:29-48`（`initializeSyncWorker`）

**gojs 对照** (`gojs/worker/worker.js:84-112`):
```javascript
function cleanpath(path) {
    if (path.startsWith("./")) path = path.slice(2);
    if (path === "/") return ".";
    if (!path.startsWith("/")) path = [globalThis.cwd, path].join("/");
    path = path.replace(/\/+/g, '/');
    // ... 解析 .. 和 . ...
}
```

**WASI**: 直接使用 `args[0]` 作为文件路径。

**影响**: 带 `./` 前缀或相对路径的 WASM 二进制无法被找到。

**修复**: 在 `initializeSyncWorker` 中对 `args[0]` 应用 cleanpath 逻辑。

---

### #5 process.pid — 中优先级

**位置**: `wasi/worker/worker.js`

**gojs 对照** (`gojs/worker/worker.js:15-16`):
```javascript
globalThis.process.pid = parseInt(tid);
globalThis.process.ppid = parseInt(e.data.worker.ppid || "0");
```

**修复**: 在 `initializeSyncWorker` 中设置 `globalThis.process.pid`（值来自 `e.data.worker.tid`）。

---

### #6 ppid — 低优先级

**位置**: `web/worker/worker.go:133-141`

**问题**: `Resource.Start()` 发送的 worker message 中没有包含 `ppid`。

**修复**:
```go
"worker": map[string]any{
    ...
    "ppid": r.task.Parent().ID(),  // 如果 parent 存在
}
```

---

### #7 ConsoleStdout — 低优先级

**位置**: `wasi/worker/worker.js:137-138`

当前被注释。开启后可提供 console.log fallback 用于调试。

---

## 已知外部问题

### TinyGo asyncify 参数上限

**文件**: `tinygo-issues.md`

TinyGo 编译的部分 WASM 二进制（如 bubbletea examples）因 LLVM asyncify 转换生成超过 1000 个参数的函数签名，被浏览器拒绝：
```
Chrome:  param count of 1713 exceeds internal limit of 1000
Firefox: too many arguments in signature
```

**推荐**: 对使用 goroutine 的程序，用 Go 标准编译器编译（`GOOS=js GOARCH=wasm`），走 gojs driver。

## 交叉 spawn (gojs↔wasi)

**文件**: `interop.md`

两种 worker 之间的 parent-child 关系不需要特殊处理：
- task 层级、namespace 继承、FD 继承、port/9P 通道都独立于 driver
- wasi worker 需要 SharedArrayBuffer（需要 COOP/COEP header）
- 反向 wasi→gojs spawn 需要先补 #3（child_process.spawn）

## 关键参考文件

| 文件 | 内容 |
|------|------|
| `wasi-diff.md` | gojs vs wasi worker 完整差异分析 |
| `interop.md` | 交叉 spawn 架构说明 |
| `autowasi.md` | WASM 二进制自动检测设计方案 |
| `tinygo-issues.md` | TinyGo asyncify 参数上限问题 |
| `wasi/worker/worker.js` | wasi worker 入口（需要修改） |
| `gojs/worker/worker.js` | gojs worker 入口（对照参考） |
| `web/worker/worker.go` | Worker 创建和消息发送（ppid） |
| `task.go` | Task.FD()、fdFS、VFSOpen 实现 |
| `api/spawn.go` | spawn RPC handler，auto driver 入口 |
| `wasmdetect.go` | DetectWASMKind 函数 |
