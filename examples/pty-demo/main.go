package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"

	"tractor.dev/wanix/pty"
)

func main() {
	fmt.Println("=== Wanix PTY Demo ===")
	fmt.Println("PID:", os.Getpid())

	master, slave, err := pty.Open()
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("master fd: %d, slave fd: %d\n", master.Fd(), slave.Fd())

	// Report initial terminal size.
	ws := master.GetWinSize()
	fmt.Printf("terminal size: %dx%d\n", ws.Cols, ws.Rows)

	// Slave receives SIGWINCH notifications.
	// Register BEFORE SetWinSize so the first notification isn't missed.
	go func() {
		for ws := range slave.AddWinch() {
			fmt.Printf("SIGWINCH: %dx%d\n", ws.Cols, ws.Rows)
		}
	}()

	// Set a new size from the master side (like TIOCSWINSZ).
	master.SetWinSize(pty.WinSize{Rows: 40, Cols: 120})

	// Spawn child with the slave as its stdio.
	cmd := exec.Command("./child.wasm")
	cmd.Stdin = slave
	cmd.Stdout = slave
	cmd.Stderr = slave

	fmt.Println("Spawning child process...")
	if err := cmd.Start(); err != nil {
		fmt.Printf("ERROR starting child: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Child PID: %d\n", cmd.Process.Pid)
	fmt.Println("--- I/O forwarded through PTY ---")

	// Forward stdin → master (child's stdin)
	go func() {
		io.Copy(master, os.Stdin)
	}()

	// Forward master (child's stdout) → stdout
	io.Copy(os.Stdout, master)

	cmd.Wait()
	slave.Close()
	master.Close()
}
