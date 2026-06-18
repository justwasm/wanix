# WASI vs GOJS Worker 差异分析

## 数据流对比

### GOJS 输出路径

```
Go WASM binary
  └─ runtime.wasmWrite(fd, ptr, n)                  [gojs/worker/worker.js:678-684]
      → sys.write(fd, buf)
      → WanixHandle.write(fd, data)                  [handle.js:128-131]
      → peer.call("Write", [fd, data])
      → MessageChannel port → Go-side Write handler   [api/write.go]
      → s.task.FD(fd) → task.fds[fd] → write(f)
```

### WASI 输出路径

```
WASM binary
  └─ fd_write(fd, iovs, ...)
      → browser_wasi_shim 内部 Fd.fd_write()
      → OpenFile.fd_write(data)                      [wasi/fs.ts:161]
      → FileHandle.write(data, {at})                  [wasi/wanix.ts:60-66]
      → CallBuffer.call("fd_write", {fd, data, at})   [wasi/callbuffer.ts:42-48]
      → postMessage(params)
      → coordinator messageHandler["fd_write"]        [wasi/worker/worker.js:109-112]
      → WanixHandle.write(fd, data)                   [handle.js:128-131]
      → peer.call("Write", [fd, data])
      → MessageChannel port → Go-side Write handler
      → s.task.FD(fd) → task.fds[fd] → write(f)
```

---

## 发现的差异

### 1. `#task/{id}/fd/{n}` 路径不存在

**现象**: WASI worker 的 `initializeSyncWorker` 把 `stdout: "#task/{tid}/fd/1"` 传递给 sub-worker。
sub-worker 创建 `FileHandle(caller, "#task/{tid}/fd/1")`，调用 `open()` → `path_open` → coordinator → `fs.open("#task/{tid}/fd/1")` → 进入 Go Open handler。

Open handler 最终调用 `s.task.NS().Open("#task/{tid}/fd/1")`。
NS → TaskFS → lookup task → `Task.Open("fd/1")` → `Task.ResolveFS(ctx, "fd/1")`。

**问题**: `Task.ResolveFS` 的 MapFS 中没有 `"fd"` 条目：
```go
// task.go:259-341
func (r *Task) ResolveFS(ctx context.Context, name string) (fs.FS, string, error) {
    m := fskit.MapFS{
        "ctl": ...,
        "id": ...,
        "cmd": ...,
        "env": ...,
        "dir": ...,
        "exit": ...,
        "binds": ...,
        "ns": r.ns,
        // ⚠️ 没有 "fd" 条目
    }
}
```

**影响**: `path_open` 失败 → `FileHandle.fd` 为 `undefined` → 后续所有 `fd_write` 发送 `fd: undefined` → `fs.write(undefined, data)` 失败 → **输出完全丢失**。

**修复方向**: 在 `Task.ResolveFS` 中添加 `fdFS` 类型，直接暴露 `task.fds` 表：
```go
type fdFS struct{ task *Task }

func (f *fdFS) Open(name string) (fs.File, error) {
    fd, _ := strconv.Atoi(name)
    f.task.mu.Lock()
    defer f.task.mu.Unlock()
    of, ok := f.task.fds[fd]
    if !ok { return nil, fs.ErrNotExist }
    return of.file, nil
}
```

注意：`Task.FD()` 中的 VFS fallback 需要移除，否则会造成死锁（`Task.FD()` 持有 `r.mu`，然后又通过 NS → `fdFS.Open` 试图锁 `r.mu`）。

---

### 2. WASI stdin 是 OpenEmptyFile

**位置**: `wasi/worker/worker.js:131-132`

```javascript
// 当前
new OpenEmptyFile(),                                     // fd 0: 永远 EOF
// new OpenFile(new File(new FileHandle(caller, e.data.stdin))),  // 被注释掉了
```

**GOJS 对照**: stdin 通过 `sys.read(fd, count)` 直接从 VFS 读取。

**影响**: 交互式程序（如 bubbletea TUI）无法读取键盘输入。

**修复方向**: 取消注释真实 stdin，同时处理 `#task/{tid}/fd/0` 路径（与 fd/1 相同问题）。

---

### 3. WASI 没有设置 process.pid

**位置**: `wasi/worker/worker.js`

**GOJS 对照** (`gojs/worker/worker.js:15-16`):
```javascript
globalThis.process.pid = parseInt(tid);
globalThis.process.ppid = parseInt(e.data.worker.ppid || "0");
```

**影响**: TinyGo Go class 中 `process.pid` 默认 `-1`，Go 程序的 `os.Getpid()` 返回 -1。

**修复方向**: 在 `initializeSyncWorker` 中设置 `globalThis.process.pid`。

---

