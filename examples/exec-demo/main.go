package main

import (
	"bufio"
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
	fmt.Println("I'll echo anything you type. Send 'exit' or Ctrl+D to quit.")
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "exit" {
			break
		}
		fmt.Println("echo:", line)
	}
	fmt.Println("Child exiting.")
	os.Exit(0)
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

	// 3. Find our own term path to share with child
	myID := readStr("#task/self/id")
	myTermProg := fmt.Sprintf("#task/%s/term/program", myID)

	// ctl processes ONE command per open/write/close cycle
	writeTask(filepath.Join(taskPath, "ctl"),
		fmt.Sprintf("bind %s %s/fd/0", myTermProg, taskPath))
	writeTask(filepath.Join(taskPath, "ctl"),
		fmt.Sprintf("bind %s %s/fd/1", myTermProg, taskPath))
	writeTask(filepath.Join(taskPath, "ctl"),
		fmt.Sprintf("bind %s %s/fd/2", myTermProg, taskPath))

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
