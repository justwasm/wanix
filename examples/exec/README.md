# os/exec Demo

Demonstrates `os/exec` process spawning in Wanix with the patched Go standard library.

## Demos

| # | Feature | What it shows |
|---|---------|---------------|
| 1 | `Output()` | Capture child stdout |
| 2 | `StdinPipe` | Pipe data to child stdin |
| 3 | Custom env | Child inherits or overrides environment |
| 4 | Non-zero exit | `exec.ExitError` with correct exit code |
| 5 | `Start()` + `Wait()` | Async spawn, get PID, await exit |
| 6 | `CommandContext` | Deadline, pre-start cancel, mid-execution kill (3s → exit 9) |
| 7 | Env variants | Inherit vs empty vs custom subset |
| 8 | `CombinedOutput` | Implicit stdout+stderr capture |

## How it works

The patched Go at `/go` (1.27.0-wanix.6) adds `js/wasm` support for:

- **`syscall.StartProcess`** — bridges to `child_process.spawn`, which calls the kernel's `Spawn` RPC
- **`syscall.Wait4`** — bridges to `child_process.wait`, which polls `#task/{pid}/exit`
- **`syscall.Pipe`** (in `fs_js_hackpad.go`) — bridges to `fsCall("pipe")`, creating kernel pipe fds
- **`syscall.Kill`** (in `syscall_js_hackpad.go`) — bridges to native `process.kill(pid, sig)`, which writes `terminate` to `#task/{pid}/ctl`, triggering the kernel's `Terminate` handler

Mid-execution context cancellation terminates the child Web Worker and writes exit code 9, enabling proper `exec.CommandContext` behavior on `js/wasm`.

## Build & Run

```sh
cd examples/exec
GOOS=js GOARCH=wasm /go/bin/go build -o exec.wasm .
cd /root/wanix && go run ./examples/serve.go
# Open http://localhost:7070/examples/exec/
```

## Output

```
=== os/exec demo ===

--- 1. Output() — capture stdout ---
Got: hello,wanix

--- 2. StdinPipe — send data to child ---
Got:
Hello from child! Reading stdin...
echo: hello

--- 3. Custom environment ---
Got:
MY_VAR=hello
ANOTHER=world

--- 4. Non-zero exit code ---
Got exit code: 7 (expected 7)

--- 5. Start() + Wait() — async spawn ---
Child started, PID: 7
Waited, exit code: 0

--- 6. CommandContext — cancellation ---
Child completed within deadline: within,deadline
Got expected error: context canceled
   (spawning 10s sleep, cancelling after 3s...)
   (killed after 3.061s)
Got expected error: exit status 9

--- 7. Env — inherit vs empty ---
Inherited PATH: PATH=/
Empty env child sees:
PATH=
HOME=
Custom env child sees:
MY_VAR=only_this
PATH=/custom

--- 8. CombinedOutput — implicit stdout+stderr ---
Combined output:
hello,stderr

=== ALL PASSED ===
```
