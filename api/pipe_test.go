package api

import (
	"io"
	"testing"
)

func TestPipeBasic(t *testing.T) {
	p := newPipe()
	p.addWriter()

	// Write some data
	n, err := p.Write([]byte("hello"))
	if err != nil {
		t.Fatalf("Write: %v", err)
	}
	if n != 5 {
		t.Fatalf("Write returned %d, want 5", n)
	}

	// Read it back
	buf := make([]byte, 10)
	n, err = p.Read(buf)
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	if n != 5 {
		t.Fatalf("Read returned %d, want 5", n)
	}
	if string(buf[:n]) != "hello" {
		t.Fatalf("Read got %q, want %q", string(buf[:n]), "hello")
	}

	p.removeWriter()
}

func TestPipeEOF(t *testing.T) {
	p := newPipe()
	p.addWriter()

	// Write then close writer
	p.Write([]byte("data"))
	p.removeWriter()

	buf := make([]byte, 10)
	n, err := p.Read(buf)
	if err != nil {
		t.Fatalf("first Read: %v", err)
	}
	if n != 4 {
		t.Fatalf("first Read returned %d, want 4", n)
	}

	// Second read should get EOF
	n, err = p.Read(buf)
	if err != io.EOF {
		t.Fatalf("second Read: got err=%v, n=%d; want io.EOF", err, n)
	}
}

func TestPipeWriteAfterClose(t *testing.T) {
	p := newPipe()
	p.addWriter()
	p.removeWriter()

	_, err := p.Write([]byte("data"))
	if err != io.ErrClosedPipe {
		t.Fatalf("Write after close: got %v, want io.ErrClosedPipe", err)
	}
}

func TestPipePartialRead(t *testing.T) {
	p := newPipe()
	p.addWriter()

	p.Write([]byte("hello world"))

	// Read only 5 bytes
	buf := make([]byte, 5)
	n, err := p.Read(buf)
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	if n != 5 {
		t.Fatalf("Read returned %d, want 5", n)
	}
	if string(buf) != "hello" {
		t.Fatalf("got %q, want %q", string(buf), "hello")
	}

	p.removeWriter()
}

func TestPipeMultipleWriters(t *testing.T) {
	p := newPipe()
	p.addWriter()
	p.addWriter()

	p.Write([]byte("first "))
	p.Write([]byte("second"))

	// First writer closes
	p.removeWriter()

	// Should still be readable
	p.Write([]byte("third"))

	// Second writer closes
	p.removeWriter()

	buf := make([]byte, 100)
	n, err := p.Read(buf)
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	got := string(buf[:n])
	want := "first secondthird"
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}

	// Should get EOF now
	_, err = p.Read(buf)
	if err != io.EOF {
		t.Fatalf("expected EOF, got %v", err)
	}
}

func TestPipeReadBlocking(t *testing.T) {
	p := newPipe()
	p.addWriter()

	done := make(chan struct{})
	go func() {
		buf := make([]byte, 4)
		n, err := p.Read(buf)
		if err != nil {
			t.Errorf("Read: %v", err)
		}
		if string(buf[:n]) != "test" {
			t.Errorf("got %q, want %q", string(buf[:n]), "test")
		}
		close(done)
	}()

	p.Write([]byte("test"))
	<-done

	p.removeWriter()
}

func TestPipeLargeTransfer(t *testing.T) {
	p := newPipe()
	p.addWriter()

	size := 100000
	data := make([]byte, size)
	for i := range data {
		data[i] = byte(i & 0xff)
	}

	// Write concurrently
	go func() {
		p.Write(data)
		p.removeWriter()
	}()

	buf := make([]byte, size)
	total := 0
	for total < size {
		n, err := p.Read(buf[total:])
		if err != nil && err != io.EOF {
			t.Fatalf("Read: %v", err)
		}
		total += n
		if err == io.EOF {
			break
		}
	}

	if total != size {
		t.Fatalf("read %d bytes, want %d", total, size)
	}
	for i := range buf[:total] {
		if buf[i] != byte(i&0xff) {
			t.Fatalf("data mismatch at byte %d: got %d, want %d", i, buf[i], byte(i&0xff))
		}
	}
}

func TestPipePipeReadFileWriteFile(t *testing.T) {
	cp := newPipe()
	cp.addWriter()

	rf := &pipeReadFile{pipe: cp}
	wf := &pipeWriteFile{pipe: cp}

	// WriteFile can write
	n, err := wf.Write([]byte("pipe test"))
	if err != nil {
		t.Fatalf("WriteFile.Write: %v", err)
	}
	if n != 9 {
		t.Fatalf("WriteFile.Write returned %d, want 9", n)
	}

	// WriteFile can't read
	_, err = wf.Read(nil)
	if err == nil {
		t.Fatal("WriteFile.Read: expected error")
	}

	// ReadFile can read
	buf := make([]byte, 20)
	n, err = rf.Read(buf)
	if err != nil {
		t.Fatalf("ReadFile.Read: %v", err)
	}
	if string(buf[:n]) != "pipe test" {
		t.Fatalf("got %q, want %q", string(buf[:n]), "pipe test")
	}

	// ReadFile can't write
	_, err = rf.Write(nil)
	if err == nil {
		t.Fatal("ReadFile.Write: expected error")
	}

	// Close write side
	wf.Close()

	// Read should drain and get EOF
	buf = make([]byte, 10)
	_, err = rf.Read(buf)
	if err != io.EOF {
		t.Fatalf("after writer close: expected EOF, got %v", err)
	}

	// ReadFile close is no-op
	rf.Close()
}

func TestPipeConcurrentReadWrite(t *testing.T) {
	cp := newPipe()
	cp.addWriter()

	const goroutines = 10
	const msgsPerWriter = 100

	done := make(chan struct{})
	go func() {
		buf := make([]byte, 1024)
		total := 0
		for {
			n, err := cp.Read(buf)
			total += n
			if err == io.EOF {
				break
			}
			if err != nil {
				t.Errorf("Read: %v", err)
				return
			}
		}
		close(done)
	}()

	for i := 0; i < goroutines; i++ {
		cp.addWriter()
	}
	for i := 0; i < goroutines; i++ {
		go func(id int) {
			for j := 0; j < msgsPerWriter; j++ {
				msg := []byte("hello")
				cp.Write(msg)
			}
			cp.removeWriter()
		}(i)
	}

	// Remove initial writer
	cp.removeWriter()

	<-done
}
