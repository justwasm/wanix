package api

import (
	"fmt"
	"sync"

	"tractor.dev/toolkit-go/duplex/rpc"
)

// POSIX flock operation bits. Keep these local because syscall does not
// expose LOCK_* on js/wasm, while GoJS passes the standard values.
const (
	lockShared    = 1
	lockExclusive = 2
	lockNonblock  = 4
	lockUnlock    = 8
)

var (
	fileLocks   = make(map[string]*fileLock)
	fileLocksMu sync.Mutex
)

// fileLock is a channel-backed mutex with a non-blocking acquisition path.
// Unlike a goroutine-based TryLock, it cannot leak a waiter after failure.
type fileLock struct {
	ch chan struct{}
}

func newFileLock() *fileLock {
	return &fileLock{ch: make(chan struct{}, 1)}
}

func (l *fileLock) Lock() {
	l.ch <- struct{}{}
}

func (l *fileLock) Unlock() {
	select {
	case <-l.ch:
	default:
	}
}

func (l *fileLock) TryLock() bool {
	select {
	case l.ch <- struct{}{}:
		return true
	default:
		return false
	}
}

func getFileLock(path string) *fileLock {
	fileLocksMu.Lock()
	defer fileLocksMu.Unlock()
	if l, ok := fileLocks[path]; ok {
		return l
	}
	l := newFileLock()
	fileLocks[path] = l
	return l
}

func (s *syscaller) flock(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)
	if len(args) < 2 {
		r.Return(fmt.Errorf("flock requires a file descriptor and operation"))
		return
	}

	fd, ok := args[0].(uint64)
	if !ok {
		r.Return(fmt.Errorf("invalid flock file descriptor"))
		return
	}
	flags, ok := args[1].(uint64)
	if !ok {
		r.Return(fmt.Errorf("invalid flock operation"))
		return
	}

	_, path, err := s.task.FD(int(fd))
	if err != nil {
		r.Return(err)
		return
	}

	l := getFileLock(path)
	blocking := flags&lockNonblock == 0
	operation := flags &^ lockNonblock
	switch operation {
	case lockExclusive, lockShared:
		if blocking {
			l.Lock()
		} else if !l.TryLock() {
			r.Return(fmt.Errorf("resource temporarily unavailable"))
		}
	case lockUnlock:
		l.Unlock()
	default:
		r.Return(fmt.Errorf("invalid flock operation: %d", operation))
	}
}
