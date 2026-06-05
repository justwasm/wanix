//go:build js && wasm

package tea

import (
	"os"
	"strconv"
)

// suspendSupported is false on js/wasm — no process suspension in browser.
const suspendSupported = false

// suspendProcess is a no-op on js/wasm.
func suspendProcess() {}

// initInput reads initial terminal dimensions from WANIX_COLS/WANIX_ROWS
// env vars (set by the wanix-term element), falling back to 80×24.
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
	return nil
}
