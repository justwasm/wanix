package wanix

import (
	"reflect"
	"testing"

	"tractor.dev/wanix/fs/fskit"
)

func TestTaskResolveShebang(t *testing.T) {
	d := NewTaskFS()
	task, err := d.Alloc("auto", nil)
	if err != nil {
		t.Fatal(err)
	}

	m := fskit.MapFS{
		"bin": fskit.MapFS{
			"bash":  fskit.RawNode([]byte("wasm-bash")),
			"gm":    fskit.RawNode([]byte("#!/bin/bash\necho gm\n")),
			"env":   fskit.RawNode([]byte("wasm-env")),
			"enve":  fskit.RawNode([]byte("#!/bin/env bash\n")),
			"flag":  fskit.RawNode([]byte("#!/bin/bash -e\n")),
			"plain": fskit.RawNode([]byte("not a script")),
		},
	}
	if err := task.NS().Bind(m, ".", "."); err != nil {
		t.Fatal(err)
	}
	task.env = []string{"PATH=/bin"}

	t.Run("plain-binary", func(t *testing.T) {
		task.SetArgs([]string{"/bin/bash"})
		if task.resolveShebang() {
			t.Fatal("binary must not resolve as a shebang")
		}
	})

	t.Run("script", func(t *testing.T) {
		task.SetArgs([]string{"/bin/gm", "arg1"})
		if !task.resolveShebang() {
			t.Fatal("script should resolve to its interpreter")
		}
		want := []string{"/bin/bash", "/bin/gm", "arg1"}
		if got := task.Args(); !reflect.DeepEqual(got, want) {
			t.Fatalf("args = %v, want %v", got, want)
		}
	})

	t.Run("bare-name-script", func(t *testing.T) {
		task.SetArgs([]string{"gm"})
		if !task.resolveShebang() {
			t.Fatal("bare script name should resolve via PATH")
		}
		want := []string{"/bin/bash", "/bin/gm"}
		if got := task.Args(); !reflect.DeepEqual(got, want) {
			t.Fatalf("args = %v, want %v", got, want)
		}
	})

	t.Run("env-shebang", func(t *testing.T) {
		task.SetArgs([]string{"/bin/enve"})
		if !task.resolveShebang() {
			t.Fatal("env shebang should resolve")
		}
		want := []string{"/bin/env", "bash", "/bin/enve"}
		if got := task.Args(); !reflect.DeepEqual(got, want) {
			t.Fatalf("args = %v, want %v", got, want)
		}
	})

	t.Run("interpreter-flag", func(t *testing.T) {
		task.SetArgs([]string{"/bin/flag"})
		if !task.resolveShebang() {
			t.Fatal("flagged shebang should resolve")
		}
		want := []string{"/bin/bash", "-e", "/bin/flag"}
		if got := task.Args(); !reflect.DeepEqual(got, want) {
			t.Fatalf("args = %v, want %v", got, want)
		}
	})

	t.Run("not-a-script", func(t *testing.T) {
		task.SetArgs([]string{"/bin/plain"})
		if task.resolveShebang() {
			t.Fatal("non-shebang file must not be rewritten")
		}
	})
}
