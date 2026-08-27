package wanix

import (
	"io"
	"path"
	"strings"
	"testing"

	"tractor.dev/wanix/fs/fskit"
)

// workerCleanpath mirrors gojs/worker/worker.js cleanpath: relative paths are
// resolved against the interpreter task's cwd, absolute paths are kept. The
// interpreter (bash/hush) opens the script argument through this function.
func workerCleanpath(p, cwd string) string {
	if strings.HasPrefix(p, "./") {
		p = p[2:]
	}
	if p == "/" || p == "" {
		return "."
	}
	if !strings.HasPrefix(p, "/") {
		p = cwd + "/" + p
	}
	var stack []string
	for _, part := range strings.Split(p, "/") {
		if part == "" || part == "." {
			continue
		}
		if part == ".." {
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
			continue
		}
		stack = append(stack, part)
	}
	if len(stack) == 0 {
		return "."
	}
	return strings.Join(stack, "/")
}

// TestShebangInterpreterOpenChain simulates the full chain:
//  1. shell spawns "./gm" -> api/spawn.go strips leading "/" -> cmd "opfs/home/gm"
//  2. resolveShebang rewrites args to [interpreter, scriptPath]
//  3. the interpreter task opens the script argument, resolved by the
//     worker's cleanpath (cwd-joined for relative paths) against ITS cwd
//
// Before the fix, step 2 passed the kernel-relative "opfs/home/gm" through,
// so step 3 looked up /opfs/home/opfs/home/gm and failed with ENOENT.
func TestShebangInterpreterOpenChain(t *testing.T) {
	d := NewTaskFS()
	task, err := d.Alloc("auto", nil)
	if err != nil {
		t.Fatal(err)
	}
	m := fskit.MapFS{
		"bin": fskit.MapFS{
			"bash": fskit.RawNode([]byte("wasm-bash")),
		},
		"opfs": fskit.MapFS{
			"home": fskit.MapFS{
				"gm": fskit.RawNode([]byte("#!/bin/bash\necho gm\n")),
			},
		},
	}
	if err := task.NS().Bind(m, ".", "."); err != nil {
		t.Fatal(err)
	}
	task.env = []string{"PATH=/bin"}
	task.dir = "/opfs/home"

	// The kernel sees the spawn-stripped (root-relative) form.
	task.SetArgs([]string{"opfs/home/gm"})
	if !task.resolveShebang() {
		t.Fatal("script should resolve to its interpreter")
	}
	got := task.Args()
	if len(got) != 2 || got[0] != "/bin/bash" {
		t.Fatalf("args = %v, want [ /bin/bash <script> ]", got)
	}

	// Interpreter side: bash/hush opens the script argument; the worker's
	// cleanpath resolves it against the interpreter's cwd (inherited from
	// the parent task's dir, /opfs/home).
	scriptArg := got[1]
	resolved := workerCleanpath(scriptArg, task.dir)

	f, err := task.NS().Open(resolved)
	if err != nil {
		t.Fatalf("interpreter could not open script %q (cleanpath %q): %v", scriptArg, resolved, err)
	}
	defer f.Close()
	buf, _ := io.ReadAll(io.LimitReader(f, 512))
	if !strings.HasPrefix(string(buf), "#!/bin/bash") {
		t.Fatalf("opened wrong file: %q", buf)
	}

	// Pre-fix behavior must fail: the raw kernel-relative path gets
	// cwd-joined and resolves to /opfs/home/opfs/home/gm.
	oldResolved := workerCleanpath("opfs/home/gm", task.dir)
	if oldResolved == resolved {
		t.Fatalf("pre-fix path %q unexpectedly resolved identically", oldResolved)
	}
	if _, err := task.NS().Open(oldResolved); err == nil {
		t.Fatalf("pre-fix path %q should not resolve", oldResolved)
	}
	if _, err := task.NS().Open(oldResolved); err == nil || !strings.Contains(err.Error(), "does not exist") {
		// The kernel error surfaces with the path the interpreter passed,
		// exactly as the shell reported: "open opfs/home/gm: ...".
		t.Fatalf("want not-exist error, got %v", err)
	}
	_ = path.Clean // keep path import if unused in future edits
}
