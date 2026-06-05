//go:build js && wasm

package tea

// listenForResize is a no-op on js/wasm — resize is handled by the
// wanix term winch file mechanism (JS onResize → winch signal file
// → Goroutine reads winch → prog.Send(WindowSizeMsg)).
func (p *Program) listenForResize(done chan struct{}) {
	close(done)
}
