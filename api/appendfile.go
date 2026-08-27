package api

import (
	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs"
)

func (s *syscaller) appendFile(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	// log.Println("WriteFile", args)

	name, ok := args[0].(string)
	if !ok {
		panic("arg 0 is not a string")
	}

	data, ok := bytesArg(args[1])
	if !ok {
		r.Return(fs.ErrInvalid)
		return
	}

	err := fs.AppendFile(s.task.NS(), name, data)
	if err != nil {
		r.Return(err)
		return
	}
}
