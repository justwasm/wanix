package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	fmt.Println("=== Go Toolchain Demo ===")
	fmt.Println("Parent PID:", os.Getpid())

	goroot := "/go-toolchain"
	env := append(os.Environ(), "GOROOT="+goroot)

	fmt.Println("\n--- go version ---")
	run(exec.Command(goroot+"/bin/go.wasm", "version"), env)

	fmt.Println("\n--- go env GOROOT ---")
	run(exec.Command(goroot+"/bin/go.wasm", "env", "GOROOT"), env)

	// Write a test program to the writable task directory
	cwd, _ := os.Getwd()
	fmt.Println("\n--- Write test program at", filepath.Join(cwd, "hello.go"), "---")
	testSrc := `package main
import "fmt"
func main() { fmt.Println("Hello from compiled Go!") }`
	if err := os.WriteFile("hello.go", []byte(testSrc), 0644); err != nil {
		fmt.Printf("write file error: %v\n", err)
	}

	fmt.Println("\n--- go build hello.go ---")
	cmd := exec.Command(goroot+"/bin/go.wasm", "build", "-o", "hello.wasm", "hello.go")
	cmd.Env = env
	cmd.Dir = cwd
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		fmt.Printf("go build error: %v\n", err)
	} else {
		fmt.Println("Build succeeded!")
	}

	fmt.Println("\n--- gofmt hello.go ---")
	run(exec.Command(goroot+"/bin/gofmt.wasm", "hello.go"), env)

	fmt.Println("\n=== Demo complete ===")
}

func run(cmd *exec.Cmd, env []string) {
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = env
	if err := cmd.Run(); err != nil {
		fmt.Printf("ERROR: %v\n", err)
	}
}
