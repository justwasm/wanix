package api

import (
	"tractor.dev/toolkit-go/duplex/rpc"
)

func (s *syscaller) openNull(r rpc.Responder, c *rpc.Call) {
	c.Receive(nil)
	fd := s.task.OpenFD(&nullFile{name: "null"}, "dev:null")
	r.Return(uint64(fd))
}
