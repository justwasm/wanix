## Summary: Building and Running Bubbletea in wanix (Browser Go WASM TUI)

### Current State

We successfully ported a [Bubbletea v2](https://github.com/charmbracelet/bubbletea) TUI application to run in the browser via wanix's GoJS worker. The full pipeline works:

- Compilation of Bubbletea Go code to `GOOS=js GOARCH=wasm` (with injected js/wasm stubs)
- Execution as a `gojs` task with a `wanix-term` connected to its file descriptors
- Real-time terminal resize: xterm.js `onResize` -> `openWritable(path+"/winch")` -> signal broadcaster -> Go goroutine reads winch -> `prog.Send(tea.WindowSizeMsg)`
- Initial terminal size from environment variables (`WANIX_COLS`/`WANIX_ROWS`) set by task.js from the term element's `dataset.cols/rows`
- `no-scrollbar` attribute support in wanix-term (with CDN-loaded xterm default CSS)
- Auto-focus on the terminal after ready

The demo (`examples/bubbletea-counter/index.html`) displays a counter TUI where up/k increments, down/j decrements, q quits. Resize works. Scrollbar hidden via `no-scrollbar` attribute + xterm CDN CSS.

### Files & Changes

**Modified files:**

- `elements/term.js` â Major additions:
  - `connectedCallback()`: store `dataset.cols/rows` after `FitAddon.fit()`
  - `ResizeObserver`: update `dataset.cols/rows` on resize
  - `_awake()`: `openWritable(winch)` to send initial terminal size + `onResize` handler that writes `"COLS ROWS\n"` to winch
  - `_getOptionsFromAttributes()`: add `no-scrollbar` attribute -> `scrollbar: { showScrollbar: false }`
  - `_awake()`: `this.focus()` for auto-focus

- `elements/task.js` â `allocate()`: find matching `<wanix-term>` via `querySelectorAll`, read `dataset.cols/rows`, inject `WANIX_COLS`/`WANIX_ROWS` into task env

- `examples/bubbletea-counter/index.html` â Added CDN link for xterm CSS, `<wanix-term no-scrollbar>`, `<wanix-system>` CSS height adjustments

**New files:**

- `tools/build-bubbletea/main.go` â Build tool that copies Bubbletea v2 from module cache, injects js/wasm stubs, and builds with `GOOS=js GOARCH=wasm`
- `tools/build-bubbletea/stubs/bubbletea/tty_js.go` â Stubs: `initInput()` reads `WANIX_COLS`/`WANIX_ROWS` env vars for initial terminal size
- `tools/build-bubbletea/stubs/bubbletea/signals_js.go` â Stub: `listenForResize()` immediately closes the done channel (resize is handled by winch goroutine in user code)
- `examples/bubbletea-counter/main.go` â Bubbletea counter app with winch reader goroutine, initial size from env vars
- `examples/bubbletea-counter/go.mod` / `go.sum` â Go module for the example
- `examples/bubbletea-counter/Makefile` / `run.sh` / `README.md` â Build scripts and documentation

**Deleted/unnecessary:**

- `bubbletea/bubbletea.go` â Unused adapter package
- `tools/bobuild.sh` â Redundant script (folded into Makefile)

### Technical Context

**Architecture:**

```
Browser Main Thread:
  xterm.js (wanix-term)
    ââ onResize -> openWritable("/term/$id/winch") -> write("COLS ROWS")
    ââ ready -> focus()

GoJS Worker (Bubbletea WASM):
  os.Stdin  â mapped to term's program file via fd/0
  os.Stdout â mapped to term's program file via fd/1
  goroutine:
    os.Open("winch") -> os.Read() -> prog.Send(WindowSizeMsg)
```

**Build process:**

```sh
# Build Bubbletea WASM:
go run ./tools/build-bubbletea -o app.wasm .          # injects stubs, builds GOOS=js GOARCH=wasm

# Build wanix core:
make js                                               # esbuild: wanix.js, wanix.min.js, wanix.handle.js
make wasm-go                                          # wanix.debug.wasm (14MB debug)
make wasm-tinygo                                      # wanix.wasm (2.8MB prod) - needs TinyGo 0.41+

# Run:
go run ./examples/serve.go                            # HTTP server on :7070
```

**Key tools/versions:**
- Go 1.26.4
- TinyGo 0.41.1 (needs `TINYGOROOT` set; currently installed at `/usr/lib/tinygo`)
- Node 26.2.0, npm 11.16.0, esbuild 0.28.0
- xterm.js 6.0.0 (npm `@xterm/xterm@^6.0.0`)
- Bubbletea v2.0.7 (`charm.land/bubbletea/v2 v2.0.6` in go.mod)
- `@xterm/addon-fit` "^0.11.0"
- `@progrium/duplex` (in wanix's node_modules)
- wagix dev server at `localhost:7070` (also :7071 for COEP/COOP)
- `golang.org/x/sys` is replaced with `progrium/sys-wasm` in go.mod

**winch signal file details:**
- A `signal.Broadcaster` backed file at `#term/$rid/winch`
- Writing data to it fans out to all subscribed readers
- Readers block on `Read()` until data arrives
- Does NOT buffer data sent before a reader subscribes (data is lost if no readers)

**xterm.js 6 scrollbar:**
- Uses custom overlay `.scrollbar.vertical`/`.scrollbar.horizontal` inside `.xterm-scrollable-element`
- Not native viewport scrollbars; CSS `::-webkit-scrollbar` has no effect
- `scrollbar: { showScrollbar: false }` option works **only when xterm's default CSS is loaded**
- CDN: `https://cdn.jsdelivr.net/npm/@xterm/xterm@6.0.0/css/xterm.css`

**Namespace path resolution caveat:**
- `#task/$id/term/winch` goes through `TaskFS` which intercepts `#task` prefix
- `TaskFS` knows about task IDs/aliases but NOT about bindings in the root namespace
- Task's `self/term` is bound in the task's OWN namespace (by task.js), so `#task/self/term/winch` resolves correctly
- `self/term/winch` also works from within worker's namespace

### Strategy & Approach

The approach was to use wanix's existing infrastructure (GoJS worker, term device, signal broadcaster, VFS namespace) rather than implementing JS-side polling like boba does. Key decisions:

1. **Use `<wanix-task type="gojs">` instead of custom WASM loader** â GoJS worker already maps `os.Stdin`/`os.Stdout` to term file descriptors
2. **Use winch signal file for resize** â The existing `signal.Broadcaster` infrastructure was designed for this but had no producer (nothing wrote to winch). Added `onResize` handler in term.js
3. **Inject initial terminal size via env vars** â `dataset.cols/rows` -> `WANIX_COLS/ROWS` -> `initInput()` stub. Avoids 80x24 flash
4. **Goroutine in user code reads winch** â Each Bubbletea app needs its own winch reader goroutine (boilerplate in main.go)
5. **Build tool patches module cache** â Injects `tty_js.go` and `signals_js.go` (like boba's `boba-wasm-build`) since Bubbletea v2 lacks `js/wasm` build tags

**Problems encountered:**
- `spaceToNewline()` in task.js doesn't handle null input (`getAttribute("env")` returns null) - fixed
- `writeFile()` on signal broadcaster fails (implicit create) - used `openWritable()` instead
- Bubbletea needs `tea.WithInput(os.Stdin)` + `tea.WithOutput(os.Stdout)` to skip TTY opening
- Model needs initial width/height from env to avoid 80x24 first render
- `fit()` returns wrong size before layout - ResizeObserver updates dataset after layout
- Env string concatenation must maintain newline separation per key (TERM_WINCH + WANIX_COLS/ROWS)

### Git History (7 clean commits on main, ahead of origin/main)

```
825835d elements/term.js: add no-scrollbar attribute and auto-focus on ready
5339b43 examples/bubbletea-counter: add README documentation and run script
4d2697c examples/bubbletea-counter: add Bubbletea-in-the-browser demo
05852bf tools/build-bubbletea: add build tool for Bubbletea v2 js/wasm compilation
6e4a9bc elements/task.js: inject initial terminal dimensions into task environment
1af1f3d elements/term.js: wire terminal resize notifications through the winch signal file
6ee3251 github: disable workflows for now
```

### Exact Next Steps

1. Review the current state: `cd /root/wanix; git log --oneline -7; git status`

2. The dev server at `localhost:7070` may still be running (from `go run ./examples/serve.go`). If not, restart:
   ```sh
   cd /root/wanix && go run ./examples/serve.go
   ```

3. Verify the demo at http://localhost:7070/examples/bubbletea-counter/ still works after session restart:
   - Page loads, terminal auto-focuses
   - Count shows initial size correctly (not 80x24)
   - Up/k and down/j increment/decrement
   - Resize window updates "size:" display
   - No scrollbar visible

4. Check if the `build-bubbletea` tool still works (module cache may have changed):
   ```sh
   cd /root/wanix && go build -o /tmp/bbb ./tools/build-bubbletea
   cd examples/bubbletea-counter && /tmp/bbb -o bubbletea.wasm .
   ```

5. Consider next improvements (not done):
   - Move winch reader boilerplate into a reusable `bubbletea` package at `bubbletea/bubbletea.go`
   - Make the env-based initial size flow more reliable (currently depends on DOM query timing)
   - Handle the case where `<wanix-term>` is not a sibling of `<wanix-task>` (different DOM structure)
   - Add `scrollbar: { showScrollbar: false }` as a default in term.js when xterm CSS is detected as loaded, instead of requiring a `no-scrollbar` attribute
