package main

import (
	"bufio"
	"fmt"
	"os"

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
	fmt.Println("=== wanix/os/exec interactive demo ===")

	cmd := exec.Command(os.Args[0], "--child")
	cmd.InheritTTY = true

	if err := cmd.Run(); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("✅ Child exited with code %d\n", cmd.ProcessState.ExitCode())
}
