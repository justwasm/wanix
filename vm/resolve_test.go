package vm

import (
	"context"
	"testing"

	"tractor.dev/wanix"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/vfs"
)

// Resolving the "#vm" device namespace from a host namespace must yield the
// *vm.Device itself, so callers can Lookup a resource by id. Regression for
// the guest-mount failure "error resolving vm device: not a vm.Device",
// where fs.Resolve descended past the device into its union namespace.
func TestResolveDeviceNamespaceReturnsDevice(t *testing.T) {
	root, err := wanix.NewRoot()
	if err != nil {
		t.Fatal(err)
	}
	ns := vfs.New(context.Background())
	d := New(root)
	if err := ns.Bind(d, ".", "#vm"); err != nil {
		t.Fatal(err)
	}

	rfsys, rname, err := fs.Resolve(ns, context.Background(), "#vm")
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := rfsys.(*Device); !ok {
		t.Fatalf("resolve #vm: got %T (want *vm.Device), rel=%q", rfsys, rname)
	}
}

// Typed operations on #vm/<id>/<file> (chmod, writeFile, readDir) must keep
// working: the device routes non-root names into its union so operations
// descend into the VM resource's own namespace. This is the behavior the
// device became a RouteFS for.
func TestTypedOpsOnVMResource(t *testing.T) {
	root, err := wanix.NewRoot()
	if err != nil {
		t.Fatal(err)
	}
	ns := vfs.New(context.Background())
	d := New(root)
	if err := ns.Bind(d, ".", "#vm"); err != nil {
		t.Fatal(err)
	}
	d.mu.Lock()
	d.resources["1"] = &VM{id: "1", kind: "x86", device: d}
	d.mu.Unlock()

	if err := fs.WriteFile(ns, "#vm/1/alias", []byte("guest\n"), 0644); err != nil {
		t.Fatalf("writeFile #vm/1/alias: %v", err)
	}
	if err := fs.Chmod(ns, "#vm/1/alias", 0600); err != nil {
		t.Fatalf("chmod #vm/1/alias: %v", err)
	}
	entries, err := fs.ReadDirContext(context.Background(), ns, "#vm/1")
	if err != nil {
		t.Fatalf("readDir #vm/1: %v", err)
	}
	seen := make(map[string]bool)
	for _, e := range entries {
		seen[e.Name()] = true
	}
	for _, want := range []string{"alias", "ctl", "id", "kind"} {
		if !seen[want] {
			t.Fatalf("readDir #vm/1: missing %q in %v", want, entries)
		}
	}
}
