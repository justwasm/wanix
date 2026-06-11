//go:build js && wasm

package pty

import (
	"os"
	"strconv"
	"sync"
	"syscall/js"

	"tractor.dev/wanix/misc/jsutil"
)

var (
	localMu      sync.Mutex
	localWinsize WinSize = WinSize{Rows: 24, Cols: 80}
	localWinch   []chan WinSize
)

func localSetWinSize(ws WinSize) {
	localMu.Lock()
	defer localMu.Unlock()
	localWinsize = ws
	for _, ch := range localWinch {
		select {
		case ch <- ws:
		default:
		}
	}
}

// MasterFile wraps an os.File and implements the Master interface.
type MasterFile struct {
	*os.File
	fd int
}

func (f *MasterFile) isTerminal()                  {}
func (f *MasterFile) GetWinSize() WinSize {
	localMu.Lock()
	defer localMu.Unlock()
	return localWinsize
}
func (f *MasterFile) SetWinSize(ws WinSize) error {
	_, err := jsutil.AwaitErr(js.Global().Get("sys").Call("setWinSize", f.fd, ws.Rows, ws.Cols, ws.Xpx, ws.Ypx))
	if err != nil {
		return err
	}
	localSetWinSize(ws)
	return nil
}

// SlaveFile wraps an os.File and implements the Slave interface.
type SlaveFile struct {
	*os.File
	fd int
}

func (f *SlaveFile) isTerminal()                  {}
func (f *SlaveFile) GetWinSize() WinSize {
	localMu.Lock()
	defer localMu.Unlock()
	return localWinsize
}
func (f *SlaveFile) AddWinch() <-chan WinSize {
	localMu.Lock()
	defer localMu.Unlock()
	ch := make(chan WinSize, 1)
	localWinch = append(localWinch, ch)
	return ch
}

// Open allocates a PTY pair via RPC and returns Master and Slave.
func Open() (Master, Slave, error) {
	f, err := os.OpenFile("/dev/ptmx", os.O_RDWR, 0)
	if err != nil {
		return nil, nil, err
	}

	slaveNum := js.Global().Get("_lastPtySlaveNum").Int()
	if slaveNum == 0 {
		f.Close()
		return nil, nil, ErrOpenFailed
	}

	sf, err := os.OpenFile("/dev/pts/"+strconv.Itoa(slaveNum), os.O_RDWR, 0)
	if err != nil {
		f.Close()
		return nil, nil, err
	}

	return &MasterFile{File: f, fd: int(f.Fd())}, &SlaveFile{File: sf, fd: int(sf.Fd())}, nil
}

// ErrOpenFailed is returned when pty allocation fails.
var ErrOpenFailed = &ptyError{"pty.open failed"}

type ptyError struct{ msg string }

func (e *ptyError) Error() string { return e.msg }
