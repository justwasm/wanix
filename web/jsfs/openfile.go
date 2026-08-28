//go:build js && wasm

package jsfs

import (
	"context"
	"io"
	"os"
	"strings"
	"syscall"
	"syscall/js"

	"tractor.dev/wanix/fs"
)

var (
	_ fs.RouteFS    = (*FS)(nil)
	_ fs.OpenFileFS = (*FS)(nil)
	_ fs.CreateFS   = (*FS)(nil)
)

// Route maps any valid path onto this rooted FS (wasm NS create/open path).
func (f *FS) Route(ctx context.Context, name string) (fs.FS, string, error) {
	if name == "." {
		return f, ".", nil
	}
	if !fs.ValidPath(name) {
		return nil, "", &fs.PathError{Op: "route", Path: name, Err: fs.ErrInvalid}
	}
	return f, name, nil
}

// Create truncates or creates a writable leaf (string-valued) at name.
func (f *FS) Create(name string) (fs.File, error) {
	return f.OpenFile(name, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0o644)
}

// OpenFile supports read; write/trunc/create via JS Reflect.set assignments.
func (f *FS) OpenFile(name string, flag int, perm fs.FileMode) (fs.File, error) {
	if flag&(os.O_WRONLY|os.O_RDWR) == 0 {
		return f.Open(name)
	}

	if strings.Contains(name, ":") {
		// Synthetic suffix views (:json/:type/:obj/:ref) select a view of an
		// EXISTING node, exactly like Open does; they are never create
		// targets. Route them through Open so `exec 3<>/js/.../fn:json`
		// (write-open of a function file) returns the funcFile and writing to
		// it invokes the JS function. O_TRUNC has no meaning on a suffix view.
		if flag&os.O_CREATE != 0 && flag&os.O_EXCL != 0 {
			return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrExist}
		}
		return f.Open(name)
	}
	if name == "." || !fs.ValidPath(name) {
		return nil, &fs.PathError{Op: "open", Path: name, Err: syscall.EISDIR}
	}

	parts, err := splitPathParts(name)
	if err != nil {
		return nil, err
	}
	if len(parts) == 0 {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
	}

	parent, key, err := walkToParent(f.root, parts)
	if err != nil {
		return nil, &fs.PathError{Op: "open", Path: name, Err: err}
	}

	existed := reflectHas(parent, key)

	if existed {
		if flag&os.O_CREATE != 0 && flag&os.O_EXCL != 0 {
			return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrExist}
		}
		cur := parent.Get(key)
		if isCallable(cur) {
			// Writable open uses OpenFile; functions are funcFile (invoke-on-write), not Reflect.set targets.
			// This early return MUST stay before the O_APPEND block below:
			// funcFile.Seek returns ErrInvalid, so routing callables through the
			// append seek would break `>>` invocation on function files.
			if flag&os.O_TRUNC != 0 {
				return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
			}
			fl, err := f.Open(name)
			if err != nil {
				return nil, err
			}
			_ = perm
			return fl, nil
		}
		if truncateWriteBlocks(cur) {
			return nil, &fs.PathError{Op: "open", Path: name, Err: syscall.EISDIR}
		}
		if flag&os.O_TRUNC != 0 {
			if err := reflectSet(parent, key, js.ValueOf("")); err != nil {
				return nil, &fs.PathError{Op: "open", Path: name, Err: err}
			}
		}
	} else {
		if flag&os.O_CREATE == 0 {
			return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrNotExist}
		}
		if err := reflectSet(parent, key, js.ValueOf("")); err != nil {
			return nil, &fs.PathError{Op: "open", Path: name, Err: err}
		}
	}

	fl, err := f.Open(name)
	if err != nil {
		return nil, err
	}

	if flag&os.O_APPEND != 0 {
		if pf, ok := fl.(*primitiveFile); ok {
			// primitiveFile has no byte offset semantics; append is recorded on
			// the handle and merged in Close (string values only).
			t, ok := safeType(pf.live())
			if !ok || t != js.TypeString {
				_ = fl.Close()
				return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
			}
			pf.appendMode = true
		} else if sk, ok := fl.(io.Seeker); ok {
			if _, err := sk.Seek(0, io.SeekEnd); err != nil {
				_ = fl.Close()
				return nil, err
			}
		}
	}

	_ = perm // chmod not modeled on JS reflection
	return fl, nil
}
