package pty

import (
	"context"
	"strconv"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
)

// Device manages PTY allocation. It is bound at #ptmx in the kernel namespace.
//
// Namespace layout:
//
//	#ptmx/
//	  new        - read to allocate a new PTY pair, returns slave number
//	  pts/       - directory listing of PTY slave devices
//	    {N}      - slave end of PTY pair N
type Device struct {
	pairs   map[int]*PtyPair
	nextNum int
}

func New() *Device {
	return &Device{
		pairs:   make(map[int]*PtyPair),
		nextNum: 0,
	}
}

func (d *Device) Alloc() *PtyPair {
	d.nextNum++
	num := d.nextNum
	pair := NewPtyPair(num)
	d.pairs[num] = pair
	return pair
}

func (d *Device) get(num int) (*PtyPair, bool) {
	pair, ok := d.pairs[num]
	return pair, ok
}

// Open implements fs.FS for the #ptmx device.
func (d *Device) Open(name string) (fs.File, error) {
	return d.OpenContext(context.Background(), name)
}

func (d *Device) StatContext(ctx context.Context, name string) (fs.FileInfo, error) {
	if name == "." {
		return fskit.Entry(".", fs.ModeDir|0755), nil
	}
	if name == "new" {
		return fskit.Entry("new", 0666), nil
	}
	if name == "pts" {
		return fskit.Entry("pts", fs.ModeDir|0755), nil
	}
	if slaveNum, ok := parsePath(name, "pts/"); ok {
		if _, ok := d.get(slaveNum); ok {
			return fskit.Entry(strconv.Itoa(slaveNum), 0666), nil
		}
	}
	return nil, &fs.PathError{Op: "stat", Path: name, Err: fs.ErrNotExist}
}

func (d *Device) OpenContext(ctx context.Context, name string) (fs.File, error) {
	if name == "." {
		return fskit.DirFile(fskit.Entry(".", fs.ModeDir|0755),
			fskit.Entry("new", 0666),
			fskit.Entry("pts", fs.ModeDir|0755),
		), nil
	}

	if name == "new" {
		return &allocFile{dev: d}, nil
	}

	if name == "pts" {
		return d.openPtsDir()
	}

	// Check for pts/{N} - slave device
	if slaveNum, ok := parsePath(name, "pts/"); ok {
		if pair, ok := d.get(slaveNum); ok {
			return pair.Slave(), nil
		}
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
	}

	return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
}

func (d *Device) openPtsDir() (fs.File, error) {
	var entries []fs.DirEntry
	for num := range d.pairs {
		entries = append(entries, fskit.Entry(strconv.Itoa(num), 0666))
	}
	return fskit.DirFile(fskit.Entry(".", fs.ModeDir|0755), entries...), nil
}

func parsePath(name, prefix string) (int, bool) {
	if len(name) > len(prefix) && name[:len(prefix)] == prefix {
		numStr := name[len(prefix):]
		num, err := strconv.Atoi(numStr)
		if err != nil {
			return 0, false
		}
		return num, true
	}
	return 0, false
}

// allocFile allocates a new PTY pair when read.
type allocFile struct {
	dev  *Device
	done bool
}

func (f *allocFile) Read(p []byte) (int, error) {
	if f.done {
		return 0, fs.ErrNotExist
	}
	f.done = true
	pair := f.dev.Alloc()
	data := []byte(strconv.Itoa(pair.SlaveNum()) + "\n")
	n := copy(p, data)
	return n, nil
}

func (f *allocFile) Write(p []byte) (int, error) { return 0, fs.ErrPermission }
func (f *allocFile) Close() error                { return nil }
func (f *allocFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry("new", 0666), nil
}

// PtsDir lists available PTY slave devices.
type PtsDir struct {
	dev *Device
}

func (p *PtsDir) Open(name string) (fs.File, error) {
	return p.OpenContext(context.Background(), name)
}

func (p *PtsDir) OpenContext(ctx context.Context, name string) (fs.File, error) {
	if name == "." {
		var entries []fs.DirEntry
		for num := range p.dev.pairs {
			entries = append(entries, fskit.Entry(strconv.Itoa(num), 0666))
		}
		return fskit.DirFile(fskit.Entry(".", fs.ModeDir|0755), entries...), nil
	}

	num, err := strconv.Atoi(name)
	if err != nil {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
	}

	pair, ok := p.dev.get(num)
	if !ok {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
	}

	return pair.Slave(), nil
}
