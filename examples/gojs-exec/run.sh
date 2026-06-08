#!/bin/sh
# Build and run the Wanix os/exec demo
set -e

cd "$(dirname "$0")/../.."

GOROOT=/go

echo "=== Building wanix JS ==="
make js 2>&1 | tail -1

echo "=== Building wanix debug WASM ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build \
	-o dist/wanix.debug.wasm ./wasm 2>&1 | tail -1
cp dist/wanix.debug.wasm dist/wanix.wasm

echo "=== Building demo WASM binaries (patched Go 1.27) ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build \
	-o examples/gojs-exec/child.wasm ./examples/gojs-exec/child
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build \
	-o examples/gojs-exec/parent.wasm ./examples/gojs-exec/parent

echo "=== Starting dev server on http://localhost:4000 ==="
echo "Open http://localhost:4000/examples/gojs-exec/"

cat > /tmp/serve_gojs_exec.go << 'GOEOF'
package main

import (
	"log"
	"net/http"
)

func main() {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		http.FileServer(http.Dir(".")).ServeHTTP(w, r)
	})
	log.Println("serving gojs-exec demo at http://localhost:4000/examples/gojs-exec/")
	if err := http.ListenAndServe(":4000", handler); err != nil {
		log.Fatal(err)
	}
}
GOEOF

go run /tmp/serve_gojs_exec.go
