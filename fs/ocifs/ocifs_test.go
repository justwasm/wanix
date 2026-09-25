package ocifs

import (
	"archive/tar"
	"bytes"
	"io"
	"testing"

	"tractor.dev/wanix/fs"
)

type entry struct {
	name string
	body string
}

func TestLayersApplyOCIWhiteouts(t *testing.T) {
	base := layer(t, []entry{
		{name: "etc/base", body: "base"},
		{name: "etc/remove", body: "remove"},
		{name: "opt/old", body: "old"},
	})
	top := layer(t, []entry{
		{name: "etc/base", body: "replacement"},
		{name: "etc/.wh.remove"},
		{name: "opt/.wh..wh..opq"},
		{name: "opt/new", body: "new"},
	})
	fsys, err := New([]io.Reader{bytes.NewReader(base), bytes.NewReader(top)})
	if err != nil {
		t.Fatal(err)
	}
	assertText(t, fsys, "etc/base", "replacement")
	assertMissing(t, fsys, "etc/remove")
	assertMissing(t, fsys, "opt/old")
	assertText(t, fsys, "opt/new", "new")
}

func TestLayersPreserveSymlinks(t *testing.T) {
	archive := symlinkLayer(t, "bin/sh", "/bin/busybox")
	fsys, err := New([]io.Reader{bytes.NewReader(archive)})
	if err != nil {
		t.Fatal(err)
	}
	target, err := fs.Readlink(fsys, "bin/sh")
	if err != nil {
		t.Fatal(err)
	}
	if target != "/bin/busybox" {
		t.Fatalf("target = %q, want %q", target, "/bin/busybox")
	}
}

func layer(t *testing.T, entries []entry) []byte {
	t.Helper()
	var buffer bytes.Buffer
	writer := tar.NewWriter(&buffer)
	for _, entry := range entries {
		header := &tar.Header{Name: entry.name, Mode: 0644, Size: int64(len(entry.body))}
		if err := writer.WriteHeader(header); err != nil {
			t.Fatal(err)
		}
		if _, err := writer.Write([]byte(entry.body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	return buffer.Bytes()
}

func symlinkLayer(t *testing.T, name, target string) []byte {
	t.Helper()
	var buffer bytes.Buffer
	writer := tar.NewWriter(&buffer)
	if err := writer.WriteHeader(&tar.Header{Name: name, Typeflag: tar.TypeSymlink, Linkname: target, Mode: 0777}); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	return buffer.Bytes()
}

func assertText(t *testing.T, fsys fs.FS, name, want string) {
	t.Helper()
	data, err := fs.ReadFile(fsys, name)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != want {
		t.Fatalf("%s = %q, want %q", name, data, want)
	}
}

func assertMissing(t *testing.T, fsys fs.FS, name string) {
	t.Helper()
	if _, err := fs.Stat(fsys, name); err == nil {
		t.Fatalf("%s exists", name)
	}
}
