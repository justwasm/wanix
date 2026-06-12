//go:build js && wasm

package wanix

import (
	"syscall/js"
)

// Terminate stops the task's Web Worker and writes an exit code
// so Wait4 can return. worker.terminate() kills the JS runtime
// without giving Go WASM a chance to write #task/{id}/exit, so the
// kernel does it on its behalf.
func Terminate(t *Task) {
	t.mu.Lock()
	w := t.worker
	closer := t.closer
	t.closer = nil
	t.mu.Unlock()

	if w != nil {
		if worker, ok := w.(js.Value); ok {
			worker.Call("terminate")
		}
	}

	// Write exit code (killed by signal) so the kernel's Wait RPC can return.
	// worker.terminate() kills the JS runtime without giving Go WASM a chance
	// to write #task/{id}/exit.
	t.mu.Lock()
	t.exit = "9"
	t.mu.Unlock()
	if closer != nil {
		go closer()
	}
}
