package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
)

func main() {
	fmt.Println("=== Wanix os/exec Demo ===")
	fmt.Println("Parent PID:", os.Getpid())

	// Helper to create a command with stdin wired to avoid /dev/null
	cmd := func(name string, arg ...string) *exec.Cmd {
		c := exec.Command(name, arg...)
		c.Stdin = os.Stdin // avoid opening /dev/null which doesn't exist in VFS
		return c
	}

	// ----------------------------------------------------------------
	// Demo 1: Basic spawn with Output()
	// ----------------------------------------------------------------
	fmt.Println("\n--- Demo 1: exec.Command().Output() ---")
	c1 := cmd("/child.wasm", "hello", "world")
	out, err := c1.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Success (exit=%d):\n%s\n", c1.ProcessState.ExitCode(), string(out))
	}

	// ----------------------------------------------------------------
	// Demo 2: CombinedOutput() (stdout + stderr)
	// ----------------------------------------------------------------
	fmt.Println("--- Demo 2: exec.Command().CombinedOutput() ---")
	c2 := cmd("/child.wasm", "foo", "bar", "baz")
	combined, err := c2.CombinedOutput()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Combined output (exit=%d):\n%s\n", c2.ProcessState.ExitCode(), string(combined))
	}

	// ----------------------------------------------------------------
	// Demo 3: Custom environment variables
	// ----------------------------------------------------------------
	fmt.Println("--- Demo 3: Custom environment ---")
	c3 := cmd("/child.wasm", "env-demo")
	c3.Env = append(os.Environ(), "DEMO_VAR=custom_value_from_parent")
	out3, err3 := c3.Output()
	if err3 != nil {
		fmt.Printf("ERROR: %v\n", err3)
	} else {
		fmt.Printf("Output (exit=%d):\n%s\n", c3.ProcessState.ExitCode(), string(out3))
	}

	// ----------------------------------------------------------------
	// Demo 4: Non-zero exit code
	// ----------------------------------------------------------------
	fmt.Println("--- Demo 4: Non-zero exit code ---")
	c4 := cmd("/child.wasm", "exit:42")
	// Also avoid /dev/null for stdout/stderr. Since we use Run(), we need
	// to set them explicitly to prevent os/exec from opening /dev/null.
	c4.Stdout = os.Stdout
	c4.Stderr = os.Stderr
	err4 := c4.Run()
	if err4 != nil {
		if exitErr, ok := err4.(*exec.ExitError); ok {
			fmt.Printf("Expected error — exit code: %d\n", exitErr.ExitCode())
		} else {
			fmt.Printf("ERROR: %v\n", err4)
		}
	}

	// ----------------------------------------------------------------
	// Demo 5: os.Pipe() between two processes
	// ----------------------------------------------------------------
	fmt.Println("--- Demo 5: os.Pipe() ---")
	r, w, err := os.Pipe()
	if err != nil {
		fmt.Printf("Pipe error: %v\n", err)
	} else {
		fmt.Printf("Pipe created: readFd=%v, writeFd=%v\n", r.Fd(), w.Fd())
		w.WriteString("hello through pipe\n")
		buf := make([]byte, 64)
		n, _ := r.Read(buf)
		fmt.Printf("Pipe read: %s", string(buf[:n]))
		r.Close()
		w.Close()
	}

	// ----------------------------------------------------------------
	// Demo 6: Multiple concurrent processes
	// ----------------------------------------------------------------
	fmt.Println("--- Demo 6: Sequential multi-spawn ---")
	for i := 0; i < 3; i++ {
		c := cmd("/child.wasm", fmt.Sprintf("spawn:%d", i))
		out, err := c.Output()
		if err != nil {
			fmt.Printf("Spawn %d error: %v\n", i, err)
		} else {
			fmt.Printf("Spawn %d output:\n%s", i, string(out))
		}
	}

	fmt.Println("\n=== Demo complete ===")
}

// Ensure io is used (for potential future use)
var _ = io.Discard
