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

// initInput reads initial terminal dimensions from the winch signal file
// (blocking until the first write), then continues reading resize events
// in a goroutine. This replaces the native SIGWINCH mechanism that
// doesn't exist in js/wasm.
func (p *Program) initInput() error {
	winchPath := os.Getenv("TERM_WINCH")
	if winchPath == "" {
		if p.width == 0 {
			p.width = 80
		}
		if p.height == 0 {
			p.height = 24
		}
		return nil
	}

	f, err := os.Open(winchPath)
	if err != nil {
		if p.width == 0 {
			p.width = 80
		}
		if p.height == 0 {
			p.height = 24
		}
		return nil
	}

	// first read blocks until the terminal has written its initial size
	buf := make([]byte, 64)
	n, err := f.Read(buf)
	if err == nil {
		parts := strings.Fields(string(buf[:n]))
		if len(parts) >= 2 {
			cols, _ := strconv.Atoi(parts[0])
			rows, _ := strconv.Atoi(parts[1])
			if cols > 0 && rows > 0 {
				p.width = cols
				p.height = rows
			}
		}
	}

	// continue reading for subsequent resize events
	go func() {
		defer f.Close()
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
		}
	}()
	return nil
}
