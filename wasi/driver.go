//go:build js && wasm

package wasi

import (
	"tractor.dev/wanix"
	wasiworker "tractor.dev/wanix/wasi/worker"
	"tractor.dev/wanix/web/worker"
)

type Driver struct {
	Workers *worker.Device
}

func (d *Driver) Check(t *wanix.Task) bool {
	f, err := t.NS().Open(t.Arg(0))
	if err != nil {
		println("wasi.Check: open error", err.Error())
		return false
	}
	defer f.Close()
	return wanix.DetectWASMKind(f) == "wasi"
}

func (d *Driver) Start(t *wanix.Task) error {
	return worker.StartTaskWorker(d.Workers, t, wasiworker.BlobURL())
}
