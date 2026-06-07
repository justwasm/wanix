package api

import (
	"sync"
	"syscall"

	"tractor.dev/toolkit-go/duplex/rpc"
)

var (
	fileLocks   = make(map[string]*sync.Mutex)
	fileLocksMu sync.Mutex
)

func getFileLock(path string) *sync.Mutex {
	fileLocksMu.Lock()
	defer fileLocksMu.Unlock()
	if l, ok := fileLocks[path]; ok {
		return l
	}
	l := new(sync.Mutex)
	fileLocks[path] = l
	return l
}

func (s *syscaller) flock(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	ufd, ok := args[0].(uint64)
	if !ok {
		panic("arg 0 is not a uint64")
	}
	fd := int(ufd)

	uflags, ok := args[1].(uint64)
	if !ok {
		panic("arg 1 is not a uint64")
	}
	flags := int(uflags)

	_, path, err := s.task.FD(fd)
	if err != nil {
		r.Return(err)
		return
	}

	l := getFileLock(path)
	shouldLock := flags&syscall.LOCK_NB == 0
	flags &^= syscall.LOCK_NB

	switch flags {
	case syscall.LOCK_EX, syscall.LOCK_SH:
		if shouldLock {
			l.Lock()
		} else if !tryLock(l) {
			r.Return(syscall.EAGAIN)
			return
		}
	case syscall.LOCK_UN:
		l.Unlock()
	}
}

// tryLock attempts to acquire the lock without blocking.
func tryLock(m *sync.Mutex) bool {
	locked := make(chan struct{}, 1)
	go func() {
		m.Lock()
		locked <- struct{}{}
	}()
	select {
	case <-locked:
		return true
	default:
		return false
	}
}
