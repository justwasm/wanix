//go:build js && wasm

package exec

import "os"

// Process stores information about a process started by Start.
type Process struct {
	TaskID  string
	taskPath string
	dataFile *os.File
	exitCode int
	state    *ProcessState
}

// Kill causes the Process to exit immediately.
func (p *Process) Kill() error {
	return p.Signal(os.Kill)
}

// Signal sends a signal to the Process. In the wanix/WASM environment,
// only os.Kill is supported (via the ctl file).
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
	if p.dataFile != nil {
		return p.dataFile.Close()
	}
	return nil
}

// Wait waits for the Process to exit and returns a ProcessState describing
// its status and an error, if any.
func (p *Process) Wait() (*ProcessState, error) {
	code, err := waitExit(nil, p.taskPath+"/exit")
	if err != nil {
		return nil, err
	}
	p.exitCode = code
	p.state = &ProcessState{taskID: p.TaskID, exitCode: code}
	if p.dataFile != nil {
		p.dataFile.Close()
	}
	return p.state, nil
}
