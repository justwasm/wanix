package main

import (
	"fmt"
	"os"
	"os/exec"
)

func init() {
	if run(exec.Command("go", "version")) != nil {
		FetchTo(
			"https://no-cors.deno.dev/https://github.com/justwasm/go/releases/download/go1.27.0-wanix.5/go1.27.0-wanix.5.js-wasm.min.tar.gz",
			"/opt",
		)
	}
}

func main() {
	fmt.Println("=== Go Build Demo ===")
	fmt.Println("PID:", os.Getpid())

	fmt.Println("\n--- go version ---")
	run(exec.Command("go", "version"))

	fmt.Println("env", os.Environ())

	fmt.Println("\n--- go env ---")
	run(exec.Command("go", "env"))

	/*
		fmt.Println("\n--- go install std ---")
		run(exec.Command("go", "install", "-v", "std"))

		fmt.Println("\n--- go build std ---")
		run(exec.Command("go", "build", "-v", "std"))

		fmt.Println("\n--- go install std ---")
		run(exec.Command("go", "install", "-v", "std"))
	*/

	fmt.Println("\n--- go build ---")
	cmd := exec.Command("go", "build", "-v", "-trimpath", "-o", "hello.wasm", "hello.go")
	if err := run(cmd); err != nil {
		fmt.Printf("go build error: %v\n", err)
		return
	}
	fmt.Println("Build succeeded")

	fmt.Println("\n--- Run compiled binary ---")
	cmd = exec.Command("./hello.wasm")
	if err := run(cmd); err != nil {
		fmt.Printf("run hello.wasm error: %v\n", err)
	}

	fmt.Println("\n=== Demo complete ===")
}

func run(cmd *exec.Cmd) error {
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("ERROR: %v\n", err)
		return err
	}
	return nil
}
