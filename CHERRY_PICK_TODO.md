# Exec Branch Cherry-pick TODO

Source branch: `exec` at `e13de29`  
Target branch: `main` at `76779e3`  
Fork point: `6ee3251`

This is a dependency-ordered working checklist for selectively porting the
`exec` branch to `main`. Use `git cherry-pick -x <sha>` for commits marked
**direct**, and port the intent manually for commits marked **adapt**. Do not
cherry-pick the generated bundle until all JavaScript and package changes are
merged.

## Before starting

- [ ] Create a dedicated integration branch from `origin/main`.
- [ ] Preserve the current `exec` tip with a tag or backup branch.
- [ ] Isolate the current untracked workspace items (`checkzip/`,
  `examples/repl-rc/local.html`, `index.html`, `quirks.md`, and
  `watch_20260630-051441`) before operating on the worktree.
- [ ] Establish a baseline with `go test ./...`, `make js`, and `make smoketest`
  where the required local dependencies are available.

## Phase 1: Reconcile the `main` architecture first

`main` has renamed `wanix-system` to `wanix-namespace`, introduced a kernel,
reworked VFS routing, and flattened `rc/shell/*` to `rc/*`. Port the intent of
these commits onto those APIs instead of accepting old paths or element names.

- [ ] **adapt** `cdff390` - `elements/term.js, task.js: squash`
- [ ] **adapt** `bfac84d` - `get rid of WANIX_COLS,ROWS,XPIXEL,YPIXEL`
- [ ] **adapt** `3a3d77a` - `term: seed winch Broadcaster with initial dimensions at allocation time`
- [ ] **adapt** `2758bc5` - `elements/term.js: deduplicate dataset assignment in connectedCallback`
- [ ] **adapt** `6759861` - `fix(elements): add disconnectedCallback to WanixElement base class`
- [ ] **adapt** `e4fccc4` - `task: fix deadlock in VFSOpen and restore term binding fallback`
- [ ] **adapt** `e320e05` - `vfs: normalize paths at all entry points; fix cleanpath bugs in workers`
- [ ] **adapt** `48c1029` - `worker: fix cleanpath: crush/. -> crush`
- [ ] **adapt** `15ea9b6` - `rc: use os/exec for js/wasm`

Validation:

- [ ] Verify `wanix-namespace` and standalone resource elements still initialize tasks and terminals.
- [ ] Verify VFS path normalization against `main`'s `Route`/`Walk` model.
- [ ] Verify the `rc` commands build after applying the `rc/shell/*` to `rc/*` path migration.

## Phase 2: Core API support for processes and I/O

These commits establish the RPC contract that later GoJS/WASI worker and
`os/exec` changes depend on. Keep their relative order.

- [ ] **direct** `9b3b3fd` - `rm syscall`
- [ ] **direct** `c88d1e2` - `make flock report EWOULDBLOCK`
- [ ] **direct** `d8d1bf9` - `api/flock.go: cleanup with channel-backed TryLock`
- [ ] **direct** `2be1deb` - `add flock syscall compat layer`
- [ ] **direct** `dcff87c` - `api: add /dev/null support via openNull RPC`
- [ ] **direct** `8082d07` - `pty: remove wasm build constraint, rename to pty_impl.go`
- [ ] **direct** `1cf4a6f` - `api/read: fix io.EOF handling for partial reads (both read and readAt)`
- [ ] **direct** `fb78a3c` - `api: refactor pipe into interface with ringbuf (default) and chan (opt-in) implementations`
- [ ] **direct** `43ceff3` - `api, gojs: add ReadAt RPC to fix objapi header corruption in go build std`
- [ ] **direct** `193bc02` - `api, gojs: implement flock using per-path userspace mutexes`
- [ ] **direct** `7a3d199` - `gojs: add flock ENOSYS stub, clear build cache before compile`
- [ ] **direct** `7e1bc82` - `api, gojs: remove hardcoded wait timeout, fix errback error propagation`
- [ ] **direct** `573d34d` - `api/chtimes: handle integer timestamps in toSeconds helper`
- [ ] **adapt** `73356d1` - `api, gojs: add os/exec and os.Pipe support via Spawn/Wait/Pipe RPC`

