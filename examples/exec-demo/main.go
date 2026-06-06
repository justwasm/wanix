package main

import (
	"fmt"
	"os"
	"strings"

	exec "tractor.dev/wanix/os/exec"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--child" {
		child()
		return
	}
	parent()
}

func child() {
	fmt.Println("Hello from child process!")
	fmt.Println("I was spawned via wanix/os/exec!")
	fmt.Print("Arguments: ")
	fmt.Println(os.Args[1:])
	os.Exit(0)
}

func parent() {
	fmt.Println("=== wanix/os/exec demo ===")
	fmt.Println("Spawning child...")

	cmd := exec.Command("exec-demo.wasm", "--child")
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	out, err := cmd.Output()
	if err != nil {
		fmt.Printf("Command failed: %v\n", err)
		if exitErr, ok := err.(*exec.ExitError); ok {
			fmt.Printf("Exit code: %d\n", exitErr.ExitCode())
		}
		os.Exit(1)
	}
	fmt.Printf("Output:\n%s\n", strings.TrimSpace(string(out)))
	fmt.Printf("✅ Exit code: %d\n", cmd.ProcessState.ExitCode())
}
