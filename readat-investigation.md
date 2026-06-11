# Investigation: Go `.a` File objapi Header Corruption

## Summary

`go build std` fails in wanix because `.a` file objapi headers become corrupted. A 17-byte sequence ("go object js was") gets replaced by 65 bytes of garbage with an A/B/A structure (20/23/20 base64 chars). The root cause is in `gojs/worker/worker.js:280-293` — the `fs.read` callback **ignores the `position` parameter**, causing `Pread`-based reads to use stream offsets instead of absolute offsets.

## Root Cause

**File**: `gojs/worker/worker.js:280-293`

The `fs.read` callback calls `await sys.read(fd, length)` without passing `position`. When Go's runtime calls `Pread(fd, buf, offset)` on a seeked file, it expects the JS `read` callback to perform an absolute read at `offset`. Instead, the kernel's `read` handler (`api/read.go:10-42`) calls `f.Read(buf)` which uses the internal file position (stream read).

**Concurrency model** compounds the issue:
- `js.FuncOf` creates JS callbacks driven by the event loop
- When one goroutine blocks waiting for its `fsCall` callback, **the JS event loop demultiplexes callbacks from other goroutines**
- This creates interleaved execution where file positions become unpredictable

A seeked file goes through `Pread(fd, buf, f.pos)` (absolute offset), but the implementation treats it as a stream read, so concurrent callbacks advance the position incorrectly.

## Data Flow

1. **Go `Read(fd, []byte)`** (`go/src/syscall/fs_js.go:411`): `fsCall("read", fd, buf, 0, len(b), nil)` → `position = null`
2. **Go `Pread(fd, []byte, offset)`** (`go/src/syscall/fs_js.go:468`): `fsCall("read", fd, buf, 0, len(b), offset)` → `position = <int64>`
3. Go runtime converts `fsCall` → JS `globalThis.fs.read(fd, buffer, offset, length, position, callback)`
4. **`worker.js` read callback** ignores `position`, calls `sys.read(fd, length)` (no position)
5. **Kernel `read` RPC handler** (`api/read.go:10-42`): `f.Read(buf)` — stream read using internal file offset

## Key Files

| File | Lines | Role |
|---|---|---|
| `gojs/worker/worker.js` | 278-293 | **Primary bug** — `read` callback ignores `position` |
| `api/read.go` | 10-42 | Kernel `read` RPC handler — uses stream `f.Read()` |
| `go/src/syscall/fs_js.go` | 411-430 | Go `Read()` — stream read with `position = nil` |
| `go/src/syscall/fs_js.go` | 468-478 | Go `Pread()` — absolute read with actual `offset` |
| `gojs/worker/worker.js` | 216-224 | `ftruncate` callback (works correctly, unrelated) |
| `gojs/worker/worker.js` | 225-233 | `flock` callback (works correctly, unrelated) |

## Ruled-Out Causes

1. **`wasmMinDataAddr` mismatch** — Correct fix (should be `131072`) but not root cause
2. **MessageChannel transfer sharing buffers** — Transport layer correctly copies
3. **Mux protocol buffer reuse** — `ReadBuffer.concat` creates new `Uint8Array`
4. **CBOR `readBin` subarray aliasing** — Each RPC call uses fresh temp array
5. **p9 tag concurrency** — p9 library tag matching is correct
6. **`nodeFile.WriteAt` race** — Each file has distinct `nodeFile` instance
7. **`flock`/`ftruncate` stubs causing confusion** — Separate callbacks and RPC handlers, no confusion

## Proposed Fix (not yet applied)

### 1. Fix `worker.js` read callback (`gojs/worker/worker.js:283`)

When `position !== null`, pass it to the RPC:
```js
// Before:
const data = await sys.read(fd, length);
// After (conceptual):
const data = position !== null 
  ? await sys.read(fd, length, position) 
  : await sys.read(fd, length);
```

### 2. Fix kernel `read` handler (`api/read.go:31`)

Add an optional `offset uint64` parameter. When a valid position is provided, use `fs.ReadAt(f, buf, int64(position))` instead of `f.Read(buf)`.

### 3. Sync `wasmMinDataAddr` to `131072` (cosmetic, not root cause)

- `gojs/worker/worker.js:926`
- `wasm/wasm_exec.go.js:531`

## Reproduction

**File**: `cmd/repro/main.go` — a standalone test program that compiles and runs but cannot trigger the race in pure Go (the race requires the JS event loop interleaving).

**Environment**:
- Patched Go toolchain at `/go` (with `wasmMinDataAddr = 131072`)
- wanix runtime at `/root/wanix`
- Demo at `/root/wanix/examples/go-repl/`

To reproduce: run `examples/go-repl/run.sh` and execute `go build std` inside the repl.
