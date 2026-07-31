//go:build !js && !wasm

package wanix

// Terminate stops the task's OS process.
func Terminate(t *Task) {
	t.mu.Lock()
	w := t.worker
	t.mu.Unlock()
	if w == nil {
		return
	}
	if proc, ok := w.(interface{ Kill() error }); ok {
		proc.Kill()
	}
}
