package api

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
)

func (s *syscaller) spawn(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	name, _ := args[0].(string)
	argv, _ := args[1].([]any)
	opts := toStringMap(args[2])

	// Build command string from name + argv, clean path
	cmd := name
	if argv != nil {
		parts := make([]string, 0, len(argv)+1)
		parts = append(parts, name)
		for _, a := range argv {
			parts = append(parts, toString(a))
		}
		cmd = strings.Join(parts, " ")
	}

	// Clean leading ./ or / from the command path for VFS compatibility
	cmdParts := strings.Fields(cmd)
	if len(cmdParts) > 0 {
		cleanPath := strings.TrimLeft(cmdParts[0], "./")
		cmdParts[0] = cleanPath
		cmd = strings.Join(cmdParts, " ")
	}

	parent := s.task
	if parent == nil {
		r.Return(fmt.Errorf("no parent task"))
		return
	}

	// Allocate child task
	child, err := parent.Alloc("gojs")
	if err != nil {
		r.Return(err)
		return
	}
	taskPath := filepath.Join("#task", child.ID())

	// Write cmd via parent namespace
	writeTaskFile := func(path, data string) error {
		// Use parent.NS() directly (not parent.Open) because Task.Open
		// routes through Task.ResolveFS which only handles control files,
		// not #task/{id}/... paths. The namespace has #task bound to TaskFS.
		f, err := fs.OpenContext(context.Background(), parent.NS(), path)
		if err != nil {
			return err
		}
		defer f.Close()
		if w, ok := f.(io.Writer); ok {
			_, err = w.Write([]byte(data))
			return err
		}
		_, err = fs.Write(f, []byte(data))
		return err
	}

	if err := writeTaskFile(filepath.Join(taskPath, "cmd"), cmd); err != nil {
		r.Return(err)
		return
	}

	// Set cwd
	if opts != nil {
		if d, ok := opts["cwd"].(string); ok && d != "" {
			writeTaskFile(filepath.Join(taskPath, "dir"), d)
		}
	}

	// Set env
	if opts != nil {
		if envRaw, ok := opts["env"]; ok {
			envMap := toStringMap(envRaw)
			var envLines []string
			for k, v := range envMap {
				envLines = append(envLines, k+"="+toString(v))
			}
			if len(envLines) > 0 {
				writeTaskFile(filepath.Join(taskPath, "env"), strings.Join(envLines, "\n"))
			}
		}
	}

	// Handle stdio fd binding
	//
	// When Go's exec package calls StartProcess, attr.Files contains fd numbers
	// from the parent process (created by os.Pipe(), os.Stdin, etc.).
	// Pipes created via os.Pipe() are registered in the parent task's FD table
	// (by our Pipe RPC handler), so we can look them up via parent.FD().
	// Standard fds (0=stdin, 1=stdout, 2=stderr) are managed by Go's internal
	// syscall.files map and are NOT in the task FD table — skip those.
	//
	// We register the inherited files at the correct child fd indices using
	// SetFD(i, ...) so the child Worker's RPC write/read handlers find them.
	var trackedPipes []*chanPipe
	if opts != nil {
		if stdio, ok := opts["stdio"].([]any); ok {
			for i := 0; i < 3; i++ {
				var file fs.File
				var fp string
				registered := false

				if i < len(stdio) {
					switch v := stdio[i].(type) {
					case uint64:
						fd := int(v)
						if f, fpath, err := parent.FD(fd); err == nil && f != nil {
							fp = fpath
							// The child gets a writer reference so the pipe stays
							// open until the child exits and its writes arrive.
							if pw, ok := f.(*pipeWriteFile); ok {
								pw.pipe.addWriter()
								trackedPipes = append(trackedPipes, pw.pipe)
							}
							file = f
							registered = true
						}
					case int:
						fd := v
						if f, fpath, err := parent.FD(fd); err == nil && f != nil {
							fp = fpath
							if pw, ok := f.(*pipeWriteFile); ok {
								pw.pipe.addWriter()
								trackedPipes = append(trackedPipes, pw.pipe)
							}
							file = f
							registered = true
						}
					case string:
						switch v {
						case "inherit":
							if f, fpath, err := parent.FD(i); err == nil && f != nil {
								file = f
								fp = fpath
								registered = true
							}
						case "pipe":
							// Allocate term for child I/O
							termID := allocTerm(parent)
							if termID != "" {
								termPath := filepath.Join("#term", termID)
								fdNum := strconv.Itoa(i)
								ctlPath := filepath.Join(taskPath, "ctl")
								writeTaskFile(ctlPath, "bind "+termPath+"/program "+taskPath+"/fd/"+fdNum+"\n")
								devNames := map[int]string{0: "stdin", 1: "stdout", 2: "stderr"}
								if dn := devNames[i]; dn != "" {
									writeTaskFile(ctlPath, "bind "+taskPath+"/fd/"+fdNum+" dev/"+dn+"\n")
								}
								// The term binding will handle I/O, skip direct fd registration
								continue
							}
						}
					}
				}

				if !registered {
					// Create a discard/null fd for unregistered stdio
					file = &nullFile{name: "null:" + strconv.Itoa(i)}
					fp = "/dev/null"
				}

				child.SetFD(i, file, fp)
			}
		}
	}

	// Start the task
	if err := writeTaskFile(filepath.Join(taskPath, "ctl"), "start"); err != nil {
		r.Return(err)
		return
	}

	// Monitor child exit to close pipe write references (avoids relying
	// on RPC from the child Worker, which can fail due to mux channel errors).
	go monitorChildExit(parent, child, trackedPipes)

	// Parse child ID as integer for Go's pid
	pid, _ := strconv.Atoi(child.ID())

	r.Return(map[string]any{
		"pid": pid,
	})
}

