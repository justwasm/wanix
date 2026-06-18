package main

import (
	"fmt"
	"os"

	"tractor.dev/wanix"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: detect <wasm-file>...\n")
		os.Exit(1)
	}
	exitCode := 0
	for _, path := range os.Args[1:] {
		f, err := os.Open(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "%s: %v\n", path, err)
			exitCode = 1
			continue
		}
		kind := wanix.DetectWASMKind(f)
		f.Close()
		fmt.Printf("%s: %s\n", path, kind)
	}
	os.Exit(exitCode)
}
