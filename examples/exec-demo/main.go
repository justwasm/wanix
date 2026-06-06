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
	fmt.Println("I'm running in my own Web Worker via os/exec-like spawning.")
	os.Exit(42)
}

func parent() {
	fmt.Println("=== Go WASM exec demo ===")
	fmt.Println("Parent: spawning child...")

	// 1. Allocate a new gojs task (this creates a new Web Worker)
	taskID, err := readFile(strings.TrimSpace, "#task/new/gojs")
	if err != nil {
		fmt.Printf("Parent: allocation failed: %v\n", err)
		os.Exit(1)
	}
	taskPath := filepath.Join("#task", taskID)

	// 2. Set the command — spawn the same WASM binary with --child flag
	//    The binary path is os.Args[0], which the GoJS worker resolves
	childArg := os.Args[0] + " --child"
	if err := os.WriteFile(filepath.Join(taskPath, "cmd"), []byte(childArg), 0644); err != nil {
		fmt.Printf("Parent: write cmd failed: %v\n", err)
		os.Exit(1)
	}

	// 3. Bind child's fds to our own term (shares the terminal)
	ctl := fmt.Sprintf("bind self/term/program %s/fd/0\n", taskPath)
	ctl += fmt.Sprintf("bind self/term/program %s/fd/1\n", taskPath)
	ctl += fmt.Sprintf("bind self/term/program %s/fd/2\n", taskPath)
	if err := os.WriteFile(filepath.Join(taskPath, "ctl"), []byte(ctl), 0644); err != nil {
		fmt.Printf("Parent: bind fds failed: %v\n", err)
		os.Exit(1)
	}

	// 4. Start the child
	if err := os.WriteFile(filepath.Join(taskPath, "ctl"), []byte("start"), 0644); err != nil {
		fmt.Printf("Parent: start failed: %v\n", err)
		os.Exit(1)
	}

	// 5. Wait for child to exit (poll #task/<id>/exit)
	exitCode, err := waitExitCode(taskPath)
	if err != nil {
		fmt.Printf("Parent: wait failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("\n✅ Child exited with code %d\n", exitCode)
}

func waitExitCode(taskPath string) (int, error) {
	exitPath := filepath.Join(taskPath, "exit")
	for {
		out, err := os.ReadFile(exitPath)
		if err != nil {
			return 1, err
		}
		s := strings.TrimSpace(string(out))
		if s == "" {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		return strconv.Atoi(s)
	}
}

func readFile(fn func(string) string, path string) (string, error) {
	out, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return fn(string(out)), nil
}
