package api

import (
	"io"
	"io/fs"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs/fskit"
)

// pipeCore is the internal pipe implementation.
// Two variants exist, selected by build tag:
//   - !pipe_ringbuf (default): chan byte based
//   - pipe_ringbuf:            sync.Mutex + ring buffer
type pipeCore interface {
	Read([]byte) (int, error)
	Write([]byte) (int, error)
	addWriter()
	removeWriter()
}

func newPipe() pipeCore {
	return newPipeImpl()
}

type pipeReadFile struct {
	pipe pipeCore
}

func (f *pipeReadFile) Read(b []byte) (int, error)  { return f.pipe.Read(b) }
func (f *pipeReadFile) Write(b []byte) (int, error) { return 0, io.ErrClosedPipe }
func (f *pipeReadFile) Close() error                { return nil }
func (f *pipeReadFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("pipe", fs.FileMode(0644)|fs.ModeNamedPipe, 0), nil
}

type pipeWriteFile struct {
	pipe pipeCore
}

func (f *pipeWriteFile) Read(b []byte) (int, error)  { return 0, io.ErrClosedPipe }
func (f *pipeWriteFile) Write(b []byte) (int, error) { return f.pipe.Write(b) }
func (f *pipeWriteFile) Close() error {
	f.pipe.removeWriter()
	return nil
}
func (f *pipeWriteFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("pipe", fs.FileMode(0644)|fs.ModeNamedPipe, 0), nil
}

func (s *syscaller) pipe(r rpc.Responder, c *rpc.Call) {
	c.Receive(nil)

	cp := newPipe()
	cp.addWriter()
	readFd := s.task.OpenFD(&pipeReadFile{pipe: cp}, "pipe:read")
	writeFd := s.task.OpenFD(&pipeWriteFile{pipe: cp}, "pipe:write")

	r.Return([]any{uint64(readFd), uint64(writeFd)})
}
