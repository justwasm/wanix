#!/bin/sh
# Build and serve the Go toolchain demo
set -e

cd "$(dirname "$0")/../.."

ROOT=`pwd`

echo "=== Building JS ==="
make js 2>&1 | tail -1

GOROOT=/go

echo "=== Building kernel WASM ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build -o dist/wanix.debug.wasm ./wasm 2>&1 | tail -1
cp dist/wanix.debug.wasm dist/wanix.wasm

# echo "=== Building toolchain WASM (first time may take a while) ==="
# make -C examples/go-repl toolchain 2>&1 | tail -3

echo "=== Building rc.wasm ==="
pushd rc
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build \
    -o $ROOT/examples/go-repl/rc.wasm ./cmd/rc
popd

echo "=== Building parent.wasm ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build \
    -o examples/go-repl/parent.wasm ./examples/go-repl/parent

echo "=== Starting server on http://localhost:4000 ==="
echo "Open http://localhost:4000/examples/go-repl/"

cat > /tmp/serve_go_repl.go << 'GOEOF'
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
	log.Println("serving go-repl demo at http://localhost:4000/examples/go-repl/")
	if err := http.ListenAndServe(":4000", handler); err != nil {
		log.Fatal(err)
	}
}
GOEOF

pkill -f serve_go 2>/dev/null || true
sleep 1
go run /tmp/serve_go_repl.go
