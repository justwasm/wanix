package main

import (
	"fmt"
	"os"

	exec "tractor.dev/wanix/os/exec"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--child" {
		fmt.Println("Hello from child process!")
		return
	}
	fmt.Println("=== wanix/os/exec demo ===")

	cmd := exec.Command(os.Args[0], "--child")
	err := cmd.Run()
	fmt.Printf("Exit code: %d\n", cmd.ProcessState.ExitCode())
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}
