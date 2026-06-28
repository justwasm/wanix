//go:build js && wasm

package worker

import (
	"syscall/js"

	"tractor.dev/wanix"
	"tractor.dev/wanix/misc/shlex"
)

func FromTask(t *wanix.Task) js.Value {
	w := wanix.GetWorker(t)
	if w == nil {
		return js.Undefined()
	}
	return w.(js.Value)
}

func StartTaskWorker(svc *Device, t *wanix.Task, blobURL string, wasmModule js.Value) error {
	w, err := svc.Alloc(t)
	if err != nil {
		return err
	}
	w.wasmModule = wasmModule
	args, _ := shlex.Split(t.Cmd(), true)
	args = append([]string{blobURL}, args...)
	wanix.SetCloser(t, func() {
		svc.Release(w.ID())
	})
	return w.Start(args...)
}
