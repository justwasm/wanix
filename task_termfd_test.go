package wanix_test

import (
	"context"
	"io"
	"strings"
	"testing"

	"tractor.dev/wanix"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
	"tractor.dev/wanix/term"
)

// TestTermTaskStdoutViaFDBind reproduces the browser wiring for a terminal
// task: the task element allocates a term resource and binds its program
// file at #task/<rid>/fd/{0,1,2} in the task's namespace, then the gojs
// worker's fs.write(1, ...) goes through Task.FD(1) -> VFSOpen ->
// NS().Open("#task/<rid>/fd/1"). This test asserts that a write to fd 1
// actually reaches the term's data stream.
func TestTermTaskStdoutViaFDBind(t *testing.T) {
	d := wanix.NewTaskFS()
	root, err := d.Alloc("auto", nil)
	if err != nil {
		t.Fatal(err)
	}
	termDev := term.New(root)
	if err := root.NS().Bind(termDev, ".", "#term"); err != nil {
		t.Fatal(err)
	}

	// Child task, exactly like the wanix-task element's allocate():
	// "#task/new/<type>" -> TaskFS Alloc with parent=root.
	child, err := root.Alloc("auto")
	if err != nil {
		t.Fatal(err)
	}

	// Allocate a term resource ("#term/new") and read its id.
	f, err := fs.OpenContext(context.Background(), child.NS(), "#term/new")
	if err != nil {
		t.Fatal(err)
	}
	buf := make([]byte, 64)
	n, err := f.Read(buf)
	f.Close()
	if err != nil || n == 0 {
		t.Fatalf("term alloc read: n=%d err=%v", n, err)
	}
	termID := strings.TrimSpace(string(buf[:n]))
	program := "#term/" + termID + "/program"

	// The element binds the program file at the task's std fds:
	//   taskRoot.bind(program, [this.path, "fd/1"].join("/"))
	dst := "#task/" + child.ID() + "/fd/1"
	if err := child.NS().Bind(child.NS(), program, dst); err != nil {
		t.Fatalf("bind %s at %s: %v", program, dst, err)
	}

	// The gojs worker's fs.write(1, ...) resolves via Task.FD(1).
	file, resolved, err := child.FD(1)
	if err != nil {
		t.Fatalf("Task.FD(1): %v (fd/1 did not resolve; stdout will be dropped)", err)
	}
	t.Logf("Task.FD(1) resolved to %s", resolved)

	// Writing to fd 1 must land in the term's data stream.
	if _, err := fs.Write(file, []byte("hello term\n")); err != nil {
		t.Fatalf("write fd 1: %v", err)
	}

	data, err := fs.OpenContext(context.Background(), child.NS(), "#term/"+termID+"/data")
	if err != nil {
		t.Fatal(err)
	}
	defer data.Close()
	got := make([]byte, 64)
	n, err = data.Read(got)
	if err != nil && err != io.EOF {
		t.Fatalf("read term data: %v", err)
	}
	if got := string(got[:n]); !strings.Contains(got, "hello term") {
		t.Fatalf("term data = %q, want hello term", got)
	}
}

// TestTermTaskStdoutWithWorkspaceBinds replicates the full browser setup:
// _setupNamespace binds a fresh ramfs at "." plus the workspace's relative
// binds (task/term/js/...), which clone into the child namespace alongside
// the term-program fd binds. It asserts the fd resolution still reaches the
// term program (guards against the root "." bind shadowing #-prefixed
// binds).
func TestTermTaskStdoutWithWorkspaceBinds(t *testing.T) {
	root, err := wanix.NewRoot()
	if err != nil {
		t.Fatal(err)
	}
	termDev := term.New(root)
	if err := root.NS().Bind(termDev, ".", "#term"); err != nil {
		t.Fatal(err)
	}

	// Mimic _setupNamespace on the ROOT: fresh ramfs at "." + relative
	// ns binds. The root namespace is what children clone.
	rootFS := fskit.MapFS{"bin": fskit.MapFS{"bash": fskit.RawNode([]byte("x"))}}
	if err := root.NS().Bind(rootFS, ".", "."); err != nil {
		t.Fatal(err)
	}

	child, err := root.Alloc("auto")
	if err != nil {
		t.Fatal(err)
	}

	f, err := fs.OpenContext(context.Background(), child.NS(), "#term/new")
	if err != nil {
		t.Fatal(err)
	}
	buf := make([]byte, 64)
	n, err := f.Read(buf)
	f.Close()
	if err != nil || n == 0 {
		t.Fatalf("term alloc read: n=%d err=%v", n, err)
	}
	termID := strings.TrimSpace(string(buf[:n]))
	program := "#term/" + termID + "/program"

	// Element's fd binds, then _setupNamespace's workspace binds.
	dst := "#task/" + child.ID() + "/fd/1"
	if err := child.NS().Bind(child.NS(), program, dst); err != nil {
		t.Fatalf("bind fd: %v", err)
	}
	// Workspace binds (subset): "." ramfs + task/term/js ns projections.
	if err := child.NS().Bind(rootFS, ".", "."); err != nil {
		t.Fatal(err)
	}
	for _, b := range [][2]string{
		{"#task", "task"},
		{"#term", "term"},
	} {
		if err := child.NS().Bind(child.NS(), b[0], b[1]); err != nil {
			t.Fatalf("bind %s at %s: %v", b[0], b[1], err)
		}
	}

	file, resolved, err := child.FD(1)
	if err != nil {
		t.Fatalf("Task.FD(1): %v (fd/1 did not resolve)", err)
	}
	t.Logf("Task.FD(1) resolved to %s", resolved)

	if _, err := fs.Write(file, []byte("hello term\n")); err != nil {
		t.Fatalf("write fd 1: %v", err)
	}

	data, err := fs.OpenContext(context.Background(), child.NS(), "#term/"+termID+"/data")
	if err != nil {
		t.Fatal(err)
	}
	defer data.Close()
	got := make([]byte, 64)
	n, err = data.Read(got)
	if err != nil && err != io.EOF {
		t.Fatalf("read term data: %v", err)
	}
	if got := string(got[:n]); !strings.Contains(got, "hello term") {
		t.Fatalf("term data = %q, want hello term", got)
	}
}
