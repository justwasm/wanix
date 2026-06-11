package api

import (
	"fmt"

	"tractor.dev/toolkit-go/duplex/rpc"
	"tractor.dev/wanix/pty"
)

func (s *syscaller) getWinSize(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	fd := toInt(args[0])
	file, _, err := s.task.FD(fd)
	if err != nil {
		r.Return(fmt.Errorf("bad fd: %w", err))
		return
	}
	type winSizer interface {
		GetWinSize() pty.WinSize
	}
	ws, ok := file.(winSizer)
	if !ok {
		r.Return(fmt.Errorf("fd %d is not a terminal", fd))
		return
	}
	size := ws.GetWinSize()
	r.Return(map[string]any{
		"rows": size.Rows,
		"cols": size.Cols,
		"xpx":  size.Xpx,
		"ypx":  size.Ypx,
	})
}

func (s *syscaller) setWinSize(r rpc.Responder, c *rpc.Call) {
	var args []any
	c.Receive(&args)

	fd := toInt(args[0])
	wsMap := toStringMap(args[1])

	file, _, err := s.task.FD(fd)
	if err != nil {
		r.Return(fmt.Errorf("bad fd: %w", err))
		return
	}
	t, ok := file.(pty.Master)
	if !ok {
		r.Return(fmt.Errorf("fd %d is not a master terminal", fd))
		return
	}
	ws := pty.WinSize{
		Rows: toUint16(wsMap["rows"]),
		Cols: toUint16(wsMap["cols"]),
		Xpx:  toUint16(wsMap["xpx"]),
		Ypx:  toUint16(wsMap["ypx"]),
	}
	if err := t.SetWinSize(ws); err != nil {
		r.Return(err)
		return
	}

	r.Return(nil)
}

func toInt(v any) int {
	switch n := v.(type) {
	case int:
		return n
	case int64:
		return int(n)
	case uint64:
		return int(n)
	case float64:
		return int(n)
	default:
		return 0
	}
}

func toUint16(v any) uint16 {
	return uint16(toInt(v))
}
