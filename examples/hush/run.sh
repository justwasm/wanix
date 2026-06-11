#!/bin/sh
# build and run the Bubbletea counter demo
set -e

cd "$(dirname "$0")/../.."

#echo "=== Building wanix debug WASM ==="
#make wasm-go 2>&1 | tail -1
GOROOT=/go

echo "=== Building kernel WASM ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GOROOT/bin/go build -o dist/wanix.debug.wasm ./wasm 2>&1 | tail -1

echo "=== Building Bubbletea WASM ==="
export PATH=/go/bin:$PATH
$GOROOT/bin/go build -o /tmp/boba ./tools/build-bubbletea

pushd rc
go mod tidy
/tmp/boba -o ../examples/repl-rc/rc.wasm ./cmd/rc 2>&1
popd

pushd hush
go mod tidy
/tmp/boba -o ../examples/repl-rc/hush.wasm . 2>&1
popd

echo "=== Starting dev server ==="
echo "Open http://localhost:7070/examples/bubbletea-counter/"
go run ./examples/serve.go
