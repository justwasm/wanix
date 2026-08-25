//go:build js && wasm

package wasi

import (
	"io"

	"tractor.dev/wanix"
	"tractor.dev/wanix/misc/wasmutil"
	wasiworker "tractor.dev/wanix/wasi/worker"
	"tractor.dev/wanix/wasm/cache"
	"tractor.dev/wanix/web/worker"
)

type Driver struct {
	Workers *worker.Device
}

func (d *Driver) Check(t *wanix.Task) bool {
	typ, err := wasmutil.DetectType(t.NS(), t.LookPath(t.Arg(0)))
	if err != nil {
		// log.Println("error detecting wasm type", err)
		return false
	}
	if typ != "wasi" {
		return false
	}
	return true
}

func (d *Driver) Start(t *wanix.Task) error {
	program := t.LookPath(t.Arg(0))
	f, err := t.NS().Open(program)
	if err != nil {
		return err
	}
	defer f.Close()
	bin, err := io.ReadAll(f)
	if err != nil {
		return err
	}
	module, err := cache.GetOrCompile(program, bin)
	if err != nil {
		return err
	}
	return worker.StartTaskWorker(d.Workers, t, wasiworker.BlobURL(), module)
}
