#!/bin/sh
# Build Go toolchain for Wanix gojs workers
set -e

WANIX_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GOROOT=/root/justwasm/go
GO=$GOROOT/bin/go
OUTDIR="$WANIX_ROOT/examples/go-repl/toolchain"

mkdir -p "$OUTDIR/bin" "$OUTDIR/pkg/js_wasm" "$OUTDIR/pkg/tool/js_wasm" "$OUTDIR/src"

echo "=== Building Go tool WASM ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GO build -o "$OUTDIR/bin/go.wasm" cmd/go 2>&1 | tail -3

echo "=== Building gofmt ==="
GOROOT=$GOROOT GOOS=js GOARCH=wasm $GO build -o "$OUTDIR/bin/gofmt.wasm" cmd/gofmt 2>&1 | tail -3

echo "=== Building toolchain tools ==="
for tool in buildid pack cover vet asm compile link; do
    echo "  cmd/$tool..."
    GOROOT=$GOROOT GOOS=js GOARCH=wasm $GO build -o "$OUTDIR/pkg/tool/js_wasm/${tool}.wasm" "cmd/$tool" 2>&1 | tail -1
done

echo "=== Copying stdlib source ==="
# Copy only the source directories needed for compilation
for dir in cmd go test; do
    [ "$dir" = "test" ] && continue  # skip test directory
done
# Copy standard library source
(cd "$GOROOT/src" && tar cf - --exclude='testdata' --exclude='*_test.go' \
    $(find . -maxdepth 1 -type d -not -name 'testdata' -not -name 'cmd' -not -name '.*') \
    2>/dev/null) | (cd "$OUTDIR/src" && tar xf -)

echo "=== Copying compiled stdlib packages ==="
# The stdlib .a files for js/wasm target should be already compiled
# in $GOROOT/pkg/js_wasm/
if [ -d "$GOROOT/pkg/js_wasm" ]; then
    cp -a "$GOROOT/pkg/js_wasm"/* "$OUTDIR/pkg/js_wasm/" 2>/dev/null || true
fi

echo "=== Build complete ==="
du -sh "$OUTDIR"
