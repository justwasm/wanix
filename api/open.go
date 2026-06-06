package api

import (
	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs"
)

func (s *syscaller) open(r rpc.Responder, c *rpc.Call) {
	var args []string
	c.Receive(&args)

	// Handle /dev/null - return a discard/EOF fd
	if isNullDev(args[0]) {
		r.Return(uint64(s.task.OpenFD(&nullFile{name: args[0]}, args[0])))
		return
	}

	f, err := s.task.NS().Open(args[0])
	if err != nil {
		r.Return(err)
		return
	}

	fd := s.task.OpenFD(f, args[0])
	r.Return(uint64(fd))
}

func (s *syscaller) create(r rpc.Responder, c *rpc.Call) {
	var args []string
	c.Receive(&args)

	// Handle /dev/null - return a discard/EOF fd
	if isNullDev(args[0]) {
		r.Return(uint64(s.task.OpenFD(&nullFile{name: args[0]}, args[0])))
		return
	}

	f, err := fs.Create(s.task.NS(), args[0])
	if err != nil {
		r.Return(err)
		return
	}

	fd := s.task.OpenFD(f, args[0])
	r.Return(uint64(fd))
}

func (s *syscaller) openFile(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	path, ok := args[0].(string)
	if !ok {
		panic("arg 0 is not a string")
	}

	flags, ok := args[1].(uint64)
	if !ok {
		panic("arg 1 is not a uint64")
	}

	mode, ok := args[2].(uint64)
	if !ok {
		panic("arg 2 is not a uint64")
	}
	_ = flags
	_ = mode

	// Handle /dev/null - return a discard/EOF fd regardless of flags/mode
	if isNullDev(path) {
		r.Return(uint64(s.task.OpenFD(&nullFile{name: path}, path)))
		return
	}

	f, err := fs.OpenFile(s.task.NS(), path, int(flags), fs.FileMode(mode))
	if err != nil {
		r.Return(err)
		return
	}

	fd := s.task.OpenFD(f, path)
	r.Return(uint64(fd))
}

// isNullDev checks if a cleaned path refers to /dev/null.
// After cleanpath in worker.js, "/dev/null" becomes "dev/null".
func isNullDev(path string) bool {
	return path == "dev/null" || path == "/dev/null"
}
