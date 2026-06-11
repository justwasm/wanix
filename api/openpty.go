package api

import (
	"context"
	"fmt"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/pty"
)

func (s *syscaller) openpty(r rpc.Responder, c *rpc.Call) {
	c.Receive(nil)

	// Get the PTY device from the namespace
	fsys, _, err := fs.Resolve(s.task.NS(), context.Background(), "#ptmx")
	if err != nil {
		r.Return(fmt.Errorf("ptmx device not found: %w", err))
		return
	}
	dev, ok := fsys.(*pty.Device)
	if !ok {
		r.Return(fmt.Errorf("#ptmx is not a PTY device"))
		return
	}

	// Allocate a new PTY pair
	pair := dev.Alloc()

	// Register both master and slave in this task's fd table
	masterFd := s.task.OpenFD(pair.Master(), "pty:master")
	slaveFd := s.task.OpenFD(pair.Slave(), "pty:slave")

	r.Return(map[string]any{
		"master":   uint64(masterFd),
		"slave":    uint64(slaveFd),
		"slaveNum": pair.SlaveNum(),
	})
}