### 4. WASI 没有设置工作目录

**GOJS 对照** (`gojs/worker/worker.js:22`):
```javascript
globalThis.cwd = (await fs.readText(`${TASKNS}/${tid}/dir`)).trim() || "/";
```

**WASI**: 完全没有读取 `#task/{tid}/dir`，也没有设置 `globalThis.cwd`。

**影响**: 依赖 `process.cwd()` 的程序（如通过相对路径加载资源）会失败。

**修复方向**: 在 `initializeSyncWorker` 中读取 dir 并设置为 `globalThis.cwd`。

---

### 5. WASI 没有 cleanpath

**GOJS 对照** (`gojs/worker/worker.js:84-112`):
```javascript
function cleanpath(path) {
    if (path.startsWith("./")) path = path.slice(2);
    if (path === "/") return ".";
    if (!path.startsWith("/")) path = [globalThis.cwd, path].join("/");
    path = path.replace(/\/+/g, '/');
    const parts = path.split('/');
    const stack = [];
    for (const p of parts) {
        if (p === "" || p === ".") continue;
        stack.push(p);
    }
    path = stack.join('/');
    if (path === "") return ".";
    return path;
}
```

**WASI**: 直接使用 `args[0]` 作为文件路径。

**影响**: 带 `./` 前缀或相对路径的 WASM 二进制无法被找到。

**修复方向**: 在 `initializeSyncWorker` 中应用 cleanpath 逻辑。

---

### 6. WASI 没有 child_process.spawn

**GOJS 对照** (`gojs/worker/worker.js:450-471`):
```javascript
globalThis.child_process = {
    async spawn(name, args, opts, callback) { ... sys.spawn(name, args, opts) ... },
    async wait(pid, callback) { ... sys.wait(pid) ... },
};
```

**WASI**: 完全没有 `child_process` 实现。

**影响**: WASI 程序内部的 `os/exec.Command()`（通过 fork 的 Go toolchain）无法创建子进程。

**修复方向**: 添加 `child_process.spawn` 和 `child_process.wait`。

---

### 7. WASI 的 ConsoleStdout 被注释

**位置**: `wasi/worker/worker.js:137-138`

```javascript
// ConsoleStdout.lineBuffered(msg => { console.log(`[WASI stdout] ${msg}`); }),
// ConsoleStdout.lineBuffered(msg => console.warn(`[WASI stderr] ${msg}`)),
```

虽然 `FileHandle.write` 已经走 VFS（区别于 GoJS 的 Go class fd_write 只 console.log），但开启 ConsoleStdout 可以作为一种 fallback 调试手段。

---

### 8. WASI worker 没有 `Resource.Start` 发送 `ppid`

**位置**: `web/worker/worker.go:133-141`

```go
r.worker.Call("postMessage", map[string]any{
    "worker": map[string]any{
        "id":   r.id,
        "tid":  r.task.ID(),
        "port": port,
        "p9":   p9,
        "cmd":  strings.Join(args, " "),
        "env":  env,
        "url":  url,
        // ⚠️ 没有 "ppid"
    },
}, []any{port, p9})
```

**影响**: WASI 和 GOJS 的 `ppid` 都默认为 `"0"`。

**修复方向**: 在消息中添加 `"ppid": r.task.Parent().ID()`（如果 parent 存在）。

---

## 修复状态

| # | 修复项 | 状态 |
|---|--------|------|
| 1 | `fd/` 目录 + `VFSOpen` | ✅ 已修复 |
| 2 | WASI stdin | ❌ 未修复 |
| 3 | WASI process.pid | ❌ 未修复 |
| 4 | WASI 工作目录 | ❌ 未修复 |
| 5 | WASI cleanpath | ❌ 未修复 |
| 6 | WASI child_process.spawn | ❌ 未修复 |
| 7 | ppid 发送 | ❌ 未修复 |
| 8 | ConsoleStdout 调试 | ❌ 未修复 |

| # | 修复项 | 影响 | 难度 |
|---|--------|------|------|
| 1 | ~~`fd/` 目录添加到 Task.ResolveFS~~ | **已修复** — `fdFS` + VFSOpen 让 `path_open` 成功 | 低 | ✅
| 2 | WASI stdin 启用 | 交互式程序不可用 | 低 |
| 3 | WASI process.pid | `os.Getpid()` 返回 -1 | 低 |
| 4 | WASI 工作目录 | 相对路径加载资源失败 | 低 |
| 5 | WASI cleanpath | 相对路径 WASM 找不到 | 低 |
| 6 | WASI child_process.spawn | 子进程创建 | 中 |
| 7 | ppid 发送 | 父进程 ID 为 0 | 低 |
| 8 | ConsoleStdout 调试 | 调试困难 | 低 |
