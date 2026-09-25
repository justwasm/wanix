#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
assets="$here/v86-readlink-assets"
rv64_release="v0.4.35"
wanix_release="v0.4.56"

mkdir -p "$assets"
gh release download "$rv64_release" --repo justwasm/rv64.js --dir "$assets" --clobber \
  --pattern wanix-linux-x86.tgz \
  --pattern wanix-overlay-x86.tgz \
  --pattern rv64-kernel-x86-minimal
gh release download "$wanix_release" --repo justwasm/wanix --dir "$assets" --clobber \
  --pattern v86.tgz \
  --pattern wanix.min.js \
  --pattern wanix.wasm

for asset in \
  wanix-linux-x86.tgz \
  wanix-overlay-x86.tgz \
  rv64-kernel-x86-minimal \
  v86.tgz \
  wanix.min.js \
  wanix.wasm; do
  test -s "$assets/$asset"
done

printf '%s\n' seabios.bin v86-vm.wasm v86.wasm vgabios.bin > "$assets/v86.expected"
tar -tzf "$assets/v86.tgz" | sort | diff -u "$assets/v86.expected" -
rm "$assets/v86.expected"