Validation:

- [ ] Run `go test ./api ./pty ./term`.
- [ ] Exercise pipe EOF, partial `ReadAt`, flock contention, `/dev/null`, and PTY window-size behavior.
- [ ] Confirm the Spawn/Wait/Pipe RPC uses `main`'s task and VFS interfaces.

## Phase 3: WASM detection, GoJS, and WASI workers

`main` already introduced WASM type detection and changed task argument/bind
handling. Compare its implementation before applying the overlapping commits;
preserve behavior from both sides rather than choosing one wholesale.

- [ ] **adapt** `d12cf36` - `os/exec: remove .wasm suffix check from driver Check methods; add logging`
- [ ] **adapt** `d3846d6` - `os/exec: auto-detect WASM binary type (gojs vs wasi) for child tasks`
- [ ] **adapt** `2a829ad` - `wasm: sync wasmMinDataAddr to 131072`
- [ ] **adapt** `4afb077` - `gojs, wasi: sync readAt and flock into lib.js bundles`
- [ ] **adapt** `35f0981` - `gojs/worker: fix read syscall to respect buffer offset parameter`
- [ ] **adapt** `b1159a9` - `gojs/worker: fix write syscall to handle non-zero buffer offset`
- [ ] **adapt** `abff655` - `task: add terminate support for process killing`
- [ ] **adapt** `fb1440c` - `wasm/cache: add compiled WebAssembly.Module cache for worker processes`
- [ ] **direct** `8583056` - `wasm/cache: add design document`
- [ ] **adapt** `38ef7a3` - `fix(gojs/worker): use Instance directly from two-step instantiate`
- [ ] **adapt** `5c5d439` - `fix(wasi/worker): forward cached wasmModule to inner sync worker`
- [ ] **adapt** `ed361ff` - `fix(wasm/cache): verify content hash to detect binary changes`
- [ ] **adapt** `53be125` - `fix: terminate Web Workers after Go/WASI program exit`
- [ ] **adapt** `fd18766` - `fix: gate gojs worker debug logging on wanix-system debug attr`
- [ ] **adapt** `e1c5bf5` - `fix: include worker metadata in startup logs`

Validation:

- [ ] Run GoJS and WASI programs through the same auto-detection path.
- [ ] Verify non-zero buffer-offset reads and writes.
- [ ] Verify explicit process termination and natural program exit both release workers.
- [ ] Verify cache reuse, then replace a WASM binary and confirm hash-based cache invalidation.
- [ ] Update the debug attribute integration for `wanix-namespace` rather than restoring `wanix-system`.

## Phase 4: FSA persistence and write consistency

These changes touch the same VFS/FSA semantics that `main` changed. Port them
after Phase 1, treating the replacement of local CBOR as a dependency decision.

- [ ] **adapt** `12e9e35` - `replace local cbor vendored dir with justwasm/cbor/v2 fork`
- [ ] **adapt** `bba7282` - `fsa: replace CBOR #stat with IndexedDB metadata; fix directory rename`
- [ ] **adapt** `ff3aa1b` - `fix(fsa): return logical offset from Stat when WritableFileStream has uncommitted writes`
- [ ] **adapt** `1b5b00e` - `fix(fsa): buffer uncommitted writes to serve subsequent reads`
- [ ] **adapt** `d40cf32` - `fix(fsa): always refresh file snapshot and clean up on close error`
- [ ] **skip / historical only** `f430b31` - `fsa: debug no persist #stats file`

Validation:

- [ ] Decide whether the `github.com/justwasm/cbor/v2` fork is still required on top of `main`'s Go 1.26 dependency set.
- [ ] Test directory rename, metadata persistence across reload, uncommitted-write reads, logical offsets, and close-error cleanup.

## Phase 5: Process behavior fixes

- [ ] **adapt** `17d82ff` - `fix: propagate CWD to child processes on spawn`
- [ ] **adapt** `82aeed9` - `fix: preserve argument boundaries in spawn command line`
- [ ] **adapt** `3f7a06e` - `fix: add shell-aware splitCmd to JS workers`

