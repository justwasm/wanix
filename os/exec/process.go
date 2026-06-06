//go:build js && wasm

package exec

import (
	"context"
	"io"
	"os"
	"time"
)

// Process stores information about a process started by Start.
type Process struct {
	TaskID   string
	taskPath string
	termPath string
	exitCode int
	state    *ProcessState
}

// Kill causes the Process to exit immediately.
func (p *Process) Kill() error {
	return p.Signal(os.Kill)
}

// Signal sends a signal to the Process.
func (p *Process) Signal(sig os.Signal) error {
	switch sig {
	case os.Kill:
		return appendFile(p.taskPath+"/ctl", "kill")
	default:
		return nil
	}
}

// Release releases any resources associated with the Process.
func (p *Process) Release() error {
	return nil
}

// Wait waits for the Process to exit and returns a ProcessState describing
// its status and an error, if any.
func (p *Process) Wait() (*ProcessState, error) {
	code, err := waitExit(context.Background(), p.taskPath+"/exit")
	if err != nil {
		return nil, err
	}
	p.exitCode = code
	p.state = &ProcessState{taskID: p.TaskID, exitCode: code}
	return p.state, nil
}

// captureOutput reads the child's buffered output from the term's data pipe
// and writes it to w. The pipe never closes (PortFile.Close is a no-op), so
// we read with a short timeout — one attempt is enough since the child has
// already exited and flushed all output by the time this is called.
func (p *Process) captureOutput(w io.Writer) error {
	f, err := os.Open(p.termPath + "/data")
	if err != nil {
		return err
	}
	defer f.Close()

	buf := make([]byte, 4096)
	done := make(chan struct{ n int; err error }, 1)
	go func() {
		n, err := f.Read(buf)
		done <- struct{ n int; err error }{n, err}
	}()
	select {
	case res := <-done:
		if res.n > 0 {
			w.Write(buf[:res.n])
		}
	case <-time.After(200 * time.Millisecond):
	}
	return nil
}
