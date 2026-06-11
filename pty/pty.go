package pty

import (
	"io"
	"strconv"
	"sync"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
)

// Master is implemented by the master end of a PTY pair.
// The master can get and set the terminal window size.
type Master interface {
	io.ReadWriteCloser
	Fd() uintptr
	isTerminal()
	GetWinSize() WinSize
	SetWinSize(ws WinSize) error
}

// Slave is implemented by the slave end of a PTY pair.
// The slave receives SIGWINCH notifications when the master resizes.
type Slave interface {
	io.ReadWriteCloser
	Fd() uintptr
	isTerminal()
	GetWinSize() WinSize
	AddWinch() <-chan WinSize
}

// PtyPair represents a pseudo-terminal pair with a master and slave end.
// Data written to one end can be read from the other.
type PtyPair struct {
	masterToSlave *Buffer
	slaveToMaster *Buffer
	master        *masterFile
	slave         *slaveFile
	slaveNum      int
	masterClosed  bool
	slaveClosed   bool
	mu            sync.Mutex
	winsize       WinSize
	winch         []chan WinSize
}

// WinSize represents the terminal window size.
type WinSize struct {
	Rows uint16
	Cols uint16
	Xpx  uint16
	Ypx  uint16
}

func NewPtyPair(slaveNum int) *PtyPair {
	p := &PtyPair{
		masterToSlave: NewBuffer(),
		slaveToMaster: NewBuffer(),
		slaveNum:      slaveNum,
		winsize:       WinSize{Rows: 24, Cols: 80},
	}
	p.master = &masterFile{pair: p}
	p.slave = &slaveFile{pair: p}
	return p
}

func (p *PtyPair) Master() *masterFile  { return p.master }
func (p *PtyPair) Slave() *slaveFile    { return p.slave }
func (p *PtyPair) SlaveNum() int        { return p.slaveNum }
func (p *PtyPair) SlavePath() string    { return "pts/" + strconv.Itoa(p.slaveNum) }

func (p *PtyPair) SetWinSize(ws WinSize) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.winsize = ws
	for _, ch := range p.winch {
		select {
		case ch <- ws:
		default:
		}
	}
}

func (p *PtyPair) AddWinch() <-chan WinSize {
	p.mu.Lock()
	defer p.mu.Unlock()
	ch := make(chan WinSize, 1)
	p.winch = append(p.winch, ch)
	return ch
}

func (p *PtyPair) GetWinSize() WinSize {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.winsize
}

func (p *PtyPair) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.masterClosed {
		p.masterClosed = true
		p.masterToSlave.Close()
	}
	if !p.slaveClosed {
		p.slaveClosed = true
		p.slaveToMaster.Close()
	}
}

// masterFile is the master end of a PTY pair.
// Reading returns data written by the slave; writing sends data to the slave.
type masterFile struct {
	pair *PtyPair
}

func (f *masterFile) Read(p []byte) (int, error) {
	return f.pair.slaveToMaster.Read(p)
}

func (f *masterFile) Write(p []byte) (int, error) {
	return f.pair.masterToSlave.Write(p)
}

func (f *masterFile) Close() error {
	f.pair.mu.Lock()
	defer f.pair.mu.Unlock()
	if !f.pair.masterClosed {
		f.pair.masterClosed = true
		f.pair.masterToSlave.Close()
	}
	return nil
}

func (f *masterFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("ptmx", 0666), nil
}

func (f *masterFile) isTerminal()                  {}
func (f *masterFile) GetWinSize() WinSize           { return f.pair.GetWinSize() }
func (f *masterFile) SetWinSize(ws WinSize) error   { f.pair.SetWinSize(ws); return nil }
func (f *masterFile) Fd() uintptr                   { return 0 }

// slaveFile is the slave end of a PTY pair.
// Reading returns data written by the master; writing sends data to the master.
type slaveFile struct {
	pair *PtyPair
}

func (f *slaveFile) Read(p []byte) (int, error) {
	return f.pair.masterToSlave.Read(p)
}

func (f *slaveFile) Write(p []byte) (int, error) {
	return f.pair.slaveToMaster.Write(p)
}

func (f *slaveFile) Close() error {
	// No-op: the slave is a shared singleton. Closing it would destroy the
	// underlying buffer for all holders (parent + child). Actual cleanup
	// happens via PtyPair.Close() when the device is torn down.
	return nil
}

func (f *slaveFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("tty", 0666), nil
}

func (f *slaveFile) isTerminal()                  {}
func (f *slaveFile) GetWinSize() WinSize           { return f.pair.GetWinSize() }
func (f *slaveFile) AddWinch() <-chan WinSize       { return f.pair.AddWinch() }
func (f *slaveFile) Fd() uintptr                   { return 0 }

// Buffer is a simple in-memory byte pipe.
type Buffer struct {
	mu       sync.Mutex
	data     []byte
	dataCond *sync.Cond
	closed   bool
}

func NewBuffer() *Buffer {
	b := &Buffer{}
	b.dataCond = sync.NewCond(&b.mu)
	return b
}

func (b *Buffer) Read(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	for len(b.data) == 0 && !b.closed {
		b.dataCond.Wait()
	}

	if b.closed && len(b.data) == 0 {
		return 0, io.EOF
	}

	n := copy(p, b.data)
	b.data = b.data[n:]
	return n, nil
}

func (b *Buffer) Write(data []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return 0, io.ErrClosedPipe
	}

	b.data = append(b.data, data...)
	b.dataCond.Signal()
	return len(data), nil
}

func (b *Buffer) Close() error {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.closed = true
	b.dataCond.Broadcast()
	return nil
}
