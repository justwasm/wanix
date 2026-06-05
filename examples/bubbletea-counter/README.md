# Bubbletea in wanix

This example runs a [Bubbletea v2](https://github.com/charmbracelet/bubbletea) TUI program in the browser via wanix's GoJS worker.

## How it works

```
┌─ Browser (Main Thread) ────────────────────┐  ┌─ GoJS Worker ──────────────────┐
│                                             │  │                                │
│  ┌──────────┐   onResize    ┌───────────┐   │  │  Bubbletea app (bubbletea.wasm) │
│  │ xterm.js │ ────────────→ │ #term/$id  │   │  │                                │
│  │ (wanix-  │   cols rows   │ /winch     │   │  │  os.Stdin  ← fd/0 ← term/prog  │
│  │  term)   │               │ signal     │   │  │  os.Stdout → fd/1 → term/prog  │
│  └──────────┘               │ broadcast  │   │  │                                │
│       ↑                     └─────┬──────┘   │  │  goroutine: ← fd/open(winch)   │
│       │ output (term/data)        │           │  │    ↓                          │
│       └───────────────────────────┘           │  │  prog.Send(WinSizeMsg)        │
│                                               │  └────────────────────────────────┘
└───────────────────────────────────────────────┘
```

**Key differences from [boba](https://github.com/btwiuse/boba):**

| Aspect | boba | wanix |
|--------|------|-------|
| I/O transport | `bubbletea_read/write` polling from JS | `os.Stdin`/`os.Stdout` via GoJS worker bridge |
| Resize | `bubbletea_resize` → `prog.Send` | `onResize` → `openWritable(winch)` → signal broadcaster → goroutine reads → `prog.Send` |
| Terminal | ghostty-web | wanix-term (xterm.js) |
| Build | `boba-wasm-build` (patches bubbletea) | `tools/build-bubbletea` (equivalent) |

## Build & Run

```sh
# 1. Build wanix core
cd /root/wanix
make js
make wasm-go

# 2. Build the Bubbletea WASM
cd examples/bubbletea-counter
go run ../../tools/build-bubbletea -o bubbletea.wasm .
cd ../..

# 3. Start dev server
go run ./examples/serve.go
```

Open http://localhost:7070/examples/bubbletea-counter/

## Controls

| Key | Action |
|-----|--------|
| ↑ / k | Increment counter |
| ↓ / j | Decrement counter |
| q | Quit |

Resize the browser window — the terminal size display updates in real time.

## Architecture

### Compilation (tools/build-bubbletea)

Bubbletea v2 has no `js/wasm` build tags, so it can't be compiled with `GOOS=js GOARCH=wasm` directly.
The build tool:
1. Copies `charm.land/bubbletea/v2` from the module cache
2. Injects stub files (`tty_js.go`, `signals_js.go`) that no-op platform-specific operations
3. Adds a `replace` directive and builds

### Initial terminal size

1. `elements/term.js`: `connectedCallback()` runs `FitAddon.fit()`, stores cols/rows in `dataset`
2. `ResizeObserver` fires after layout, updates `dataset.cols/rows`
3. `elements/task.js`: `allocate()` reads the dataset, injects `WANIX_COLS`/`WANIX_ROWS` into env
4. Bubbletea's `initInput()` reads the env vars and sets `p.width/p.height` before the first render

### Runtime resize

1. User resizes window → xterm.js `FitAddon.fit()` → `onResize` fires
2. Handler calls `openWritable(path + "/winch")`, writes `"COLS ROWS\n"`
3. Signal broadcaster fans out to all subscribed readers
4. Go goroutine (started in `main()`) reads from the winch file, parses cols/rows
5. Calls `prog.Send(tea.WindowSizeMsg{Width: cols, Height: rows})`
6. Bubbletea's `model.Update()` receives the message and re-renders

## Writing your own Bubbletea app

```go
package main

import (
    "fmt"
    "os"
    "strconv"
    "strings"
    tea "charm.land/bubbletea/v2"
)

type model struct {
    // ...
}

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) { /* ... */ }

func (m model) View() tea.View {
    return tea.View{Content: "...", AltScreen: true}
}

func main() {
    os.Setenv("TERM", "xterm-256color")

    // Read initial terminal size from env (set by task.js)
    initCols, _ := strconv.Atoi(os.Getenv("WANIX_COLS"))
    initRows, _ := strconv.Atoi(os.Getenv("WANIX_ROWS"))

    p := tea.NewProgram(model{width: initCols, height: initRows},
        tea.WithInput(os.Stdin),
        tea.WithOutput(os.Stdout),
    )

    // Start winch reader for resize
    if wp := os.Getenv("TERM_WINCH"); wp != "" {
        go func() {
            f, _ := os.Open(wp)
            defer f.Close()
            buf := make([]byte, 64)
            for {
                n, err := f.Read(buf)
                if err != nil { return }
                parts := strings.Fields(string(buf[:n]))
                if len(parts) >= 2 {
                    cols, _ := strconv.Atoi(parts[0])
                    rows, _ := strconv.Atoi(parts[1])
                    if cols > 0 && rows > 0 {
                        p.Send(tea.WindowSizeMsg{Width: cols, Height: rows})
                    }
                }
            }
        }()
    }

    if _, err := p.Run(); err != nil {
        fmt.Fprintf(os.Stderr, "%v\n", err)
        os.Exit(1)
    }
}
```

Build with:
```sh
go run github.com/tractordev/wanix/tools/build-bubbletea -o app.wasm .
```

HTML:
```html
<wanix-system wasm="../dist/wanix.debug.wasm">
    <wanix-bind type="fetch" dst="app.wasm" src="app.wasm"></wanix-bind>
    <wanix-task id="myapp" type="gojs" cmd="app.wasm" start term
                env="TERM_WINCH=winch">
        <wanix-bind dst="winch" src="#task/self/term/winch"></wanix-bind>
    </wanix-task>
    <wanix-term path="#task/myapp/term" raw></wanix-term>
</wanix-system>
```
