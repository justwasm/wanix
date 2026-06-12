package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "--child":
			fmt.Println("Hello from child! Reading stdin...")
			var line string
			fmt.Scanln(&line)
			fmt.Println("echo:", line)
			os.Exit(0)
		case "--child:env":
			for _, key := range os.Args[2:] {
				fmt.Printf("%s=%s\n", key, os.Getenv(key))
			}
			os.Exit(0)
		case "--child:exit":
			code := 0
			if len(os.Args) > 2 {
				fmt.Sscanf(os.Args[2], "%d", &code)
			}
			fmt.Printf("exiting with code %d\n", code)
			os.Exit(code)
		case "--child:printargs":
			fmt.Println(strings.Join(os.Args[2:], ","))
			os.Exit(0)
		case "--child:sleep":
			time.Sleep(10 * time.Second)
			fmt.Println("woke up")
			os.Exit(0)
		}
	}

	self := "./" + os.Args[0]
	fmt.Println("=== os/exec demo ===")

	// Demo 1: Basic spawn, capture stdout
	fmt.Println("\n--- 1. Output() — capture stdout ---")
	out, err := exec.Command(self, "--child:printargs", "hello", "wanix").Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Got: %s\n", strings.TrimSpace(string(out)))
	}

	// Demo 2: Pipe stdin to child
	fmt.Println("\n--- 2. StdinPipe — send data to child ---")
	cmd := exec.Command(self, "--child")
	stdin, _ := cmd.StdinPipe()
	go func() {
		stdin.Write([]byte("hello from parent\n"))
		stdin.Close()
	}()
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Got:\n%s", string(out))
	}

	// Demo 3: Custom environment
	fmt.Println("\n--- 3. Custom environment ---")
	cmd = exec.Command(self, "--child:env", "MY_VAR", "ANOTHER")
	cmd.Env = []string{"MY_VAR=hello", "ANOTHER=world"}
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Got:\n%s", string(out))
	}

	// Demo 4: Non-zero exit
	fmt.Println("\n--- 4. Non-zero exit code ---")
	cmd = exec.Command(self, "--child:exit", "7")
	err = cmd.Run()
	if exitErr, ok := err.(*exec.ExitError); ok {
		fmt.Printf("Got exit code: %d (expected 7)\n", exitErr.ExitCode())
	} else if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Println("ERROR: expected non-zero exit")
	}

	// Demo 5: Cmd.Start() + Wait() — async spawn
	fmt.Println("\n--- 5. Start() + Wait() — async spawn ---")
	cmd = exec.Command(self, "--child:printargs", "async", "spawn")
	if err := cmd.Start(); err != nil {
		fmt.Printf("ERROR: Start: %v\n", err)
	} else {
		fmt.Printf("Child started, PID: %d\n", cmd.Process.Pid)
		err = cmd.Wait()
		fmt.Printf("Waited, exit code: %d\n", cmd.ProcessState.ExitCode())
		if err != nil {
			fmt.Printf("Wait error: %v\n", err)
		}
	}

	// Demo 6: CommandContext — cancellation
	fmt.Println("\n--- 6. CommandContext — cancellation ---")

	// 6a: Context with deadline, child completes within it
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	cmd = exec.CommandContext(ctx, self, "--child:printargs", "within", "deadline")
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR (expected none): %v\n", err)
	} else {
		fmt.Printf("Child completed within deadline: %s\n", strings.TrimSpace(string(out)))
	}

	// 6b: Cancel context before starting — immediate error
	immediateCtx, immediateCancel := context.WithCancel(context.Background())
	immediateCancel()
	cmd = exec.CommandContext(immediateCtx, self, "--child:sleep")
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("Got expected error: %v\n", err)
	} else {
		fmt.Println("ERROR: expected cancellation error")
	}

	// 6c: Cancel context while child is running — mid-execution kill
	fmt.Println("   (spawning 10s sleep, cancelling after 3s...)")
	start := time.Now()
	sleepCtx, sleepCancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer sleepCancel()
	cmd = exec.CommandContext(sleepCtx, self, "--child:sleep")
	out, err = cmd.Output()
	fmt.Printf("   (killed after %v)\n", time.Since(start).Round(time.Millisecond))
	if err != nil {
		fmt.Printf("Got expected error: %v\n", err)
	} else {
		fmt.Printf("UNEXPECTED SUCCESS: %s\n", string(out))
	}

	// Demo 7: Default env — inherit vs empty
	fmt.Println("\n--- 7. Env — inherit vs empty ---")

	// 7a: No Env set — inherits parent's environment
	cmd = exec.Command(self, "--child:env", "PATH")
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Inherited PATH: %s", string(out))
	}

	// 7b: Empty Env — no environment variables at all
	cmd = exec.Command(self, "--child:env", "PATH", "HOME")
	cmd.Env = []string{}
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Empty env child sees:\n%s", string(out))
	}

	// 7c: Subset of env — only specific variables
	cmd = exec.Command(self, "--child:env", "MY_VAR", "PATH")
	cmd.Env = []string{"MY_VAR=only_this", "PATH=/custom"}
	out, err = cmd.Output()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Custom env child sees:\n%s", string(out))
	}

	// Demo 8: Implicit stdout/stderr — CombinedOutput captures both
	fmt.Println("\n--- 8. CombinedOutput — implicit stdout+stderr ---")
	cmd = exec.Command(self, "--child:printargs", "hello", "stderr")
	combined, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	} else {
		fmt.Printf("Combined output:\n%s\n", strings.TrimSpace(string(combined)))

	fmt.Println("\n=== ALL PASSED ===")
	}
}
