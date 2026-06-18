#!/usr/bin/env bash
set -euo pipefail

# Ensure dist exists
mkdir -p dist

# Optional: check esbuild exists
if ! command -v esbuild >/dev/null 2>&1; then
  echo "error: esbuild not found in PATH (try: npx esbuild ... or npm i -D esbuild)" >&2
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

# 1) api/handle.js -> dist/wanix.handle.js
run_build esbuild api/handle.js \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=dist/wanix.handle.js \
  --log-level=info

# 2) index.ts -> dist/wanix.js
# Go version used LoaderText for .go.js/.tinygo.js; CLI equivalent is loader=file text mapping:
run_build esbuild index.ts \
  --bundle \
  --format=esm \
  --external:util \
  --loader:.go.js=text \
  --loader:.tinygo.js=text \
  --outfile=dist/wanix.js \
  --log-level=info

# 3) index.ts -> dist/wanix.min.js (minified)
run_build esbuild index.ts \
  --bundle \
  --format=esm \
  --external:util \
  --loader:.go.js=text \
  --loader:.tinygo.js=text \
  --minify-whitespace \
  --minify-identifiers \
  --minify-syntax \
  --outfile=dist/wanix.min.js \
  --log-level=info

# 4) wasi/mod.ts -> wasi/worker/lib.js
run_build esbuild wasi/mod.ts \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=wasi/worker/lib.js \
  --log-level=info

# 5) gojs/mod.ts -> gojs/worker/lib.js
run_build esbuild gojs/mod.ts \
  --bundle \
  --format=esm \
  --external:util \
  --outfile=gojs/worker/lib.js \
  --log-level=info

# Wait all; fail if any failed
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
