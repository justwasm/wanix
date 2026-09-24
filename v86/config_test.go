package main

import (
	"strings"
	"testing"
)

func TestParseFlagsUsesCachelessHost9P(t *testing.T) {
	config, err := parseFlags(nil)
	if err != nil {
		t.Fatal(err)
	}
	cmdline, ok := config["cmdline"].(string)
	if !ok {
		t.Fatalf("cmdline = %T, want string", config["cmdline"])
	}
	want := "rootflags=trans=virtio,version=9p2000.L,cache=none,access=any,msize=131072"
	if !strings.Contains(cmdline, want) {
		t.Fatalf("cmdline = %q, want %q", cmdline, want)
	}
}
