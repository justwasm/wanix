# PTY Demo

Demonstrates `/dev/ptmx` pseudo-terminal support in Wanix.

## API

```go
import "tractor.dev/wanix/pty"

masterFD, slaveFD, err := pty.Open()
```

`pty.Open()` allocates a PTY pair and returns both file descriptors:
- `masterFD` — for the parent process (read/write)
- `slaveFD` — for the child process (pass as stdin/stdout/stderr)

## How it works

1. `pty.Open()` → calls `globalThis.pty.open()` → RPC `Openpty` → kernel allocates PTY pair → returns both fds
2. Parent spawns child with `cmd.Stdin/Stdout/Stderr = slave`
3. I/O flows: terminal ↔ master ↔ slave ↔ child

## Build & Run

```sh
make
cd /root/wanix && go run ./examples/serve.go
# Open http://localhost:7070/examples/pty-demo/
```
