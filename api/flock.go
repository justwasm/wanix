package api

import (
	"fmt"
	"sync"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/syscall"
)

var (
	fileLocks   = make(map[string]*fileLock)
	fileLocksMu sync.Mutex
)

// fileLock is a mutex backed by a buffered channel, enabling TryLock.
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
	<-l.ch
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

	ufd, ok := args[0].(uint64)
	if !ok {
		r.Return(fmt.Errorf("invalid argument: fd not uint64"))
		return
	}
	fd := int(ufd)

	uflags, ok := args[1].(uint64)
	if !ok {
		r.Return(fmt.Errorf("invalid argument: flags not uint64"))
		return
	}
	flags := int(uflags)

	_, path, err := s.task.FD(fd)
	if err != nil {
		r.Return(err)
		return
	}

	l := getFileLock(path)
	blocking := flags&syscall.LOCK_NB == 0
	flags &^= syscall.LOCK_NB

	switch flags {
	case syscall.LOCK_EX, syscall.LOCK_SH:
		if blocking {
			l.Lock()
		} else if !l.TryLock() {
			r.Return(syscall.EAGAIN)
			return
		}
	case syscall.LOCK_UN:
		l.Unlock()
	}
}
