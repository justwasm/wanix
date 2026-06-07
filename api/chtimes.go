package api

import (
	"time"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs"
)

func toSeconds(v any) (int64, int64, bool) {
	switch n := v.(type) {
	case float64:
		sec := int64(n)
		nsec := int64((n - float64(sec)) * 1e9)
		return sec, nsec, true
	case int64:
		return n, 0, true
	case int:
		return int64(n), 0, true
	case uint64:
		return int64(n), 0, true
	}
	return 0, 0, false
}

func (s *syscaller) chtimes(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	path, ok := args[0].(string)
	if !ok {
		panic("arg 0 is not a string")
	}

	atimeSec, atimeNsec, ok := toSeconds(args[1])
	if !ok {
		panic("arg 1 is not a valid time value (expected float64 or int)")
	}
	atime := time.Unix(atimeSec, atimeNsec)

	mtimeSec, mtimeNsec, ok := toSeconds(args[2])
	if !ok {
		panic("arg 2 is not a valid time value (expected float64 or int)")
	}
	mtime := time.Unix(mtimeSec, mtimeNsec)

	err := fs.Chtimes(s.task.NS(), path, atime, mtime)
	if err != nil {
		r.Return(err)
		return
	}
}
