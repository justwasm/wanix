package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	fmt.Println("=== Go Build Demo ===")
	fmt.Println("PID:", os.Getpid())

	goroot := "/go-toolchain"
	env := append(os.Environ(), "GOROOT="+goroot)

	fmt.Println("\n--- go version ---")
	run(exec.Command(goroot+"/bin/go.wasm", "version"), env)

	fmt.Println("\n--- Write test source ---")
	src := `package main
import "fmt"
func main() { fmt.Println("Hello from compiled Go!") }`
	if err := os.WriteFile("hello.go", []byte(src), 0644); err != nil {
		fmt.Printf("WriteFile error: %v\n", err)
		return
	}
	fmt.Println("Source written")

	fmt.Println("\n--- go build ---")
	cmd := exec.Command(goroot+"/bin/go.wasm", "build", "-o", "hello.wasm", "hello.go")
	cmd.Env = env
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("go build error: %v\n", err)
		return
	}
	fmt.Println("Build succeeded")

	fmt.Println("\n--- Run compiled binary ---")
	cmd2 := exec.Command("./hello.wasm")
	cmd2.Env = env
	cmd2.Stdin = os.Stdin
	cmd2.Stdout = os.Stdout
	cmd2.Stderr = os.Stderr
	if err := cmd2.Run(); err != nil {
		fmt.Printf("run error: %v\n", err)
	}

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
