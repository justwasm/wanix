# Exec Branch Cherry-pick TODO

## Execution status — 2026-08-01

The runtime replay is merged into `main` in `160ceb6` (`exec: replay process
runtime onto main`). It includes portable userspace `flock`, Spawn/Wait/Pipe,
PTY and window-size RPCs, GoJS/WASI worker integration, compiled WASM caching,
FSA persistence fixes, terminal resize state, `/dev/null`, `rc` on standard
`os/exec`, updated build isolation, and exec/pipe/PTY/GoJS examples.

This checklist remains as the source-history audit. Deliberate deviations:
`main`'s current `wanix-namespace`/kernel, VFS routing, dependency versions,
and site architecture were retained; obsolete `wanix-system` and old-site
changes from `exec` were not restored. The imported examples were adapted to
`wanix-namespace`.

Source branch: `exec` at `e13de29`
Target branch: `main` at `76779e3`
Fork point: `6ee3251`

This is a dependency-ordered working checklist for selectively porting the
`exec` branch to `main`. Use `git cherry-pick -x <sha>` for commits marked
**direct**, and port the intent manually for commits marked **adapt**. Do not
cherry-pick the generated bundle until all JavaScript and package changes are
merged.

## Before starting

- [x] Create a dedicated integration branch from `origin/main`.
- [x] Preserve the current `exec` tip with a tag or backup branch.
- [x] Isolate the current untracked workspace items (`checkzip/`,
  `examples/repl-rc/local.html`, `index.html`, `quirks.md`, and
  `watch_20260630-051441`) before operating on the worktree.
- [ ] Establish a baseline with `go test ./...`, `make js`, and `make smoketest`
  where the required local dependencies are available.

## Phase 1: Reconcile the `main` architecture first

`main` has renamed `wanix-system` to `wanix-namespace`, introduced a kernel,
reworked VFS routing, and flattened `rc/shell/*` to `rc/*`. Port the intent of
these commits onto those APIs instead of accepting old paths or element names.

- [x] **adapt** `cdff390` - `elements/term.js, task.js: squash`
- [x] **adapt** `bfac84d` - `get rid of WANIX_COLS,ROWS,XPIXEL,YPIXEL`
- [x] **adapt** `3a3d77a` - `term: seed winch Broadcaster with initial dimensions at allocation time`
- [x] **adapt** `2758bc5` - `elements/term.js: deduplicate dataset assignment in connectedCallback`
- [x] **adapt** `6759861` - `fix(elements): add disconnectedCallback to WanixElement base class`
- [x] **adapt** `e4fccc4` - `task: fix deadlock in VFSOpen and restore term binding fallback`
- [x] **adapt** `e320e05` - `vfs: normalize paths at all entry points; fix cleanpath bugs in workers`
- [x] **adapt** `48c1029` - `worker: fix cleanpath: crush/. -> crush`
- [x] **adapt** `15ea9b6` - `rc: use os/exec for js/wasm`

Validation:

- [ ] Verify `wanix-namespace` and standalone resource elements still initialize tasks and terminals.
- [ ] Verify VFS path normalization against `main`'s `Route`/`Walk` model.
- [x] Verify the `rc` commands build after applying the `rc/shell/*` to `rc/*` path migration.

## Phase 2: Core API support for processes and I/O

These commits establish the RPC contract that later GoJS/WASI worker and
`os/exec` changes depend on. Keep their relative order.