Validation:

- [ ] Run child programs with a non-root CWD.
- [ ] Test quoted arguments, arguments containing whitespace, and shell command parsing.

## Phase 6: Dependencies, build tooling, and terminal addons

Apply dependency changes only after resolving the merged runtime API. Regenerate
the distribution bundle instead of cherry-picking it before its sources.

- [ ] **adapt** `ead5878` - `use repo url for toolkit-go replace`
- [ ] **adapt** `7d982b2` - `xterm: add @xterm/addon-clipboard, image addon, cursor trail addon`
- [ ] **direct** `806fe7a` - `add js.sh as alternative to buildjs.go`
- [ ] **adapt** `47d8dc3` - `fix: prevent esbuild loader configuration leaking between builds`
- [ ] **adapt** `d434978` - `bump esbuild v0.28.1`
- [ ] **regenerate, do not cherry-pick directly** `e13de29` - `make js`

Validation:

- [ ] Keep `main`'s Go 1.26/p9/x-net updates while resolving `toolkit-go`, CBOR, esbuild, and xterm versions.
- [ ] Run `go mod tidy`, inspect the result, run `npm install`, then run `make js`.
- [ ] Check `git diff --check` and review the regenerated `dist/wanix.min.js`.

## Phase 7: Examples and documentation

Examples depend on the prior runtime phases. Apply after the runtime works, and
update markup/API references to the `main` namespace model where necessary.

- [ ] **direct** `ee7c96a` - `examples/exec: add os/exec demo with README`
- [ ] **direct** `5c04d08` - `examples: add pipes example testing all pipe-like primitives`
- [ ] **direct** `a7d9aba` - `pty-demo: add PTY support with local winsize tracking`
- [ ] **direct** `6f95170` - `commit exec-demo`
- [ ] **direct** `225dc6d` - `go-repl: use rc shell`
- [ ] **direct** `8cf7c10` - `examples/exec-demo: use patched Go stdlib os/exec`
- [ ] **direct** `3c4c615` - `examples/go-repl: add Go toolchain demo, fix toStringMap for env arrays`
- [ ] **direct** `d39ad96` - `devserver.md: document how to start the COOP/COEP dev server`
- [ ] **direct** `f3f4a8d` - `docs: add tinygo-issues.md documenting asyncify param limit`
- [ ] **direct** `569ed6d` - `docs: add wasi-todo.md with remaining work plan and references`
- [ ] **direct** `1f3c8a9` - `add summary.md`
- [ ] **direct** `9f4dcfb` - `add wanix-exec.md`
- [ ] **direct** `657f4a5` - `add todo-archive-persist.md`
- [ ] **direct** `708e846` - `add readat-investigation.md`

Validation:

- [ ] Build and manually run the exec, pipes, PTY, Go REPL, and GoJS exec examples.
- [ ] Run `make smoketest` and resolve any `main`-specific example fixture updates.
- [ ] Fix known whitespace errors before finalizing: generated `dist/wanix.min.js`, `examples/go-repl/index.html`, and `readat-investigation.md`.

## Explicit omissions and superseded history

- [ ] **do not cherry-pick** `80d093c` - `rm exec-demo`; it only removes an earlier demo state.
- [ ] Do not restore the removed `misc/cbor/` tree. Choose the module replacement from `12e9e35` only if the upstream/fork behavior remains required.
- [ ] Review the `go-repl` and `exec-demo` history together; `6f95170`, `80d093c`, `ee7c96a`, and `8cf7c10` represent an evolution, not four independent features.

## Completion gate

- [ ] `git diff --check` is clean.
- [ ] `go test ./...` passes.
- [ ] `make js` succeeds and its generated output is committed deliberately.
- [ ] `make smoketest` passes where Chrome/Docker/TinyGo prerequisites are available.
- [ ] `git range-diff origin/main...exec origin/main...HEAD` confirms that every intended behavior was retained or deliberately omitted.
