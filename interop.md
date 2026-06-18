# GoJS ↔ WASI 交叉 spawn 兼容性

## 问题

gojs worker（Go `GOOS=js GOARCH=wasm`）中通过 `os/exec.Command("tinygo_app.wasm")` 能否创建 wasi 子进程？反过来，wasi worker 中能否创建 gojs 子进程？

## 答案：可以，但依赖 SharedArrayBuffer

当前 wanix 架构天然支持跨 driver 的父子进程关系，不需要特殊处理。

## 数据流

```
gojs worker 中 os/exec.Command("tinygo.wasm")
  →  forked Go toolchain syscall.StartProcess
    → js.Global().Get("child_process").Call("spawn", ...)
      → gojs worker.js: child_process.spawn
        → sys.spawn(name, args, opts) → RPC
          → Go kernel api/spawn.go: syscaller.spawn
            → parent.Alloc("auto")
              → auto driver → wasi.Driver.Check() 匹配
                → wasi.Driver.Start()
                  → worker.StartTaskWorker()
                    → web/worker/worker.go: Resource.Start()
                      → new Worker(wasi-worker-blob-url)
                      → _openPort(child_task_id)
                      → postMessage({worker: {tid, port, p9, ...}})
                        → wasi/worker/worker.js: initializeSyncWorker
```

## 为什么不需要特殊处理

父子进程的通信机制不依赖 worker 类型：

| 层次 | 机制 | driver 无关？ |
|------|------|:---:|
| **task 层级** | `parent.Alloc(kind)` → TaskFS 分配新 ID，存入 resources map | ✅ |
| **namespace 继承** | 子 task 的 NS = parent NS 的 clone（`vfs.New(ctx)` + `parent.ns.Clone(ctx)`） | ✅ |
| **FD 继承** | `child.SetFD(i, file, fp)` — 从 parent FD 表（或 pipe/term）传递文件句柄 | ✅ |
| **RPC 通道** | `_openPort(t.ID())` 创建 MessageChannel，绑定到子 task 的 Go-side syscaller | ✅ |
| **9P 通道** | `_open9P(t.ID())` 创建子 task namespace 的 9P 服务器 | ✅ |
| **Worker 创建** | `new Worker(blobURL)` — 浏览器标准 API | ✅ |
| **WASM 启动** | blobURL 中的 worker.js 内容由 driver 决定 | ❌ 不同 |

**关键点**：`_openPort(child_task_id)` 返回的 port 连接到子 task 的 Go-side RPC handler。无论子 task 的 worker 是 gojs 还是 wasi 模板，所有 `fs.write(fd, data)`、`fs.readFile(path)` 等 RPC 调用都走同一个 Go kernel 的 `api/` handler，使用子 task 的 FD 表和 namespace。

## 唯一阻塞：SharedArrayBuffer

```
wasi/worker/worker.js:35
  const buffer = new SharedArrayBuffer(16384);
  → ReferenceError: SharedArrayBuffer is not defined
```

wasi worker 的 `callbuffer.ts` 用 SharedArrayBuffer + `Atomics.wait/notify` 做同步 IPC。这是 Web Worker 里实现阻塞式 WASI syscall 的唯一方式。

### 修复方案

**A. 保证 COOP/COEP header (推荐)**

页面 HTTP 响应头必须包含：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`wanix serve` 已经内置了这些 header。如果是其他部署方式（如 CDN、反向代理），需要上游保证。

**B. 非 SAB fallback (不推荐)**

可以把 `CallBuffer` 改成 `Atomics.waitAsync` + `MessageChannel` 模式，但：
- `Atomics.waitAsync` 只有 Chrome 支持
- 语义不同（异步等待，需要额外的状态机）
- wasi worker 的双 worker 架构就是为 SAB 设计的，改起来相当于重写 wasi worker

## 修复状态 (2024-06-18)

`#task/{id}/fd/{n}` 路径不存在导致 `path_open` 失败的问题已修复：

- **`task.go`**: 新增 `fdFS` 类型暴露 task FD 表为 filesystem 目录
- **`Task.FD()`**: 保留 VFS fallback，通过 `VFSOpen()` 走 NS 找到 term/pipe bindings
- **死锁预防**: `fdFS.Open` 不加锁（setup 后无并发写），`VFSOpen` 依赖调用者 `Task.FD()` 已持锁

gojs→wasi 交叉 spawn 现在可以正常工作：`child_process.spawn` → wasi worker 启动 → `path_open` 成功 → `fd_write` 成功 → exit 正常。

### 剩余差异

见 `wasi-diff.md` 中的修复优先级表。接下来需修复：#2 stdin、#3 process.pid、#4 工作目录、#5 cleanpath、#6 child_process.spawn。
