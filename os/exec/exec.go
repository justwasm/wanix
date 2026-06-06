//go:build js && wasm

// Package exec provides an os/exec-compatible interface for spawning
// Go WASM processes in the wanix environment. It uses the VFS task
// mechanism (#task/new/gojs) under the hood instead of the standard
// syscall.StartProcess, which is stubbed out in GOOS=js.
package exec

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Cmd represents an external command being prepared or run.
type Cmd struct {
	// Path is the path of the command to run (the WASM binary in the namespace).
	Path string

	// Args holds command-line arguments, including the command as Args[0].
	Args []string

	// Env specifies the environment of the process. Each entry is "key=value".
	// If nil, the current process's environment is inherited.
	Env []string

	// Dir specifies the working directory of the command. If empty, inherits
	// the current directory.
	Dir string

	// Stdin specifies the process's standard input. If nil, stdin is
	// connected to the terminal (if available).
	Stdin io.Reader

	// Stdout specifies the process's standard output. If nil, stdout is
	// connected to the terminal.
	Stdout io.Writer

	// Stderr specifies the process's standard error. If nil, stderr is
	// connected to the terminal (same as Stdout).
	Stderr io.Writer

	// Process is the underlying process, once started.
	Process *Process

	// ProcessState contains information about the process after Wait.
	ProcessState *ProcessState

	// internal state
	ctx       context.Context
	cancel    context.CancelFunc
	taskID    string
	taskPath  string
	termID    string
	termPath  string
	started   bool
	errc      chan error // used internally for Wait synchronization
}

// Command returns the Cmd struct to execute the named program with the given arguments.
func Command(name string, arg ...string) *Cmd {
	return &Cmd{
		Path: name,
		Args: append([]string{name}, arg...),
	}
}

// CommandContext is like Command but includes a context for cancellation.
func CommandContext(ctx context.Context, name string, arg ...string) *Cmd {
	cmd := Command(name, arg...)
	cmd.ctx = ctx
	return cmd
}

func (c *Cmd) environ() []string {
	if len(c.Env) > 0 {
		return c.Env
	}
	return os.Environ()
}

// Run starts the command and waits for it to complete.
func (c *Cmd) Run() error {
	if err := c.Start(); err != nil {
		return err
	}
	return c.Wait()
}

// Start starts the specified command but does not wait for it to complete.
func (c *Cmd) Start() error {
	if c.started {
		return fmt.Errorf("exec: already started")
	}
	c.started = true

	// Create context for cancellation
	if c.ctx == nil {
		c.ctx = context.Background()
	}
	c.ctx, c.cancel = context.WithCancel(c.ctx)

	// 1. Allocate a new gojs task
	taskID := readStr(c.ctx, "#task/new/gojs")
	if taskID == "" {
		return fmt.Errorf("exec: failed to allocate task")
	}
	c.taskID = taskID
	c.taskPath = filepath.Join("#task", taskID)

	// 2. Set command
	cmdStr := strings.Join(c.Args, " ")
	if err := appendFile(c.taskPath+"/cmd", cmdStr); err != nil {
		return fmt.Errorf("exec: set cmd: %w", err)
	}

	// 3. Set environment
	if len(c.Env) > 0 {
		if err := appendFile(c.taskPath+"/env", strings.Join(c.Env, "\n")); err != nil {
			return fmt.Errorf("exec: set env: %w", err)
		}
	}

	// 4. Set working directory
	if c.Dir != "" {
		if err := appendFile(c.taskPath+"/dir", c.Dir); err != nil {
			return fmt.Errorf("exec: set dir: %w", err)
		}
	}

	// 5. Allocate a terminal for I/O
	termID := readStr(c.ctx, "#term/new")
	if termID == "" {
		return fmt.Errorf("exec: failed to allocate term")
	}
	c.termID = termID
	c.termPath = filepath.Join("#term", termID)
	termProg := c.termPath + "/program"

	// 6. Bind fds to term
	for _, fd := range []string{"0", "1", "2"} {
		if err := appendFile(c.taskPath+"/ctl",
			fmt.Sprintf("bind %s %s/fd/%s", termProg, c.taskPath, fd)); err != nil {
			return fmt.Errorf("exec: bind fd/%s: %w", fd, err)
		}
	}

	// 7. Open term data for I/O
	dataPath := c.termPath + "/data"
	dataFile, err := os.OpenFile(dataPath, os.O_RDWR, 0)
	if err != nil {
		return fmt.Errorf("exec: open term data: %w", err)
	}

	c.Process = &Process{
		TaskID:   taskID,
		taskPath: c.taskPath,
		dataFile: dataFile,
	}

	// 8. Start the child
	if err := appendFile(c.taskPath+"/ctl", "start"); err != nil {
		dataFile.Close()
		return fmt.Errorf("exec: start: %w", err)
	}

	// 9. Wire up I/O
	c.errc = make(chan error, 1)

	// Copy child stdout → c.Stdout
	stdoutW := c.Stdout
	if stdoutW == nil {
		stdoutW = os.Stdout
	}
	go func() {
		_, err := io.Copy(stdoutW, dataFile)
		c.errc <- err
	}()

	// Copy c.Stdin → child stdin
	if c.Stdin != nil {
		go func() {
			_, _ = io.Copy(dataFile, c.Stdin)
		}()
	}

	return nil
}

