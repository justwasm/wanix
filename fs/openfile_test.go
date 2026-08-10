package fs

import (
	"io"
	"os"
	"sync"
	"testing"
)

// truncFS is a minimal FS used to verify that fs.OpenFile with O_TRUNC
// preserves the truncate semantics on its returned File, regardless of
// subsequent perm-handling. It mirrors the property of web/fsa (OPFS):
//
//   - Create returns a FileHandle that *replaces* the file's content on
//     Close (equivalent to OPFS's append=false → writable starts at
//     offset 0 with the file truncated, so writes are byte-for-byte
//     correct regardless of what was there before).
//
//   - Open returns a FileHandle that *overlays* its writes on top of the
//     pre-existing content (equivalent to OPFS's append=true → writable
//     leaves the prior bytes intact past the new writes, so the file
//     ends up as new_content + old_tail_concatenated).
//
// With the asymmetry exposed, fs.OpenFile can be observed directly: if
// the perm-handling in the helper closes-then-reopens the file via
// fsys.Open after O_TRUNC established a Create-handle, the test will
// observe new + old concatenated. With the fix (no close-reopen), the
// returned handle stays the one Create gave back, and Close replaces
// the file with just the new bytes.
type truncFS struct {
	mu      sync.Mutex
	content map[string][]byte
	// fromCreate and fromOpen record the most recent op on each path
	// so test assertions can also verify call ordering, in case a
	// future regression closes-then-reopens but happens to also
	// truncate (which would mask the bug at the file-content level).
	fromCreate map[string]int
	fromOpen   map[string]int
}

func newTruncFS() *truncFS {
	return &truncFS{
		content:    map[string][]byte{},
		fromCreate: map[string]int{},
		fromOpen:   map[string]int{},
	}
}

func (t *truncFS) get(name string) []byte {
	t.mu.Lock()
	defer t.mu.Unlock()
	return append([]byte(nil), t.content[name]...)
}

func (t *truncFS) put(name string, b []byte) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.content[name] = append([]byte(nil), b...)
}

// Open returns a FileHandle whose Close *preserves* whatever bytes the
// underlying store already had, overlaying the writes from the handle
// at the start and leaving any old bytes past the writes. This mimics
// OPFS createWritable({keepExistingData:true}) and FileSystemFileHandle
// semantics from web/fsa's Open() path.
func (t *truncFS) Open(name string) (File, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if _, ok := t.content[name]; !ok {
		return nil, &PathError{Op: "open", Path: name, Err: ErrNotExist}
	}
	t.fromOpen[name]++
	existing := append([]byte(nil), t.content[name]...)
	return &truncFile{fsys: t, name: name, truncateOnClose: false, prefix: existing, open: true}, nil
}

// Create returns a FileHandle whose Close *replaces* the underlying
// store's content with just the bytes written through this handle. This
// mirrors web/fsa Create()'s append=false → truncate semantics.
func (t *truncFS) Create(name string) (File, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.fromCreate[name]++
	return &truncFile{fsys: t, name: name, truncateOnClose: true, open: true}, nil
}

func (t *truncFS) Chmod(name string, mode FileMode) error { return nil }

// truncFile is the File returned by truncFS's Open/Create. On Close the
// truncateOnClose flag decides whether the buffer replaces the
// underlying store (Create path) or is written on top of whatever
// existed at Open time and the suffix is preserved (Open path).
type truncFile struct {
	fsys            *truncFS
	name            string
	truncateOnClose bool
	prefix          []byte // bytes that existed on disk at Open; carried so
	//                      // the Open-path overlay semantic is exact
	buf   []byte
	off   int64
	open  bool
}

func (f *truncFile) Stat() (FileInfo, error) { return nil, nil }

func (f *truncFile) Read(p []byte) (int, error) { return 0, io.EOF }

func (f *truncFile) Write(p []byte) (int, error) {
	if !f.open {
		return 0, ErrClosed
	}
	f.buf = append(f.buf, p...)
	f.off += int64(len(p))
	return len(p), nil
}

func (f *truncFile) Close() error {
	if !f.open {
		return nil
	}
	f.open = false
	if f.truncateOnClose {
		// Replace store content with just what we wrote.
		f.fsys.put(f.name, f.buf)
		return nil
	}
	// Overlay: the bytes `prefix` were on disk before this Open; the
	// bytes `buf` are what we wrote through this handle at the front.
	// The file ends up as buf + (suffix of prefix past len(buf)).
	suffix := f.prefix
	if n := int64(len(f.buf)); n < int64(len(suffix)) {
		suffix = suffix[n:]
	} else {
		suffix = nil
	}
	out := make([]byte, 0, len(f.buf)+len(suffix))
	out = append(out, f.buf...)
	out = append(out, suffix...)
	f.fsys.put(f.name, out)
	return nil
}


