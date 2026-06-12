#!/bin/sh
set -e
cd "$(dirname "$0")"
GOOS=js GOARCH=wasm /go/bin/go build -o devnull.wasm .
echo "Built devnull.wasm"
