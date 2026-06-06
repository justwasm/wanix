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
	Path string
	Args []string
	Env  []string
	Dir  string

	Stdin  io.Reader
	Stdout io.Writer
	Stderr io.Writer

	// InheritTTY makes the child share the parent's terminal for stdin/stdout/stderr.
	// When true, the child's I/O is connected to the parent's term (self/term)
	// instead of an isolated pipe. This is needed for interactive programs.
	InheritTTY bool

	Process      *Process
	ProcessState *ProcessState

	ctx      context.Context
	cancel   context.CancelFunc
	taskID   string
	taskPath string
	started  bool
}

func Command(name string, arg ...string) *Cmd {
	return &Cmd{
		Path: name,
		Args: append([]string{name}, arg...),
	}
}

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

func (c *Cmd) Environ() []string {
	return c.environ()
}

func (c *Cmd) Run() error {
	if err := c.Start(); err != nil {
		return err
	}
	return c.Wait()
}

func (c *Cmd) Start() error {
	if c.started {
		return fmt.Errorf("exec: already started")
	}
	c.started = true

	if c.ctx == nil {
		c.ctx = context.Background()
	}
	c.ctx, c.cancel = context.WithCancel(c.ctx)

	taskID := readStr(c.ctx, "#task/new/gojs")
	if taskID == "" {
		return fmt.Errorf("exec: failed to allocate task")
	}
	c.taskID = taskID
	c.taskPath = filepath.Join("#task", taskID)

	cmdStr := strings.Join(c.Args, " ")
	if err := appendFile(c.taskPath+"/cmd", cmdStr); err != nil {
		return fmt.Errorf("exec: set cmd: %w", err)
	}
	if len(c.Env) > 0 {
		if err := appendFile(c.taskPath+"/env", strings.Join(c.Env, "\n")); err != nil {
			return fmt.Errorf("exec: set env: %w", err)
		}
	}
	if c.Dir != "" {
		if err := appendFile(c.taskPath+"/dir", c.Dir); err != nil {
			return fmt.Errorf("exec: set dir: %w", err)
		}
	}

	// Allocate a dedicated term for child I/O.
	termID := readStr(c.ctx, "#term/new")
	if termID == "" {
		return fmt.Errorf("exec: failed to allocate term")
	}
	termPath := filepath.Join("#term", termID)

	for _, fd := range []string{"0", "1", "2"} {
		if err := appendFile(c.taskPath+"/ctl",
			fmt.Sprintf("bind %s/program %s/fd/%s", termPath, c.taskPath, fd)); err != nil {
			return fmt.Errorf("exec: bind fd/%s: %w", fd, err)
		}
	}
	// Map /dev/std{in,out,err} → fd/{0,1,2} so Go's init (which opens
	// these paths on startup) can resolve them in the task's namespace.
	for name, n := range map[string]string{"stdin": "0", "stdout": "1", "stderr": "2"} {
		if err := appendFile(c.taskPath+"/ctl",
			fmt.Sprintf("bind %s/fd/%s dev/%s", c.taskPath, n, name)); err != nil {
			return fmt.Errorf("exec: bind dev/%s: %w", name, err)
		}
	}

	c.Process = &Process{
		TaskID:   taskID,
		taskPath: c.taskPath,
		termPath: termPath,
	}

	if err := appendFile(c.taskPath+"/ctl", "start"); err != nil {
		return fmt.Errorf("exec: start: %w", err)
	}

	// When InheritTTY is set, pipe data between the caller's terminal
	// and the child's dedicated term via goroutines.
	if c.InheritTTY {
		c.startPipes(termPath)
	}

	return nil
}

func (c *Cmd) startPipes(termPath string) {
	if os.Stdout != nil {
		go func() {
			f, err := os.Open(termPath + "/data")
			if err != nil {
				return
			}
			defer f.Close()
			buf := make([]byte, 4096)
			for {
				if isCtxDone(c.ctx) {
					return
				}
				n, err := readWithTimeout(f, buf, 200*time.Millisecond)
				if n > 0 {
					os.Stdout.Write(buf[:n])
				}
				if err != nil || n == 0 {
					return
				}
			}
		}()
	}

	if os.Stdin != nil {
		go func() {
			f, err := os.OpenFile(termPath+"/data", os.O_WRONLY, 0)
			if err != nil {
				return
			}
			defer f.Close()
			buf := make([]byte, 4096)
			for {
				if isCtxDone(c.ctx) {
					return
				}
				n, err := os.Stdin.Read(buf)
				if n > 0 {
					f.Write(buf[:n])
				}
				if err != nil {
					return
				}
			}
		}()
	}
}

func readWithTimeout(f *os.File, buf []byte, timeout time.Duration) (int, error) {
	type result struct {
		n   int
		err error
	}
	ch := make(chan result, 1)
	go func() {
		n, err := f.Read(buf)
		ch <- result{n, err}
	}()
	select {
	case r := <-ch:
		return r.n, r.err
	case <-time.After(timeout):
		return 0, nil
	}
}

func isCtxDone(ctx context.Context) bool {
	select {
	case <-ctx.Done():
		return true
	default:
		return false
	}
}

func (c *Cmd) Wait() error {
	if !c.started {
		return fmt.Errorf("exec: not started")
	}

	ctx, cancel := context.WithTimeout(c.ctx, 10*time.Second)
	defer cancel()
	code, err := waitExit(ctx, filepath.Join(c.taskPath, "exit"))
	if err != nil {
		return fmt.Errorf("exec: wait: %w", err)
	}

	// If Stdout was set (e.g. by Output()), read captured output from the
	// term's data pipe. The pipe never closes (PortFile.Close is a no-op),
	// so we read once with a short timeout. One iteration is sufficient
	// because the child has already exited and flushed all output.
	if c.Stdout != nil && c.Process != nil {
		c.Process.captureOutput(c.Stdout)
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

func (c *Cmd) Output() ([]byte, error) {
	var buf bytes.Buffer
	c.Stdout = &buf
	err := c.Run()
	return buf.Bytes(), err
}

func (c *Cmd) CombinedOutput() ([]byte, error) {
	var buf bytes.Buffer
	c.Stdout = &buf
	c.Stderr = &buf
	err := c.Run()
	return buf.Bytes(), err
}

func (c *Cmd) StdinPipe() (io.WriteCloser, error) {
	return nil, fmt.Errorf("exec: StdinPipe not implemented")
}
func (c *Cmd) StdoutPipe() (io.Reader, error) {
	return nil, fmt.Errorf("exec: StdoutPipe not implemented")
}
func (c *Cmd) StderrPipe() (io.Reader, error) {
	return nil, fmt.Errorf("exec: StderrPipe not implemented")
}
func (c *Cmd) String() string {
	return strings.Join(c.Args, " ")
}

// --- helpers ---

func readStr(ctx context.Context, path string) string {
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
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
	return ""
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
