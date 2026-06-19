package term

import (
	"context"
	"io"
	"os"
	"runtime"
	"testing"

	"tractor.dev/wanix/fs"
)

func TestNewAllocatesID(t *testing.T) {
	ctx := context.Background()
	s := New(nil)
	f, err := fs.OpenContext(ctx, s, "new")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	var buf [16]byte
	n, err := f.Read(buf[:])
	if err != nil {
		t.Fatal(err)
	}
	if string(buf[:n]) != "1\n" {
		t.Fatalf("got %q, want %q", buf[:n], "1\n")
	}
}

func TestDataProgramPipe(t *testing.T) {
	ctx := context.Background()
	s := New(nil)
	newf, err := fs.OpenContext(ctx, s, "new")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := newf.Read(make([]byte, 8)); err != nil {
		t.Fatal(err)
	}
	newf.Close()

	df, err := fs.OpenContext(ctx, s, "1/data")
	if err != nil {
		t.Fatal(err)
	}
	defer df.Close()
	pf, err := fs.OpenContext(ctx, s, "1/program")
	if err != nil {
		t.Fatal(err)
	}
	defer pf.Close()

	msg := []byte("hello")
	if _, err := df.(io.Writer).Write(msg); err != nil {
		t.Fatal(err)
	}
	out := make([]byte, len(msg))
	if _, err := io.ReadFull(pf, out); err != nil {
		t.Fatal(err)
	}
	if string(out) != string(msg) {
		t.Fatalf("program read %q, want %q", out, msg)
	}
}

func TestProgramEOFRemoves(t *testing.T) {
	ctx := context.Background()
	s := New(nil)
	newf, err := fs.OpenContext(ctx, s, "new")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := newf.Read(make([]byte, 8)); err != nil {
		t.Fatal(err)
	}
	newf.Close()

	res, err := s.Get("1")
	if err != nil {
		t.Fatal(err)
	}
	if res == nil {
		t.Fatal("missing resource")
	}
	if err := res.end.Close(); err != nil {
		t.Fatal(err)
	}

	prog, err := fs.OpenContext(ctx, s, "1/program")
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	buf := make([]byte, 8)
	_, err = prog.Read(buf)
	if err != io.EOF {
		t.Fatalf("Read: got %v, want EOF", err)
	}

	s.mu.RLock()
	_, ok := s.resources["1"]
	s.mu.RUnlock()
	if ok {
		t.Fatal("resource should be removed after program EOF")
	}
}

func TestWinchBroadcast(t *testing.T) {
	ctx := context.Background()
	s := New(nil)
	newf, err := fs.OpenContext(ctx, s, "new")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := newf.Read(make([]byte, 8)); err != nil {
		t.Fatal(err)
	}
	newf.Close()

	r1, err := fs.OpenContext(ctx, s, "1/winch")
	if err != nil {
		t.Fatal(err)
	}
	defer r1.Close()
	r2, err := fs.OpenContext(ctx, s, "1/winch")
	if err != nil {
		t.Fatal(err)
	}
	defer r2.Close()

	ch1 := make(chan string)
	ch2 := make(chan string)
	go func() {
		b := make([]byte, 4)
		n, err := r1.Read(b)
		if err != nil {
			ch1 <- ""
			return
		}
		ch1 <- string(b[:n])
	}()
	go func() {
		b := make([]byte, 4)
		n, err := r2.Read(b)
		if err != nil {
			ch2 <- ""
			return
		}
		ch2 <- string(b[:n])
	}()

	res, err := s.Get("1")
	if err != nil {
		t.Fatal(err)
	}
	for res.hub.SubscriberCount() < 2 {
		runtime.Gosched()
	}

	w, err := fs.OpenFile(s, "1/winch", os.O_WRONLY, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer w.Close()
	if _, err := w.(io.Writer).Write([]byte("x")); err != nil {
		t.Fatal(err)
	}
	if s1, s2 := <-ch1, <-ch2; s1 != "x" || s2 != "x" {
		t.Fatalf("r1=%q r2=%q", s1, s2)
	}
}

func TestWinchLastValue(t *testing.T) {
	ctx := context.Background()
	s := New(nil)
	newf, err := fs.OpenContext(ctx, s, "new")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := newf.Read(make([]byte, 8)); err != nil {
		t.Fatal(err)
	}
	newf.Close()

	// write to winch first, before any reader
	w, err := fs.OpenFile(s, "1/winch", os.O_WRONLY, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer w.Close()
	if _, err := w.(io.Writer).Write([]byte("hello")); err != nil {
		t.Fatal(err)
	}

	// now open a reader — it should get the last value immediately
	r, err := fs.OpenContext(ctx, s, "1/winch")
	if err != nil {
		t.Fatal(err)
	}
	defer r.Close()

	b := make([]byte, 16)
	n, err := r.Read(b)
	if err != nil {
		t.Fatal(err)
	}
	if string(b[:n]) != "hello" {
		t.Fatalf("got %q, want %q", b[:n], "hello")
	}

	// write a new value, reader that opens later gets the latest
	w2, err := fs.OpenFile(s, "1/winch", os.O_WRONLY, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer w2.Close()
	if _, err := w2.(io.Writer).Write([]byte("world")); err != nil {
		t.Fatal(err)
	}

	r2, err := fs.OpenContext(ctx, s, "1/winch")
	if err != nil {
		t.Fatal(err)
	}
	defer r2.Close()

	b2 := make([]byte, 16)
	n2, err := r2.Read(b2)
	if err != nil {
		t.Fatal(err)
	}
	if string(b2[:n2]) != "world" {
		t.Fatalf("got %q, want %q", b2[:n2], "world")
	}
}
