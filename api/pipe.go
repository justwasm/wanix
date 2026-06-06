package api

import (
	"io"
	"io/fs"
	"sync"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs/fskit"
)

// chanPipe is a channel-based pipe with reference counting.
// Close() decrements the writer count; EOF is signaled when ALL writers
// have closed and the buffer is drained.
type chanPipe struct {
	buf     chan byte
	done    chan struct{}
	closed  bool
	writers int
	mu      sync.Mutex
}

func newChanPipe() *chanPipe {
	return &chanPipe{
		buf:  make(chan byte, 32<<10), // 32KiB
		done: make(chan struct{}),
	}
}

func (p *chanPipe) addWriter() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.writers++
}

func (p *chanPipe) removeWriter() {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed {
		return
	}
	p.writers--
	if p.writers <= 0 {
		p.closed = true
		close(p.done)
	}
}

func (p *chanPipe) Read(b []byte) (int, error) {
	n := 0
	for n < len(b) {
		select {
		case b[n] = <-p.buf:
			n++
		case <-p.done:
			for n < len(b) {
				select {
				case b[n] = <-p.buf:
					n++
				default:
					if n == 0 {
						return 0, io.EOF
					}
					return n, nil
				}
			}
			return n, nil
		default:
			// Buffer empty and done not closed.
			if n > 0 {
				return n, nil
			}
			// No data yet — block until something arrives.
			select {
			case b[n] = <-p.buf:
				n++
			case <-p.done:
				return 0, io.EOF
			}
		}
	}
	return n, nil
}

func (p *chanPipe) Write(b []byte) (int, error) {
	for _, bb := range b {
		select {
		case p.buf <- bb:
		case <-p.done:
			return 0, io.ErrClosedPipe
		}
	}
	return len(b), nil
}

type pipeReadFile struct {
	pipe *chanPipe
}

func (f *pipeReadFile) Read(b []byte) (int, error)  { return f.pipe.Read(b) }
func (f *pipeReadFile) Write(b []byte) (int, error) { return 0, io.ErrClosedPipe }
func (f *pipeReadFile) Close() error                { return nil }
func (f *pipeReadFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("pipe", fs.FileMode(0644)|fs.ModeNamedPipe, 0), nil
}

type pipeWriteFile struct {
	pipe *chanPipe
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

	cp := newChanPipe()
	cp.addWriter()
	readFd := s.task.OpenFD(&pipeReadFile{pipe: cp}, "pipe:read")
	writeFd := s.task.OpenFD(&pipeWriteFile{pipe: cp}, "pipe:write")

	r.Return([]any{uint64(readFd), uint64(writeFd)})
}
