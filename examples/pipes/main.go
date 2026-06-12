package main

import (
	"fmt"
	"io"
	"net"
	"os"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/pipe"
	"tractor.dev/wanix/pty"
)

func devnull() {
	fmt.Println("=== /dev/null test ===")

	// 1. Open /dev/null for reading (O_RDONLY)
	f, err := os.Open(os.DevNull)
	if err != nil {
		fmt.Printf("FAIL: Open read: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: Open read succeeded")

	// 2. Read from /dev/null (should return EOF / zero bytes)
	buf := make([]byte, 16)
	n, err := f.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: Read: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: Read returned EOF (0 bytes)")
	f.Close()

	// 3. Open /dev/null for writing (O_WRONLY)
	f, err = os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	if err != nil {
		fmt.Printf("FAIL: Open write: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: Open write succeeded")

	// 4. Write to /dev/null (should succeed, data discarded)
	data := []byte("hello world")
	n, err = f.Write(data)
	if err != nil {
		fmt.Printf("FAIL: Write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: Write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: Write succeeded, data discarded")
	f.Close()

	// 5. Open /dev/null for read-write (O_RDWR)
	f, err = os.OpenFile(os.DevNull, os.O_RDWR, 0)
	if err != nil {
		fmt.Printf("FAIL: Open rdwr: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: Open rdwr succeeded")

	n, err = f.Write(data)
	if err != nil || n != len(data) {
		fmt.Printf("FAIL: Write rdwr: n=%d err=%v\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: Write rdwr succeeded")

	buf = make([]byte, 16)
	n, err = f.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: Read rdwr: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: Read rdwr returned EOF")
	f.Close()

	fmt.Println("=== ALL PASSED ===")
}

func iopipe() {
	fmt.Println("=== io.Pipe test ===")

	r, w := io.Pipe()

	go func() {
		data := []byte("hello from io.Pipe")
		n, err := w.Write(data)
		if err != nil {
			fmt.Printf("FAIL: io.Pipe write: %v\n", err)
			os.Exit(1)
		}
		if n != len(data) {
			fmt.Printf("FAIL: io.Pipe write returned %d, expected %d\n", n, len(data))
			os.Exit(1)
		}
		w.Close()
	}()

	buf := make([]byte, 32)
	n, err := r.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: io.Pipe read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from io.Pipe" {
		fmt.Printf("FAIL: io.Pipe read got %q, expected %q\n", buf[:n], "hello from io.Pipe")
		os.Exit(1)
	}
	fmt.Println("OK: io.Pipe read/write matched")

	n, err = r.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: io.Pipe read after close: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: io.Pipe EOF after close")
	r.Close()

	fmt.Println("=== ALL PASSED ===")
}

func ospipe() {
	fmt.Println("=== os.Pipe test ===")

	r, w, err := os.Pipe()
	if err != nil {
		fmt.Printf("FAIL: os.Pipe: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: os.Pipe created")

	data := []byte("hello from os.Pipe")
	n, err := w.Write(data)
	if err != nil {
		fmt.Printf("FAIL: os.Pipe write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: os.Pipe write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: os.Pipe write succeeded")

	buf := make([]byte, 32)
	n, err = r.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: os.Pipe read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from os.Pipe" {
		fmt.Printf("FAIL: os.Pipe read got %q, expected %q\n", buf[:n], "hello from os.Pipe")
		os.Exit(1)
	}
	fmt.Println("OK: os.Pipe read/write matched")

	w.Close()
	n, err = r.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: os.Pipe read after close: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: os.Pipe EOF after write close")
	r.Close()

	fmt.Println("=== ALL PASSED ===")
}

func ptmx() {
	fmt.Println("=== PTY test ===")

	master, slave, err := pty.Open()
	if err != nil {
		fmt.Printf("FAIL: pty.Open: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: pty.Open succeeded")

	data := []byte("hello from master")
	n, err := master.Write(data)
	if err != nil {
		fmt.Printf("FAIL: master write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: master write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: master write succeeded")

	buf := make([]byte, 32)
	n, err = slave.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: slave read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from master" {
		fmt.Printf("FAIL: slave read got %q, expected %q\n", buf[:n], "hello from master")
		os.Exit(1)
	}
	fmt.Println("OK: master→slave data matched")

	data = []byte("hello from slave")
	n, err = slave.Write(data)
	if err != nil {
		fmt.Printf("FAIL: slave write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: slave write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: slave write succeeded")

	buf = make([]byte, 32)
	n, err = master.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: master read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from slave" {
		fmt.Printf("FAIL: master read got %q, expected %q\n", buf[:n], "hello from slave")
		os.Exit(1)
	}
	fmt.Println("OK: slave→master data matched")

	master.Close()
	slave.Close()
	fmt.Println("OK: PTY closed")

	fmt.Println("=== ALL PASSED ===")
}

func netpipe() {
	fmt.Println("=== net.Pipe test ===")

	c1, c2 := net.Pipe()

	done := make(chan bool)
	go func() {
		data := []byte("hello from net.Pipe")
		n, err := c1.Write(data)
		if err != nil {
			fmt.Printf("FAIL: net.Pipe c1 write: %v\n", err)
			os.Exit(1)
		}
		if n != len(data) {
			fmt.Printf("FAIL: net.Pipe c1 write returned %d, expected %d\n", n, len(data))
			os.Exit(1)
		}
		c1.Close()
		done <- true
	}()

	buf := make([]byte, 32)
	n, err := c2.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: net.Pipe c2 read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from net.Pipe" {
		fmt.Printf("FAIL: net.Pipe c2 read got %q, expected %q\n", buf[:n], "hello from net.Pipe")
		os.Exit(1)
	}
	fmt.Println("OK: net.Pipe read/write matched (c1→c2)")
	<-done

	n, err = c2.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: net.Pipe c2 read after close: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: net.Pipe EOF after close")
	c2.Close()

	c1, c2 = net.Pipe()
	data := []byte("hello the other way")
	go func() {
		n, err := c2.Write(data)
		if err != nil {
			fmt.Printf("FAIL: net.Pipe c2 write: %v\n", err)
			os.Exit(1)
		}
		if n != len(data) {
			fmt.Printf("FAIL: net.Pipe c2 write returned %d, expected %d\n", n, len(data))
			os.Exit(1)
		}
		c2.Close()
		done <- true
	}()

	buf = make([]byte, 32)
	n, err = c1.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: net.Pipe c1 read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello the other way" {
		fmt.Printf("FAIL: net.Pipe c1 read got %q, expected %q\n", buf[:n], "hello the other way")
		os.Exit(1)
	}
	fmt.Println("OK: net.Pipe read/write matched (c2→c1)")
	<-done
	c1.Close()

	fmt.Println("=== ALL PASSED ===")
}

func wanixpipe() {
	fmt.Println("=== wanix fs/pipe.New test ===")

	p1, p2 := pipe.New(false)

	data := []byte("hello from p1")
	n, err := p1.Write(data)
	if err != nil {
		fmt.Printf("FAIL: p1 write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: p1 write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: p1 write succeeded")

	buf := make([]byte, 32)
	n, err = p2.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: p2 read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from p1" {
		fmt.Printf("FAIL: p2 read got %q, expected %q\n", buf[:n], "hello from p1")
		os.Exit(1)
	}
	fmt.Println("OK: p1→p2 data matched")

	data = []byte("hello from p2")
	n, err = p2.Write(data)
	if err != nil {
		fmt.Printf("FAIL: p2 write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: p2 write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: p2 write succeeded")

	buf = make([]byte, 32)
	n, err = p1.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: p1 read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello from p2" {
		fmt.Printf("FAIL: p1 read got %q, expected %q\n", buf[:n], "hello from p2")
		os.Exit(1)
	}
	fmt.Println("OK: p2→p1 data matched")

	p1.Close()
	n, err = p2.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: p2 read after close: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: EOF after close")

	fmt.Println("=== ALL PASSED ===")
}

func wanixpipefs() {
	fmt.Println("=== wanix fs/pipe.PipeFS test ===")

	fsys, pf1, _ := pipe.NewFS(false)

	f1, err := fsys.Open("data")
	if err != nil {
		fmt.Printf("FAIL: open data: %v\n", err)
		os.Exit(1)
	}
	f2, err := fsys.Open("data1")
	if err != nil {
		fmt.Printf("FAIL: open data1: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK: opened data and data1 files")

	data := []byte("hello through files")
	n, err := fs.Write(f1, data)
	if err != nil {
		fmt.Printf("FAIL: data write: %v\n", err)
		os.Exit(1)
	}
	if n != len(data) {
		fmt.Printf("FAIL: data write returned %d, expected %d\n", n, len(data))
		os.Exit(1)
	}
	fmt.Println("OK: data write succeeded")

	buf := make([]byte, 32)
	n, err = f2.Read(buf)
	if err != nil {
		fmt.Printf("FAIL: data1 read: %v\n", err)
		os.Exit(1)
	}
	if string(buf[:n]) != "hello through files" {
		fmt.Printf("FAIL: data1 read got %q, expected %q\n", buf[:n], "hello through files")
		os.Exit(1)
	}
	fmt.Println("OK: data→data1 matched")

	pf1.Port.Close()
	n, err = f2.Read(buf)
	if n != 0 || err != io.EOF {
		fmt.Printf("FAIL: data1 read after close: n=%d err=%v (expected 0, EOF)\n", n, err)
		os.Exit(1)
	}
	fmt.Println("OK: EOF after close")

	f1.Close()
	f2.Close()

	fmt.Println("=== ALL PASSED ===")
}

func main() {
	devnull()
	iopipe()
	ospipe()
	ptmx()
	netpipe()
	wanixpipe()
	wanixpipefs()
}
