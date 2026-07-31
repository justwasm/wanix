# WASM Module Cache

## Problem

Every WASM sub-process spawn (Go compiler toolchain: compile, asm, link, etc.)
reads the `.wasm` binary from VFS, then compiles it from scratch via
`WebAssembly.compile()` or `WebAssembly.instantiate()`. This is the dominant
cost (~hundreds of ms) per spawn, even when the same binary is used repeatedly.

## Architecture

```
Go kernel (main thread, JS heap)
  │
  ├─ driver.Start(t)
  │    ├─ io.ReadAll(f)        // read .wasm binary from task namespace
  │    ├─ cache.GetOrCompile(path, bin)
  │    │    ├─ hit  → return cached WebAssembly.Module
  │    │    └─ miss → WebAssembly.compile(bin) → store → return
  │    └─ StartTaskWorker(..., module)
  │         └─ Resource.Start()
  │              └─ postMessage({worker: {wasmModule: module, ...}})
  │                   ↕ structured clone
  │                   Web Worker (JS)
  │                     └─ WebAssembly.instantiate(module, imports)
  │                          ↑ skips compilation
  │
  └─ WASM linear memory
       └─ map[string]js.Value  // ~8 bytes + key per entry, not the Module itself
```

Key insight: `WebAssembly.Module` is a structured-clone-compatible JS object.
It lives in the browser's JS heap, **not** in WASM linear memory. The Go side
only holds an 8-byte `js.Value` reference. The 4GB WASM limit is unaffected.

## Cache policy

| Property | Value |
|---|---|
| Key | WASM file path (e.g. `/go/compile.wasm`) |
| Value | `WebAssembly.Module` (compiled native code) |
| Max entries | 32 |
| Eviction | LRU by insertion order |
| Invariant | Zero bytes consumed from WASM linear memory |

## Comparison with hackpad

Hackpad's `wasmCacheFs` uses the same approach — `map[string]js.Value` in Go
(`syscall/js`) + `WebAssembly.compile()` + LRU eviction. The difference is
that hackpad wraps the filesystem layer, while wanix caches at the driver
layer because compilation happens in separate Web Workers.

## Worker data flow

The compiled `WebAssembly.Module` is passed to sub-workers via `postMessage`.
The structured clone algorithm special-cases `WebAssembly.Module` by
transferring the underlying native code directly (no byte-level serialization).

- **If `wasmModule` is present**: worker calls `WebAssembly.instantiate(module, imports)` — zero compilation
- **Fallback**: if no module is provided (e.g. JS driver), worker falls back to
  `WebAssembly.compile(bin)` as before

## Files

| File | Role |
|---|---|
| `wasm/cache/cache.go` | Cache implementation (`GetOrCompile`, `Drop`, `Clear`) |
| `wasi/driver.go` | WASI driver: read binary, cache, pass module |
| `gojs/driver.go` | GoJS driver: read binary, cache, pass module |
| `web/worker/task.go` | `StartTaskWorker` accepts optional module |
| `web/worker/worker.go` | `Resource.wasmModule` field, postMessage wiring |
| `wasi/worker/worker.js` | Worker JS: use cached module if present |
| `gojs/worker/worker.js` | Worker JS: use cached module if present |
