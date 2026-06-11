package pty

import (
	"testing"
	"time"
)

func TestPtyPairBasic(t *testing.T) {
	pair := NewPtyPair(1)

	// Test bidirectional communication
	go func() {
		// Slave writes
		pair.Slave().Write([]byte("hello from slave"))
	}()

	// Master reads
	buf := make([]byte, 128)
	n, err := pair.Master().Read(buf)
	if err != nil {
		t.Fatalf("master read failed: %v", err)
	}
	if string(buf[:n]) != "hello from slave" {
		t.Fatalf("expected 'hello from slave', got %q", string(buf[:n]))
	}

	// Master writes
	go func() {
		pair.Master().Write([]byte("hello from master"))
	}()

	// Slave reads
	n, err = pair.Slave().Read(buf)
	if err != nil {
		t.Fatalf("slave read failed: %v", err)
	}
	if string(buf[:n]) != "hello from master" {
		t.Fatalf("expected 'hello from master', got %q", string(buf[:n]))
	}
}

func TestPtyPairConcurrent(t *testing.T) {
	pair := NewPtyPair(2)

	done := make(chan struct{})

	// Master writer
	go func() {
		defer close(done)
		for i := 0; i < 10; i++ {
			pair.Master().Write([]byte("m"))
		}
		pair.Master().Close()
	}()

	// Slave reader — byte pipe concatenates, so read all and check total
	go func() {
		buf := make([]byte, 128)
		total := 0
		for {
			n, err := pair.Slave().Read(buf)
			if n > 0 {
				total += n
			}
			if err != nil {
				break
			}
		}
		if total != 10 {
			t.Errorf("expected 10 bytes, got %d", total)
		}
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("timeout")
	}
}

func TestPtyPairClose(t *testing.T) {
	pair := NewPtyPair(3)

	// Close master
	pair.Master().Close()

	// Slave write succeeds (data goes to buffer, but master won't read)
	_, err := pair.Slave().Write([]byte("test"))
	if err != nil {
		t.Fatalf("slave write should succeed after master close: %v", err)
	}

	// Slave read returns EOF (masterToSlave buffer is closed)
	buf := make([]byte, 128)
	_, err = pair.Slave().Read(buf)
	if err == nil {
		t.Fatal("expected EOF reading from slave after master close")
	}
}

func TestWinSize(t *testing.T) {
	pair := NewPtyPair(4)

	ws := pair.GetWinSize()
	if ws.Rows != 24 || ws.Cols != 80 {
		t.Fatalf("expected 24x80, got %dx%d", ws.Rows, ws.Cols)
	}

	pair.SetWinSize(WinSize{Rows: 50, Cols: 120})
	ws = pair.GetWinSize()
	if ws.Rows != 50 || ws.Cols != 120 {
		t.Fatalf("expected 50x120, got %dx%d", ws.Rows, ws.Cols)
	}
}

func TestDeviceAlloc(t *testing.T) {
	dev := New()

	pair1 := dev.Alloc()
	pair2 := dev.Alloc()

	if pair1.SlaveNum() != 1 {
		t.Fatalf("expected slave num 1, got %d", pair1.SlaveNum())
	}
	if pair2.SlaveNum() != 2 {
		t.Fatalf("expected slave num 2, got %d", pair2.SlaveNum())
	}

	p, ok := dev.get(1)
	if !ok || p != pair1 {
		t.Fatal("expected to find pair1")
	}
}
