#!/usr/bin/env node
// Idempotently apply xterm.js PR #6059 (fix/touch-inertia-nan-mouse-reports)
// to the @xterm/xterm lib files under node_modules before `make js` bundles
// them into dist/wanix*.js.
//
// The PR stops mobile touch fling inertia from emitting garbage into the
// terminal: momentum-frame gesture events had no client coordinates, and the
// mouse-report wheel path serialized them as `CSI < 64 ; NaN ; NaN M`.
//
// Two changes, adapted to the compiled lib output (the package ships no src):
//  1. Gesture._inertia() stamps extrapolated pageX/pageY/clientX/clientY on
//     each momentum-frame event.
//  2. MouseService._handleTouchScrollAsWheel() drops events whose client
//     coordinates are not finite.
//
// If @xterm/xterm is upgraded to a version whose compiled shape changed, the
// anchor assertions below fail loudly instead of silently shipping an
// unpatched bundle; update the anchors (and EXPECTED) in that case.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libDir = path.join(root, "node_modules", "@xterm", "xterm", "lib");

const EXPECTED = "6.1.0-beta.303";
const pkgFile = path.join(libDir, "..", "package.json");
if (!fs.existsSync(pkgFile)) {
  console.error("patch-xterm: node_modules/@xterm/xterm not found; run `npm install` first");
  process.exit(1);
}
const { version } = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
if (version !== EXPECTED) {
  console.warn(`patch-xterm: @xterm/xterm version is ${version}, expected ${EXPECTED}; ` +
    "anchors below must still match or the build fails");
}

// [file, [anchor, replacement, marker][]]
const PATCHES = [
  ["xterm.mjs", [
    [
      "f.translationX=_,f.translationY=p,t.forEach(S=>S.dispatchEvent(f)),",
      "f.translationX=_,f.translationY=p,f.pageX=a+_,f.pageY=d+p,f.clientX=a+_-e.scrollX,f.clientY=d+p-e.scrollY,t.forEach(S=>S.dispatchEvent(f)),",
      "f.pageX=a+_",
    ],
    [
      "_handleTouchScrollAsWheel(i,e){let t=this._renderService?.dimensions.css.cell.height;if(!t)return;this._touchScrollAccumulator-=e.translationY",
      "_handleTouchScrollAsWheel(i,e){let t=this._renderService?.dimensions.css.cell.height;if(!t)return;if(!isFinite(e.clientX)||!isFinite(e.clientY))return;this._touchScrollAccumulator-=e.translationY",
      "isFinite(e.clientX)",
    ],
  ]],
  ["xterm.js", [
    [
      "v.translationX=d,v.translationY=_,t.forEach(e=>e.dispatchEvent(v)),",
      "v.translationX=d,v.translationY=_,v.pageX=o+d,v.pageY=l+_,v.clientX=o+d-e.scrollX,v.clientY=l+_-e.scrollY,t.forEach(e=>e.dispatchEvent(v)),",
      "v.pageX=o+d",
    ],
    [
      "_handleTouchScrollAsWheel(e,t){const i=this._renderService?.dimensions.css.cell.height;if(!i)return;this._touchScrollAccumulator-=t.translationY",
      "_handleTouchScrollAsWheel(e,t){const i=this._renderService?.dimensions.css.cell.height;if(!i)return;if(!isFinite(t.clientX)||!isFinite(t.clientY))return;this._touchScrollAccumulator-=t.translationY",
      "isFinite(t.clientX)",
    ],
  ]],
];

let changed = false;
for (const [rel, list] of PATCHES) {
  const file = path.join(libDir, rel);
  if (!fs.existsSync(file)) {
    console.error(`patch-xterm: ${rel} not found`);
    process.exit(1);
  }
  let src = fs.readFileSync(file, "utf8");
  for (const [anchor, replacement, marker] of list) {
    if (src.includes(marker)) {
      console.log(`patch-xterm: ${rel} already patched (${marker})`);
      continue;
    }
    const count = src.split(anchor).length - 1;
    if (count !== 1) {
      console.error(`patch-xterm: anchor matched ${count}x in ${rel}: ${anchor.slice(0, 60)}...`);
      console.error(`patch-xterm: @xterm/xterm ${version} source shape differs from expected ${EXPECTED}; ` +
        "update scripts/patch-xterm.mjs anchors or pin the version in package.json");
      process.exit(1);
    }
    src = src.replace(anchor, replacement);
    changed = true;
  }
  fs.writeFileSync(file, src);
}
console.log(changed
  ? "patch-xterm: applied xterm.js PR #6059 (touch inertia NaN mouse reports)"
  : "patch-xterm: nothing to do, @xterm/xterm already patched");
