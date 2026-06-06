//go:build js && wasm

package tea

import (
	"os"
	"strconv"
	"strings"
)

// listenForResize reads terminal resize events from the wanix winch signal
// file and forwards them as WindowSizeMsg — replacing the native SIGWINCH
// mechanism that doesn't exist in js/wasm.
// xpixel/ypixel are also written to WANIX_XPIXEL/WANIX_YPIXEL env vars so
// the user's program can read them in View() if desired.
func (p *Program) listenForResize(done chan struct{}) {
	winchPath := os.Getenv("TERM_WINCH")
	if winchPath == "" {
		close(done)
		return
	}
	go func() {
		f, err := os.Open(winchPath)
		if err != nil {
			close(done)
			return
		}
		defer f.Close()
		buf := make([]byte, 64)
		for {
			n, err := f.Read(buf)
			if err != nil {
				close(done)
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
}
