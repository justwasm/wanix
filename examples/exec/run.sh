#!/bin/sh
set -e
cd "$(dirname "$0")"
GOOS=js GOARCH=wasm /go/bin/go build -o exec.wasm .
echo "Built exec.wasm"
