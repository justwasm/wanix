//go:build js && wasm

package exec

import "fmt"

// ProcessState stores information about a process, as reported by Wait.
type ProcessState struct {
	taskID   string
	exitCode int
}

// ExitCode returns the exit code of the process.
func (p *ProcessState) ExitCode() int {
	return p.exitCode
}

// Success returns true if the process exited with code 0.
func (p *ProcessState) Success() bool {
	return p.exitCode == 0
}

// String returns a string representation of the process state.
func (p *ProcessState) String() string {
	return fmt.Sprintf("exit code %d", p.exitCode)
}

// Sys is not supported in the wanix/WASM environment.
func (p *ProcessState) Sys() any {
	return nil
}

// SysUsage is not supported.
func (p *ProcessState) SysUsage() any {
	return nil
}

// ---

// ExitError reports an unsuccessful exit by a command.
type ExitError struct {
	*ProcessState
	Stderr []byte
}

func (e *ExitError) Error() string {
	return fmt.Sprintf("exit status %d", e.exitCode)
}
