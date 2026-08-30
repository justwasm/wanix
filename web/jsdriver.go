//go:build js && wasm

package web

import (
	"strings"
	"syscall/js"

	"tractor.dev/wanix"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/web/worker"
)

// this was added for demos and completeness, but is really just a sketch atm.
type JSDriver struct {
	Workers *worker.Device
}

func (d *JSDriver) Check(t *wanix.Task) bool {
	return strings.HasSuffix(t.Arg(0), ".js")
}

func (d *JSDriver) Start(t *wanix.Task) error {
	// Read the script from the task's own namespace (like the wasi and
	// gojs drivers): per-task plugin mounts (files binds) are visible
	// there, while root-namespace mounts still are via the ns clone.
	data, err := fs.ReadFile(t.NS(), t.LookPath(t.Arg(0)))
	if err != nil {
		return err
	}
	jsBuf := js.Global().Get("Uint8Array").New(len(data))
	js.CopyBytesToJS(jsBuf, data)
	blob := js.Global().Get("Blob").New([]any{jsBuf}, js.ValueOf(map[string]any{"type": "text/javascript"}))
	url := js.Global().Get("URL").Call("createObjectURL", blob)
	return worker.StartTaskWorker(d.Workers, t, url.String(), js.Undefined())
}
