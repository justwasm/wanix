//go:build !pipe_chan

package api

import (
	"io"
	"sync"
)

// pipeImpl is a synchronized ring-buffer pipe with reference counting.
// Close() decrements the writer count; EOF is signaled when ALL writers
// have closed and the buffer is drained.
type pipeImpl struct {
	buf     []byte
	start   int
	end     int
	full    bool
	done    chan struct{}
	closed  bool
	writers int
	mu      sync.Mutex
	cond    *sync.Cond
}

func newPipeImpl() *pipeImpl {
	p := &pipeImpl{
		buf:  make([]byte, 32<<10), // 32KiB, must be power of 2
		done: make(chan struct{}),
	}
	p.cond = sync.NewCond(&p.mu)
	return p
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
		p.cond.Broadcast()
	}
}

// bufLen returns the number of readable bytes in the ring buffer.
func (p *pipeImpl) bufLen() int {
	if !p.full {
		return (p.end - p.start) & (len(p.buf) - 1)
	}
	return len(p.buf)
}

// bufFree returns the number of writable bytes in the ring buffer.
func (p *pipeImpl) bufFree() int {
	return len(p.buf) - p.bufLen()
}

// bufRead copies up to len(dst) bytes from the ring buffer into dst
// using bulk copy(). Returns the number of bytes copied.
func (p *pipeImpl) bufRead(dst []byte) int {
	n := p.bufLen()
	if n > len(dst) {
		n = len(dst)
	}
	if n == 0 {
		return 0
	}

	// First contiguous segment: start → min(start+n, len(buf))
	if p.start+n <= len(p.buf) {
		copy(dst, p.buf[p.start:p.start+n])
	} else {
		// Wraps around: copy tail then head
		first := len(p.buf) - p.start
		copy(dst, p.buf[p.start:])
		copy(dst[first:], p.buf[:n-first])
	}
	p.start = (p.start + n) & (len(p.buf) - 1)
	p.full = false
	return n
}

// bufWrite copies up to len(src) bytes from src into the ring buffer
// using bulk copy(). Returns the number of bytes copied.
func (p *pipeImpl) bufWrite(src []byte) int {
	free := p.bufFree()
	if free > len(src) {
		free = len(src)
	}
	if free == 0 {
		return 0
	}

	// First contiguous segment: end → min(end+free, len(buf))
	if p.end+free <= len(p.buf) {
		copy(p.buf[p.end:p.end+free], src[:free])
	} else {
		// Wraps around: fill tail then head
		first := len(p.buf) - p.end
		copy(p.buf[p.end:], src[:first])
		copy(p.buf[:free-first], src[first:free])
	}
	p.end = (p.end + free) & (len(p.buf) - 1)
	if p.end == p.start {
		p.full = true
	}
	return free
}

func (p *pipeImpl) Read(b []byte) (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	for {
		if n := p.bufLen(); n > 0 {
			n = p.bufRead(b)
			p.cond.Broadcast()
			return n, nil
		}

		select {
		case <-p.done:
			if n := p.bufLen(); n > 0 {
				n = p.bufRead(b)
				p.cond.Broadcast()
				return n, nil
			}
			return 0, io.EOF
		default:
		}

		p.cond.Wait()
	}
}

func (p *pipeImpl) Write(b []byte) (int, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	total := 0
	for total < len(b) {
		select {
		case <-p.done:
			if total > 0 {
				return total, nil
			}
			return 0, io.ErrClosedPipe
		default:
		}

		n := p.bufWrite(b[total:])
		total += n
		if n > 0 {
			p.cond.Broadcast()
		}

		if total < len(b) {
			p.cond.Wait()
		}
	}
	return total, nil
}