func allocTerm(parent *wanix.Task) string {
	f, err := fs.OpenContext(context.Background(), parent.NS(), "#term/new")
	if err != nil {
		return ""
	}
	defer f.Close()
	buf := make([]byte, 64)
	n, err := f.Read(buf)
	if err != nil || n == 0 {
		return ""
	}
	return strings.TrimSpace(string(buf[:n]))
}

// nullFile is a /dev/null equivalent — writes discard, reads return EOF.
type nullFile struct {
	name string
	fs.File
}

func (f *nullFile) Read(b []byte) (int, error)  { return 0, io.EOF }
func (f *nullFile) Write(b []byte) (int, error) { return len(b), nil }
func (f *nullFile) Close() error                { return nil }
func (f *nullFile) Stat() (fs.FileInfo, error) {
	return fskit.Entry(f.name, 0644, 0), nil
}

func monitorChildExit(parent, child *wanix.Task, trackedPipes []*chanPipe) {
	exitPath := filepath.Join("#task", child.ID(), "exit")
	for {
		f, err := fs.OpenContext(context.Background(), parent.NS(), exitPath)
		if err != nil {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		buf := make([]byte, 16)
		n, _ := f.Read(buf)
		f.Close()
		if strings.TrimSpace(string(buf[:n])) != "" {
			for _, cp := range trackedPipes {
				cp.removeWriter()
			}
			return
		}
		time.Sleep(50 * time.Millisecond)
	}
}

func toStringMap(v any) map[string]any {
	switch m := v.(type) {
	case map[string]any:
		return m
	case map[interface{}]any:
		res := make(map[string]any, len(m))
		for k, val := range m {
			res[fmt.Sprint(k)] = val
		}
		return res
	case []any:
		// Array of "KEY=VALUE" strings from Go's attr.Env
		res := make(map[string]any, len(m))
		for _, item := range m {
			s := toString(item)
			if idx := strings.Index(s, "="); idx >= 0 {
				res[s[:idx]] = s[idx+1:]
			}
		}
		return res
	default:
		return nil
	}
}

func toString(v any) string {
	switch s := v.(type) {
	case string:
		return s
	case []byte:
		return string(s)
	case int:
		return strconv.Itoa(s)
	case int64:
		return strconv.FormatInt(s, 10)
	case uint64:
		return strconv.FormatUint(s, 10)
	case float64:
		return strconv.FormatFloat(s, 'f', -1, 64)
	default:
		return ""
	}
}
