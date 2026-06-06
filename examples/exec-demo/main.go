package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--child" {
		child()
		return
	}
	parent()
}

func child() {
	fmt.Println("👋 Hello from child process!")
	fmt.Println("Reading a line from stdin (type something and press Enter):")
	var line string
	fmt.Scanln(&line)
	fmt.Printf("Child got: %q\n", line)
	os.Exit(42)
}

func parent() {
	fmt.Println("=== Go WASM exec demo ===")
	fmt.Println("Parent: spawning child task...")

	// 1. Allocate a new gojs task — returns e.g. "3"
	taskID := readStr("#task/new/gojs")
	taskPath := filepath.Join("#task", taskID)

	// 2. Set command via ctl — writeTask writes the cmd to the child's files
	writeTask(filepath.Join(taskPath, "cmd"), os.Args[0]+" --child")
	writeTask(filepath.Join(taskPath, "env"), "HELLO=from_parent")

	// 3. Bind child's fds to our term so child can output here
	ctl := fmt.Sprintf("bind self/term/program %s/fd/0\n", taskPath)
	ctl += fmt.Sprintf("bind self/term/program %s/fd/1\n", taskPath)
	ctl += fmt.Sprintf("bind self/term/program %s/fd/2\n", taskPath)
	writeTask(filepath.Join(taskPath, "ctl"), ctl)

	// 4. Start child
	writeTask(filepath.Join(taskPath, "ctl"), "start")

	fmt.Println("Parent: waiting for child to exit...")

	// 5. Poll exit file
	code := waitExit(filepath.Join(taskPath, "exit"))
	fmt.Printf("\n✅ Child exited with code %d\n", code)
}

func readStr(path string) string {
	out, err := os.ReadFile(path)
	if err != nil {
		fmt.Printf("FATAL: read %s: %v\n", path, err)
		os.Exit(1)
	}
	return strings.TrimSpace(string(out))
}

func writeTask(path, data string) {
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("FATAL: open %s: %v\n", path, err)
		os.Exit(1)
	}
	defer f.Close()
	if _, err := f.Write([]byte(data)); err != nil {
		fmt.Printf("FATAL: write %s: %v\n", path, err)
		os.Exit(1)
	}
}

func waitExit(path string) int {
	for {
		out, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("FATAL: read exit: %v\n", err)
			os.Exit(1)
		}
		s := strings.TrimSpace(string(out))
		if s == "" {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		code, err := strconv.Atoi(s)
		if err != nil {
			fmt.Printf("FATAL: bad exit code %q: %v\n", s, err)
			os.Exit(1)
		}
		return code
	}
}
