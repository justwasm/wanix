//go:build js && wasm

package tea

import (
	"os"
	"strconv"
	"strings"
)

// suspendSupported is false on js/wasm — no process suspension in browser.
const suspendSupported = false

// suspendProcess is a no-op on js/wasm.
func suspendProcess() {}

// initInput reads initial terminal dimensions from WANIX_COLS/WANIX_ROWS
// env vars (set by the wanix-term element), falling back to 80×24.
// It also starts a goroutine that reads resize events from the winch
// signal file and forwards them as WindowSizeMsg, replacing the native
// SIGWINCH mechanism that doesn't exist in js/wasm.
func (p *Program) initInput() error {
	if p.width == 0 {
		if c := os.Getenv("WANIX_COLS"); c != "" {
			p.width, _ = strconv.Atoi(c)
		}
	}
	if p.height == 0 {
		if r := os.Getenv("WANIX_ROWS"); r != "" {
			p.height, _ = strconv.Atoi(r)
		}
	}
	if p.width == 0 {
		p.width = 80
	}
	if p.height == 0 {
		p.height = 24
	}

	// start winch reader for terminal resize
	winchPath := os.Getenv("TERM_WINCH")
	if winchPath == "" {
		return nil
	}
	go func() {
		f, err := os.Open(winchPath)
		if err != nil {
			return
		}
		defer f.Close()
		buf := make([]byte, 64)
		for {
			n, err := f.Read(buf)
			if err != nil {
				return
			}
			parts := strings.Fields(string(buf[:n]))
			if len(parts) >= 2 {
				cols, _ := strconv.Atoi(parts[0])
				rows, _ := strconv.Atoi(parts[1])
				if cols > 0 && rows > 0 {
					p.Send(WindowSizeMsg{Width: cols, Height: rows})
				}
			}
			if len(parts) >= 4 {
				os.Setenv("WANIX_XPIXEL", parts[2])
				os.Setenv("WANIX_YPIXEL", parts[3])
			}
		}
	}()
	return nil
}