- [x] **direct** `9b3b3fd` - `rm syscall`
- [ ] **direct** `c88d1e2` - `make flock report EWOULDBLOCK`
- [x] **direct** `d8d1bf9` - `api/flock.go: cleanup with channel-backed TryLock`
- [x] **direct** `2be1deb` - `add flock syscall compat layer`
- [x] **direct** `dcff87c` - `api: add /dev/null support via openNull RPC`
- [x] **direct** `8082d07` - `pty: remove wasm build constraint, rename to pty_impl.go`
- [x] **direct** `1cf4a6f` - `api/read: fix io.EOF handling for partial reads (both read and readAt)`
- [x] **direct** `fb78a3c` - `api: refactor pipe into interface with ringbuf (default) and chan (opt-in) implementations`
- [x] **direct** `43ceff3` - `api, gojs: add ReadAt RPC to fix objapi header corruption in go build std`
- [x] **direct** `193bc02` - `api, gojs: implement flock using per-path userspace mutexes`
- [x] **direct** `7a3d199` - `gojs: add flock ENOSYS stub, clear build cache before compile`
- [x] **direct** `7e1bc82` - `api, gojs: remove hardcoded wait timeout, fix errback error propagation`
- [x] **direct** `573d34d` - `api/chtimes: handle integer timestamps in toSeconds helper`
- [x] **adapt** `73356d1` - `api, gojs: add os/exec and os.Pipe support via Spawn/Wait/Pipe RPC`

Validation:

- [ ] Run `go test ./api ./pty ./term`.
- [ ] Exercise pipe EOF, partial `ReadAt`, flock contention, `/dev/null`, and PTY window-size behavior.
- [ ] Confirm the Spawn/Wait/Pipe RPC uses `main`'s task and VFS interfaces.

## Phase 3: WASM detection, GoJS, and WASI workers

`main` already introduced WASM type detection and changed task argument/bind
handling. Compare its implementation before applying the overlapping commits;
preserve behavior from both sides rather than choosing one wholesale.

- [x] **adapt** `d12cf36` - `os/exec: remove .wasm suffix check from driver Check methods; add logging`
- [x] **adapt** `d3846d6` - `os/exec: auto-detect WASM binary type (gojs vs wasi) for child tasks`
- [ ] **adapt** `2a829ad` - `wasm: sync wasmMinDataAddr to 131072`
- [x] **adapt** `4afb077` - `gojs, wasi: sync readAt and flock into lib.js bundles`
- [x] **adapt** `35f0981` - `gojs/worker: fix read syscall to respect buffer offset parameter`
- [x] **adapt** `b1159a9` - `gojs/worker: fix write syscall to handle non-zero buffer offset`
- [x] **adapt** `abff655` - `task: add terminate support for process killing`
- [x] **adapt** `fb1440c` - `wasm/cache: add compiled WebAssembly.Module cache for worker processes`
- [x] **direct** `8583056` - `wasm/cache: add design document`
- [x] **adapt** `38ef7a3` - `fix(gojs/worker): use Instance directly from two-step instantiate`
- [x] **adapt** `5c5d439` - `fix(wasi/worker): forward cached wasmModule to inner sync worker`
- [x] **adapt** `ed361ff` - `fix(wasm/cache): verify content hash to detect binary changes`
- [x] **adapt** `53be125` - `fix: terminate Web Workers after Go/WASI program exit`
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
- [x] **adapt** `bba7282` - `fsa: replace CBOR #stat with IndexedDB metadata; fix directory rename`
- [x] **adapt** `ff3aa1b` - `fix(fsa): return logical offset from Stat when WritableFileStream has uncommitted writes`
- [x] **adapt** `1b5b00e` - `fix(fsa): buffer uncommitted writes to serve subsequent reads`
- [x] **adapt** `d40cf32` - `fix(fsa): always refresh file snapshot and clean up on close error`
- [x] **skip / historical only** `f430b31` - `fsa: debug no persist #stats file`

Validation:

- [ ] Decide whether the `github.com/justwasm/cbor/v2` fork is still required on top of `main`'s Go 1.26 dependency set.
- [ ] Test directory rename, metadata persistence across reload, uncommitted-write reads, logical offsets, and close-error cleanup.

## Phase 5: Process behavior fixes

- [x] **adapt** `17d82ff` - `fix: propagate CWD to child processes on spawn`
- [x] **adapt** `82aeed9` - `fix: preserve argument boundaries in spawn command line`
- [x] **adapt** `3f7a06e` - `fix: add shell-aware splitCmd to JS workers`