// TestOpenFile_TruncateWithPerm preserves the underlying truncate
// semantics of the handle returned when both O_TRUNC and a non-zero
// perm are passed. This is the path w9y mod apply exercises via
// os.OpenFile(dest, O_CREATE|O_TRUNC|O_WRONLY, 0o755): the wasm at
// $WANIX/foo.wasm is opened on an existing file, the helper applies
// O_TRUNC by closing-then-Create'ing, then in the buggy handler
// perm-handling close-reopened the file via fsys.Open which silently
// flipped the handle back to "preserve existing content" mode. Result:
// new writes overlaid on top of the old bytes, leaving an old-content
// tail in the file that defeated WebAssembly.compile on the next task
// launch.
//
// With the fix, the perm block does not close-reopen, so the Create
// handle (truncateOnClose=true) is preserved, and Close replaces the
// file content with exactly the new bytes.
func TestOpenFile_TruncateWithPerm(t *testing.T) {
	const name = "foo.bin"
	oldContent := []byte("OLD-OLD-OLD-OLD-OLD-OLD-OLD-OLD") // 32 bytes
	newContent := []byte("NEW")

	fsys := newTruncFS()
	fsys.put(name, oldContent)

	f, err := OpenFile(fsys, name, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o755)
	if err != nil {
		t.Fatalf("OpenFile: %v", err)
	}
		w, ok := f.(io.Writer)
	if !ok {
		t.Fatalf("File does not implement io.Writer")
	}
	if _, err := w.Write(newContent); err != nil {
		t.Fatalf("Write: %v", err)
	}
	if err := f.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}

	got := string(fsys.get(name))
	if got != string(newContent) {
		t.Fatalf("file content after close = %q (len %d), want %q (len %d); "+
			"the O_TRUNC semantics from Create() were silently undone by "+
			"the perm-handling close-reopen — see the O_TRUNC/perm fix for OpenFile",
			got, len(got), newContent, len(newContent))
	}

	// Belt-and-suspenders: also verify the call ordering was Create
	// path, not Open. If a future change makes the close-reopen path
	// also truncate-on-close (which would mask the file-content check
	// above), this catches it.
	fsys.mu.Lock()
	createCalls := fsys.fromCreate[name]
	openCalls := fsys.fromOpen[name]
	fsys.mu.Unlock()
	// File pre-exists, so Open should be called at least once (the
	// initial existence check); Create should be called once (the
	// O_TRUNC handler). The perm-handling close-reopen would call
	// Open again, which is exactly what we don't want — so we assert
	// it's NOT called a second time.
	if openCalls > 1 {
		t.Fatalf("Open called %d times on %q; perm-handling reopened the "+
			"file after O_TRUNC established Create(), undoing truncate "+
			"semantics (see the O_TRUNC/perm fix for OpenFile)", openCalls, name)
	}
	if createCalls < 1 {
		t.Fatalf("Create never called on %q; O_TRUNC path did not run", name)
	}
}

// TestOpenFile_CreateWithPerm sanity-checks the new-file path: when
// O_TRUNC is given on a path that doesn't exist yet, the handle must
// also come from Create (truncateOnClose=true), not be silently
// downgraded to an Open handle by the perm handler. Both pre-fix and
// post-fix code happen to produce a working file in this case (because
// there's no prior content to leak), but the test guards against the
// same close-reopen pattern slipping back in unnoticed.
func TestOpenFile_CreateWithPerm(t *testing.T) {
	const name = "new.bin"
	newContent := []byte("hello, world")

	fsys := newTruncFS()
	// File does not exist; OpenFile must create it.

	f, err := OpenFile(fsys, name, os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		t.Fatalf("OpenFile: %v", err)
	}
		w, ok := f.(io.Writer)
	if !ok {
		t.Fatalf("File does not implement io.Writer")
	}
	if _, err := w.Write(newContent); err != nil {
		t.Fatalf("Write: %v", err)
	}
	if err := f.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}

	if got := string(fsys.get(name)); got != string(newContent) {
		t.Fatalf("file content = %q, want %q", got, newContent)
	}

	fsys.mu.Lock()
	openCalls := fsys.fromOpen[name]
	fsys.mu.Unlock()
	if openCalls != 0 {
		t.Fatalf("Open called %d times on %q during new-file create path; "+
			"perm-handling reopened after Create (see the O_TRUNC/perm fix for OpenFile)",
			openCalls, name)
	}
}
