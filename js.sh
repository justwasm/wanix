#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p dist

if [[ -n "${ESBUILD:-}" ]]; then
  esbuild="$ESBUILD"
elif [[ -x node_modules/.bin/esbuild ]]; then
  esbuild="node_modules/.bin/esbuild"
elif command -v esbuild >/dev/null 2>&1; then
  esbuild="$(command -v esbuild)"
else
  echo "error: esbuild not found; run npm install or set ESBUILD" >&2
  exit 1
fi

pids=()

run_build() {
  (
    set -euo pipefail
    "$@"
  ) &
  pids+=("$!")
}

run_build "$esbuild" api/handle.js \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=dist/wanix.handle.js \
  --log-level=info

run_build "$esbuild" index.ts \
  --bundle \
  --format=esm \
  --external:util \
  --loader:.go.js=text \
  --loader:.tinygo.js=text \
  --loader:.css=text \
  --outfile=dist/wanix.js \
  --log-level=info

run_build "$esbuild" index.ts \
  --bundle \
  --format=esm \
  --external:util \
  --loader:.go.js=text \
  --loader:.tinygo.js=text \
  --loader:.css=text \
  --minify-whitespace \
  --minify-identifiers \
  --minify-syntax \
  --outfile=dist/wanix.min.js \
  --log-level=info

run_build "$esbuild" wasi/mod.ts \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=wasi/worker/lib.js \
  --log-level=info

run_build "$esbuild" gojs/mod.ts \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=gojs/worker/lib.js \
  --log-level=info

failed=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  echo "js build failed" >&2
  exit 1
fi

echo "js build complete"
