package wanix

import (
	"testing"

	"tractor.dev/wanix/fs"
)

// Regression: nullFile embeds fs.File (which may be nil) and must not
// forward Stat to the embedded value, or namespace resolution of an
// unbound standard descriptor (a spawned child's inherited fd) panics
// with a nil pointer dereference and takes the whole kernel down.
func TestNullFileStat(t *testing.T) {
	var f fs.File = &nullFile{}
	fi, err := f.Stat()
	if err != nil {
		t.Fatal(err)
	}
	if fi.IsDir() {
		t.Fatal("nullFile should report a regular file")
	}
}

func TestNullFileIO(t *testing.T) {
	var f fs.File = &nullFile{}
	if n, err := fs.Write(f, []byte("discard")); err != nil || n != 7 {
		t.Fatalf("write: n=%d err=%v", n, err)
	}
	buf := make([]byte, 4)
	if n, err := f.Read(buf); err == nil || n != 0 {
		t.Fatalf("read: n=%d err=%v", n, err)
	}
	if err := f.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}
}
