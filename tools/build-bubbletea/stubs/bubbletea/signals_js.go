//go:build js && wasm

package tea

// listenForResize is a no-op on js/wasm — resize is handled by the
// winch reader goroutine started in initInput (tty_js.go), because
// handleResize guards this call behind p.ttyOutput != nil which is
// never true in the browser.
func (p *Program) listenForResize(done chan struct{}) {
	close(done)
}
