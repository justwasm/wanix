# Wanix exec Support — Implementation Complete

## Summary

Implemented full `os/exec` support for Wanix's gojs workers. Go programs running in Wanix
Web Workers can now use `exec.Command(...).Run()` and `os.Pipe()` through the standard Go
API, with each child process running in its own Web Worker.

## Changes

### 1. Go Toolchain (`justwasm/go`)

**`src/syscall/syscall_js_hackpad.go`** — `StartProcess` changed to hybrid sync/callback:

```
Before: jsChildProcess.Call("spawn", name, args, opts)
        pid = ret.Get("pid").Int()  ← synchronous return

After:  jsChildProcess.Call("spawn", name, args, opts, callback)
        if ret.Truthy() && ret.Get("pid").IsNumber() {
            pid = ret.Get("pid").Int()  ← hackpad mode (sync)
        } else {
            res := <-ch  ← Wanix mode (callback via channel)
        }
```

This is backward-compatible: hackpad's spawn ignores the extra callback arg and returns
`{pid}` synchronously; Wanix's spawn invokes the callback asynchronously.

**`src/syscall/fs_js_hackpad.go`** — New: `Pipe()` implementation
- Calls `globalThis.fs.pipe(callback)` via `fsCall`
- Registers returned fds in the Go runtime's `files` map as `&jsFile{}`

**Toolchain rebuilt**: `go1.27-devel_7fe5319f21`

### 2. Wanix Kernel (`wanix/`)

**`task.go`** — Added `Task.Alloc(kind string) (*Task, error)` for creating child tasks
from within the kernel (needed by Spawn RPC handler); `Task.SetFD()` for registering fds
at specific indices; `nullFile` fallback for unregistered fds; `Task.FD()` fix for fd<3
to prioritize `r.fds[fd]` before trying VFS path.

**`api/spawn.go`** — New: Spawn RPC handler
- Allocates a child task via `parent.Alloc("gojs")`
- Writes cmd/env/dir through task's virtual filesystem
- Handles stdio fd binding (inherit, pipe with term allocation)
- Starts the task (triggers driver → creates Web Worker)
- Returns `{pid}` to caller

**`api/wait.go`** — New: Wait RPC handler
- Polls `#task/{pid}/exit` with 30s timeout
- Returns `{pid, exitCode}`

**`api/pipe.go`** — New: Pipe RPC handler with `chanPipe` (reference-counted,
channel-based pipe so `Close()` on one writer doesn't affect others)

**`api/api.go`** — Registered handlers: `Spawn`, `Wait`, `Pipe`

**`api/write.go`** — Bug fix: removed duplicate `r.Return(uint64(n))` call that caused
the mux session to error out on closed channel, breaking all concurrent RPCs.

### 3. Wanix JS Bridge

**`api/handle.js`** — Added `WanixHandle` methods:
- `spawn(name, args, opts)` → RPC `"Spawn"`
- `wait(pid)` → RPC `"Wait"`
- `pipe()` → RPC `"Pipe"`

**`gojs/worker/worker.js`** — Added:
- `globalThis.fs.pipe(callback)` — invokes `sys.pipe()`, returns `[readFd, writeFd]`
- `globalThis.child_process.spawn(name, args, opts, callback)` — RPC to kernel, returns `{pid}`
- `globalThis.child_process.wait(pid, callback)` — RPC to kernel, returns `{pid, exitCode}`

### 4. Third-party patches

**`patches/toolkit-go/duplex/mux/session.go`** — Fix: `onePacket()` returns `nil` instead of
`fmt.Errorf("qmux: invalid channel %d", id)` when a message arrives for an unknown channel.
The JS side handles this situation gracefully (it's a race between channel closing and
receiving a data frame), so returning an error causes the session loop to exit, dropping
ALL pending RPC channels. Used via `go.mod replace` directive (same pattern as `misc/cbor`).

### 5. Hackpad (`justwasm/hackpad`)

No changes needed — `spawn()` already handles extra args gracefully.

## Data Flow

```
Go program in Wanix gojs worker:
  exec.Command("editor", "main.go").Run()
    → os.StartProcess() (patched Go stdlib)
      → syscall.StartProcess()
        → js.Global().Get("child_process").Call("spawn", name, args, opts, callback)
          → globalThis.child_process.spawn(name, args, opts, callback)
            → sys.spawn(name, args, opts)  [RPC via MessagePort]
              → kernel api.spawn() handler
                → parent.Alloc("gojs") → child task created
                → write cmd/env/dir via #task/{id}/...
                → child.Start() → gojs driver → new Worker(blobURL)
                → return {pid: child.ID()}
            → callback(null, {pid})
          → Go goroutine resumes with pid

  cmd.Wait()
    → syscall.Wait4(pid, ...)
      → childProcessCall("wait", pid, callback)
        → globalThis.child_process.wait(pid, callback)
          → sys.wait(pid)  [RPC]
            → kernel api.wait() handler
              → poll #task/{pid}/exit → exitCode
              → return {pid, exitCode}
          → callback(null, {pid, exitCode})
        → Go goroutine resumes with exit code

  os.Pipe()
    → syscall.Pipe() (patched Go — fs_js_hackpad.go)
      → fsCall("pipe")
        → globalThis.fs.pipe(callback)
          → sys.pipe() → peer.call("Pipe", [])
            → kernel api.pipe() handler
              → chanPipe created, fds allocated in task FD table
              → return [readFd, writeFd]
          → callback(null, [readFd, writeFd])
        → files[readFd] = &jsFile{}, files[writeFd] = &jsFile{}
      → os.File wrapping the fds returned
```

## Verification

- `justwasm/go` syscall package: compiles
- `justwasm/hackpad` WASM build: clean
- `wanix` api/ gojs/ web/ wasm packages: clean
- `wanix` WASM kernel (`GOOS=js GOARCH=wasm`): builds with `replace` for toolkit-go

## Demo Results (all 6 pass)

1. `exec.Command().Output()` — captures stdout correctly
2. `exec.Command().CombinedOutput()` — merges stdout/stderr
3. Custom environment variables — `ENV[DEMO_VAR]=custom_value_from_parent` passes
4. Non-zero exit code — `exit:42` correctly caught as `exec.ExitError`
5. `os.Pipe()` — `Pipe read: hello through pipe` correctly displayed
6. Sequential spawn — 3 children spawned and captured in sequence
