package wanix

import (
	"testing"

	"tractor.dev/wanix/fs/fskit"
)

func TestTaskLookPath(t *testing.T) {
	d := NewTaskFS()
	task, err := d.Alloc("auto", nil)
	if err != nil {
		t.Fatal(err)
	}

	m := fskit.MapFS{
		"bin": fskit.MapFS{
			"hello": fskit.RawNode([]byte("#!/bin/sh\n")),
		},
		"srv": fskit.MapFS{
			"w9y": fskit.RawNode([]byte("wasm")),
		},
	}
	if err := task.NS().Bind(m, ".", "."); err != nil {
		t.Fatal(err)
	}

	task.env = []string{"PATH=/bin:/srv"}

	cases := []struct {
		name string
		want string
	}{
		{"hello", "/bin/hello"},
		{"w9y", "/srv/w9y"},
		{"/srv/w9y", "/srv/w9y"}, // names with separators pass through
		{"nope", "nope"},         // no PATH match falls back to the bare name
	}
	for _, c := range cases {
		if got := task.LookPath(c.name); got != c.want {
			t.Errorf("LookPath(%q) = %q, want %q", c.name, got, c.want)
		}
	}

	// Default PATH applies when the task has no PATH env entry.
	task.env = nil
	if got := task.LookPath("hello"); got != "/bin/hello" {
		t.Errorf("LookPath with default PATH = %q, want %q", got, "/bin/hello")
	}
}
