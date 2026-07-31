//go:build pipe_chan

package api

import (
	"io"
	"sync"
)

// pipeImpl is a channel-based pipe with reference counting.
// Close() decrements the writer count; EOF is signaled when ALL writers
// have closed and the buffer is drained.
type pipeImpl struct {
	buf     chan byte
	done    chan struct{}
	closed  bool
	writers int
	mu      sync.Mutex
}

func newPipeImpl() *pipeImpl {
	return &pipeImpl{
		buf:  make(chan byte, 32<<10), // 32KiB
		done: make(chan struct{}),
	}
}

func (p *pipeImpl) addWriter() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.writers++
}

func (p *pipeImpl) removeWriter() {
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

func (p *pipeImpl) Read(b []byte) (int, error) {
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

func (p *pipeImpl) Write(b []byte) (int, error) {
	for _, bb := range b {
		select {
		case <-p.done:
			return 0, io.ErrClosedPipe
		default:
		}
		select {
		case p.buf <- bb:
		case <-p.done:
			return 0, io.ErrClosedPipe
		}
	}
	return len(b), nil
}
