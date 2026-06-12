# /dev/null + Pipe Demo

Tests three basic I/O primitives in Wanix:

- **`/dev/null`** — open (O_RDONLY, O_WRONLY, O_RDWR), read returns EOF, write discards
- **`io.Pipe`** — in-memory pipe, write/read round-trip, EOF after close
- **`os.Pipe`** — kernel pipe (via `Pipe` RPC), write/read round-trip, EOF after writer close
- **`pty.Open`** — PTY pair (via `/dev/ptmx`), bidirectional master↔slave write/read
- **`net.Pipe`** — in-memory TCP conn pair (`net.Conn`), bidirectional c1↔c2 write/read
- **`fs/pipe.New`** — wanix in-memory full-duplex `Port` pair, p1↔p2 write/read
- **`fs/pipe.PipeFS`** — wanix named pipe filesystem, read/write via `data`/`data1` files

## How it works

`/dev/null` is intercepted at the JS bridge layer (`worker.js` `open` callback) and forwarded to the kernel via a dedicated `OpenNull` RPC, which creates a `nullFile` that discards writes and returns EOF on reads.

`os.Pipe` works via the patched Go standard library (`/go/bin/go` 1.27.0-wanix.6), where `syscall.Pipe` (in `fs_js_hackpad.go`) calls `fsCall("pipe")`, mapped to the `pipe` callback in `worker.js`, which calls the kernel's `Pipe` RPC.

## Build & Run

```sh
make
cd /root/wanix && go run ./examples/serve.go
# Open http://localhost:7070/examples/pipes/
```

## Output

```
=== /dev/null test ===
OK: Open read succeeded
OK: Read returned EOF (0 bytes)
OK: Open write succeeded
OK: Write succeeded, data discarded
OK: Open rdwr succeeded
OK: Write rdwr succeeded
OK: Read rdwr returned EOF
=== ALL PASSED ===
=== io.Pipe test ===
OK: io.Pipe read/write matched
OK: io.Pipe EOF after close
=== ALL PASSED ===
=== os.Pipe test ===
OK: os.Pipe created
OK: os.Pipe write succeeded
OK: os.Pipe read/write matched
OK: os.Pipe EOF after write close
=== ALL PASSED ===
=== PTY test ===
OK: pty.Open succeeded
OK: master write succeeded
OK: master→slave data matched
OK: slave write succeeded
OK: slave→master data matched
OK: PTY closed
=== ALL PASSED ===
=== net.Pipe test ===
OK: net.Pipe read/write matched (c1→c2)
OK: net.Pipe EOF after close
OK: net.Pipe read/write matched (c2→c1)
=== ALL PASSED ===
=== wanix fs/pipe.New test ===
OK: p1 write succeeded
OK: p1→p2 data matched
OK: p2 write succeeded
OK: p2→p1 data matched
OK: EOF after close
=== ALL PASSED ===
=== wanix fs/pipe.PipeFS test ===
OK: opened data and data1 files
OK: data write succeeded
OK: data→data1 matched
OK: EOF after close
=== ALL PASSED ===
```
