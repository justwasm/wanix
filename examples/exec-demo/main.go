package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--child" {
		fmt.Println("Hello from child! Reading stdin...")
		var line string
		fmt.Scanln(&line)
		fmt.Println("echo:", line)
		os.Exit(0)
	}

	fmt.Println("=== os/exec demo (patched Go) ===")

	cmd := exec.Command(os.Args[0], "--child")
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	fmt.Printf("Exit code: %d\n", cmd.ProcessState.ExitCode())
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}
