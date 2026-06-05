#!/bin/sh
# build and run the Bubbletea counter demo
set -e

cd "$(dirname "$0")/../.."

echo "=== Building wanix JS ==="
make js 2>&1 | tail -1

echo "=== Building wanix debug WASM ==="
make wasm-go 2>&1 | tail -1

echo "=== Building Bubbletea WASM ==="
cd examples/bubbletea-counter
go run ../../tools/build-bubbletea -o bubbletea.wasm . 2>&1
cd ../..

echo "=== Starting dev server ==="
echo "Open http://localhost:7070/examples/bubbletea-counter/"
go run ./examples/serve.go
