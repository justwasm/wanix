package api

import (
	"context"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/fs"
)

func (s *syscaller) wait(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	pidVal := args[0]
	var pidStr string
	switch v := pidVal.(type) {
	case uint64:
		pidStr = strconv.FormatUint(v, 10)
	case string:
		pidStr = v
	default:
		r.Return(io.ErrNoProgress)
		return
	}

	taskPath := filepath.Join("#task", pidStr)
	exitPath := filepath.Join(taskPath, "exit")

	// Poll the exit file with timeout
	deadline := time.Now().Add(30 * time.Second)
	var exitCode int64
	found := false
	for time.Now().Before(deadline) {
		f, err := fs.OpenContext(context.Background(), s.task.NS(), exitPath)
		if err != nil {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		buf := make([]byte, 32)
		n, err := f.Read(buf)
		f.Close()
		if err != nil || n == 0 {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		codeStr := strings.TrimSpace(string(buf[:n]))
		if codeStr == "" {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		exitCode, _ = strconv.ParseInt(codeStr, 10, 64)
		found = true
		break
	}

	if !found {
		r.Return(io.ErrNoProgress)
		return
	}

	r.Return(map[string]any{
		"pid":      pidStr,
		"exitCode": exitCode,
	})
}
