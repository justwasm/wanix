//go:build js && wasm

package gojs

import (
	"tractor.dev/wanix"
	gojsworker "tractor.dev/wanix/gojs/worker"
	"tractor.dev/wanix/web/worker"
)

type Driver struct {
	Workers *worker.Device
}

func (d *Driver) Check(t *wanix.Task) bool {
	f, err := t.NS().Open(t.Arg(0))
	if err != nil {
		println("gojs.Check: open error", err.Error())
		return false
	}
	defer f.Close()
	return wanix.DetectWASMKind(f) == "gojs"
}

func (d *Driver) Start(t *wanix.Task) error {
	return worker.StartTaskWorker(d.Workers, t, gojsworker.BlobURL())
}