Validation:

- [ ] Run child programs with a non-root CWD.
- [ ] Test quoted arguments, arguments containing whitespace, and shell command parsing.

## Phase 6: Dependencies, build tooling, and terminal addons

Apply dependency changes only after resolving the merged runtime API. Regenerate
the distribution bundle instead of cherry-picking it before its sources.

- [ ] **adapt** `ead5878` - `use repo url for toolkit-go replace`
- [x] **adapt** `7d982b2` - `xterm: add @xterm/addon-clipboard, image addon, cursor trail addon`
- [ ] **direct** `806fe7a` - `add js.sh as alternative to buildjs.go`
- [x] **adapt** `47d8dc3` - `fix: prevent esbuild loader configuration leaking between builds`
- [ ] **adapt** `d434978` - `bump esbuild v0.28.1`
- [ ] **regenerate, do not cherry-pick directly** `e13de29` - `make js`

Validation:

- [ ] Keep `main`'s Go 1.26/p9/x-net updates while resolving `toolkit-go`, CBOR, esbuild, and xterm versions.
- [ ] Run `go mod tidy`, inspect the result, run `npm install`, then run `make js`.
- [ ] Check `git diff --check` and review the regenerated `dist/wanix.min.js`.

## Phase 7: Examples and documentation

Examples depend on the prior runtime phases. Apply after the runtime works, and
update markup/API references to the `main` namespace model where necessary.

- [x] **direct** `ee7c96a` - `examples/exec: add os/exec demo with README`
- [x] **direct** `5c04d08` - `examples: add pipes example testing all pipe-like primitives`
- [x] **direct** `a7d9aba` - `pty-demo: add PTY support with local winsize tracking`
- [x] **direct** `6f95170` - `commit exec-demo`
- [x] **direct** `225dc6d` - `go-repl: use rc shell`
- [x] **direct** `8cf7c10` - `examples/exec-demo: use patched Go stdlib os/exec`
- [x] **direct** `3c4c615` - `examples/go-repl: add Go toolchain demo, fix toStringMap for env arrays`
- [x] **direct** `d39ad96` - `devserver.md: document how to start the COOP/COEP dev server`
- [x] **direct** `f3f4a8d` - `docs: add tinygo-issues.md documenting asyncify param limit`
- [x] **direct** `569ed6d` - `docs: add wasi-todo.md with remaining work plan and references`
- [ ] **direct** `1f3c8a9` - `add summary.md`
- [ ] **direct** `9f4dcfb` - `add wanix-exec.md`
- [ ] **direct** `657f4a5` - `add todo-archive-persist.md`
- [x] **direct** `708e846` - `add readat-investigation.md`

Validation:

- [ ] Build and manually run the exec, pipes, PTY, Go REPL, and GoJS exec examples.
- [ ] Run `make smoketest` and resolve any `main`-specific example fixture updates.
- [ ] Fix known whitespace errors before finalizing: generated `dist/wanix.min.js`, `examples/go-repl/index.html`, and `readat-investigation.md`.

## Explicit omissions and superseded history

- [x] **do not cherry-pick** `80d093c` - `rm exec-demo`; it only removes an earlier demo state.
- [ ] Do not restore the removed `misc/cbor/` tree. Choose the module replacement from `12e9e35` only if the upstream/fork behavior remains required.
- [ ] Review the `go-repl` and `exec-demo` history together; `6f95170`, `80d093c`, `ee7c96a`, and `8cf7c10` represent an evolution, not four independent features.

## Completion gate

- [x] `git diff --check` is clean.
- [ ] `go test ./...` passes.
- [ ] `make js` succeeds and its generated output is committed deliberately.
- [ ] `make smoketest` passes where Chrome/Docker/TinyGo prerequisites are available.
- [ ] `git range-diff origin/main...exec origin/main...HEAD` confirms that every intended behavior was retained or deliberately omitted.
