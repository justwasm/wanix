//go:build js && wasm

package fsa

import (
	"io"
	"sync"
	"syscall/js"
	"time"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
	"tractor.dev/wanix/misc/jsutil"
)

var (
	DefaultFileMode = fs.FileMode(0644)
	DefaultDirMode  = fs.FileMode(0755)
	StatCacheExpiry = time.Millisecond * 100
)

type FileHandle struct {
	path   string // Full path for stat cache and error reporting
	append bool
	file   js.Value
	writer js.Value
	offset int64
	closed bool
	mu     sync.Mutex
	fsys   *FS // Reference to the FS instance for stat cache access
	buf    []byte // buffer for uncommitted writes
	js.Value
}

func (h *FileHandle) tryGetFile() (err error) {
	h.file, err = jsutil.AwaitErr(h.Value.Call("getFile"))
	return
}

func (h *FileHandle) tryCreateWritable(keepExisting bool) (err error) {
	if !h.writer.IsUndefined() {
		return nil
	}
	if h.Value.Get("createWritable").IsUndefined() {
		return fs.ErrNotSupported
	}
	h.writer, err = jsutil.AwaitErr(h.Value.Call("createWritable", map[string]any{"keepExistingData": keepExisting}))
	if err != nil {
		return err
	}
	// The OPFS spec does not guarantee that keepExistingData=false
	// truncates the file. Chrome 120+ does; Safari/WebKit and older
	// browsers leave the underlying file at its previous size, so the
	// bytes from offsets [n, oldSize) of the previous owner would
	// remain alongside the newly written bytes. Truncate to 0
	// explicitly after creating the writable so behaviour is
	// deterministic across browsers.
	if !keepExisting {
		if _, terr := jsutil.AwaitErr(h.writer.Call("write", map[string]any{
			"type": "truncate",
			"size": 0,
		})); terr != nil {
			err = terr
		}
	}
	return
}

func (h *FileHandle) Close() error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		return fs.ErrClosed
	}

	h.closed = true

	if !h.writer.IsUndefined() {
		_, err := jsutil.AwaitErr(h.writer.Call("close"))

		// Always clean up, even on close error, to prevent stale state
		// (stale cache entries cause subsequent reads to see truncated data).
		h.fsys.invalidateCachedStat(h.path)
		h.buf = nil
		h.file = js.Undefined()

		if err != nil {
			return err
		}
	}

	return nil
}

func (h *FileHandle) Name() string {
	return h.Value.Get("name").String()
}

// not applied until closed (like other writes)
func (h *FileHandle) Truncate(size int64) error {
	if err := h.tryCreateWritable(true); err != nil {
		return err
	}
	if !h.writer.IsUndefined() {
		jsutil.Await(h.writer.Call("write", map[string]any{
			"type": "truncate",
			"size": size,
		}))

		// Invalidate stat cache since file size changed
		h.fsys.invalidateCachedStat(h.path)

		return nil
	}
	return fs.ErrPermission
}

func (h *FileHandle) Size() int64 {
	if len(h.buf) > 0 {
		return int64(len(h.buf))
	}
	h.tryGetFile()
	return int64(h.file.Get("size").Int())
}

func (h *FileHandle) Stat() (fs.FileInfo, error) {
	// Check cache first when there are no uncommitted writes
	// (active writer means getFile() won't reflect pending data).
	h.mu.Lock()
	hasWriter := !h.writer.IsUndefined()
	h.mu.Unlock()

	if !hasWriter {
		if info, err, found := h.fsys.getCachedStat(h.path); found {
			if err != nil {
				return nil, err
			}
			return info, nil
		}
	}

	// Build fresh stat from JS API + metadata store
	info, err := h.fsys.buildFileInfo(h.path, h.Value)
	if err != nil {
		// Cache the error
		h.fsys.setCachedStatError(h.path, err)
		return nil, err
	}

	// If there's an active writer, the WritableFileStream may have uncommitted
	// data not yet visible to getFile(). Use h.offset as the logical EOF
	// (sequential writes advance offset past the committed size).
	h.mu.Lock()
	if hasWriter && h.offset > info.Size() {
		info = fskit.Entry(
			info.Name(),
			info.Mode(),
			h.offset,
			info.ModTime(),
		)
	}
	h.mu.Unlock()

	// Cache the result
	h.fsys.setCachedStat(h.path, info)
	return info, nil
}

func (h *FileHandle) Write(b []byte) (int, error) {
	if err := h.tryCreateWritable(h.append); err != nil {
		return 0, err
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		return 0, fs.ErrClosed
	}

	if h.writer.IsUndefined() {
		return 0, &fs.PathError{Op: "write", Path: h.path, Err: fs.ErrPermission}
	}

	jsbuf := js.Global().Get("Uint8Array").New(len(b))
	n := js.CopyBytesToJS(jsbuf, b)

	// log.Println("fsa: write:", h.path, h.offset, n)
	_, err := jsutil.AwaitErr(h.writer.Call("write", map[string]any{
		"type":     "write",
		"data":     jsbuf,
		"position": h.offset,
	}))
	if err != nil {
		return 0, err
	}
	h.offset += int64(n)

	// Buffer the data for subsequent reads (getFile() won't reflect
	// uncommitted writes until the WritableFileStream is closed).
	h.buf = append(h.buf, b...)

	Metadata().SetTimes(h.path, time.Now(), time.Now())

	// Invalidate stat cache since file size/mtime changed
	h.fsys.invalidateCachedStat(h.path)

	return n, nil
}

func (h *FileHandle) Read(b []byte) (int, error) {
	if err := h.tryGetFile(); err != nil {
		return 0, err
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		return 0, fs.ErrClosed
	}

	// When there are uncommitted writes in the buffer, serve reads from
	// the buffer (getFile() snapshot doesn't reflect writes until close).
	if len(h.buf) > 0 {
		if h.offset >= int64(len(h.buf)) {
			return 0, io.EOF
		}
		n := copy(b, h.buf[h.offset:])
		h.offset += int64(n)
		return n, nil
	}

	size := h.Size()
	if h.offset >= size {
		return 0, io.EOF
	}
	if h.offset < 0 {
		return 0, &fs.PathError{Op: "read", Path: h.path, Err: fs.ErrInvalid}
	}
	rest := int(size - h.offset)
	if len(b) < rest {
		rest = len(b)
	}
	restblob := h.file.Call("slice", h.offset)
	arrbuf := jsutil.Await(restblob.Call("arrayBuffer"))
	jsbuf := js.Global().Get("Uint8Array").New(arrbuf)
	n := js.CopyBytesToGo(b, jsbuf)
	h.offset += int64(n)
	return n, nil
}

func (h *FileHandle) Seek(offset int64, whence int) (int64, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.closed {
		return 0, fs.ErrClosed
	}

	end := h.Size()
	if h.offset > end {
		end = h.offset
	}
	switch whence {
	case 0:
		// offset += 0
	case 1:
		offset += h.offset
	case 2:
		offset += end
	}
	if offset > end {
		offset = end
	}
	if offset < 0 {
		return 0, &fs.PathError{Op: "seek", Path: h.path, Err: fs.ErrInvalid}
	}
	h.offset = offset
	return offset, nil
}