// Wait waits for the command to exit and waits for any copying to stdin or
// copying from stdout or stderr to complete.
func (c *Cmd) Wait() error {
	if !c.started {
		return fmt.Errorf("exec: not started")
	}

	// Wait for exit code
	exitPath := filepath.Join(c.taskPath, "exit")
	code, err := waitExit(c.ctx, exitPath)
	if err != nil {
		return fmt.Errorf("exec: wait: %w", err)
	}

	// Close the data file to signal the io.Copy goroutine to stop
	if c.Process != nil && c.Process.dataFile != nil {
		c.Process.dataFile.Close()
	}

	// Wait for the copy goroutine to finish (with timeout)
	select {
	case <-c.errc:
	case <-time.After(2 * time.Second):
	}

	c.Process.exitCode = code
	c.Process.state = &ProcessState{taskID: c.taskID, exitCode: code}
	c.ProcessState = c.Process.state
	c.cancel()

	if code != 0 {
		return &ExitError{ProcessState: c.Process.state}
	}
	return nil
}

// Output runs the command and returns its standard output.
func (c *Cmd) Output() ([]byte, error) {
	var buf bytes.Buffer
	c.Stdout = &buf
	err := c.Run()
	return buf.Bytes(), err
}

// CombinedOutput runs the command and returns its combined standard
// output and standard error.
func (c *Cmd) CombinedOutput() ([]byte, error) {
	var buf bytes.Buffer
	c.Stdout = &buf
	c.Stderr = &buf
	err := c.Run()
	return buf.Bytes(), err
}

// StdinPipe is not yet implemented.
func (c *Cmd) StdinPipe() (io.WriteCloser, error) {
	return nil, fmt.Errorf("exec: StdinPipe not implemented")
}

// StdoutPipe is not yet implemented.
func (c *Cmd) StdoutPipe() (io.Reader, error) {
	return nil, fmt.Errorf("exec: StdoutPipe not implemented")
}

// StderrPipe is not yet implemented.
func (c *Cmd) StderrPipe() (io.Reader, error) {
	return nil, fmt.Errorf("exec: StderrPipe not implemented")
}

// String returns a human-readable description of the command.
func (c *Cmd) String() string {
	return strings.Join(c.Args, " ")
}

// --- helpers ---

func readStr(ctx context.Context, path string) string {
	for {
		select {
		case <-ctx.Done():
			return ""
		default:
		}
		out, err := os.ReadFile(path)
		if err == nil {
			return strings.TrimSpace(string(out))
		}
		time.Sleep(20 * time.Millisecond)
	}
}

func appendFile(path, data string) error {
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	_, err = f.Write([]byte(data))
	f.Close()
	return err
}

func waitExit(ctx context.Context, path string) (int, error) {
	for {
		select {
		case <-ctx.Done():
			return 1, ctx.Err()
		default:
		}
		out, err := os.ReadFile(path)
		if err != nil {
			return 1, err
		}
		s := strings.TrimSpace(string(out))
		if s == "" {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		return strconv.Atoi(s)
	}
}
