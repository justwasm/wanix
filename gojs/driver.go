//go:build js && wasm

package gojs

import (
	"io"

	"tractor.dev/wanix"
	gojsworker "tractor.dev/wanix/gojs/worker"
	"tractor.dev/wanix/misc/wasmutil"
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
	if typ != "gojs" {
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
	// The worker re-reads the binary from the task's args, so argv[0] must
	// be the resolved path, not the bare name the driver was started with.
	t.SetArg0(program)
	return worker.StartTaskWorker(d.Workers, t, gojsworker.BlobURL(), module)
}
