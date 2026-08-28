//go:build js && wasm

package jsfs

import (
	"sort"
	"syscall/js"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
)

// listDirEntries returns children for an object directory (Object.keys).
//
// Entry listing must survive arbitrary JS objects (proxies whose ownKeys or
// property getters throw, values syscall/js cannot classify) — a panic here
// aborts the whole wasm kernel and with it every running task. Each phase is
// guarded: a bad key fetch or mode classification skips that entry instead of
// killing the runtime.
func listDirEntries(v js.Value) []fs.DirEntry {
	var names []string
	func() {
		defer func() { _ = recover() }()
		keys := js.Global().Get("Object").Call("keys", v)
		for i := 0; i < keys.Length(); i++ {
			names = append(names, keys.Index(i).String())
		}
	}()
	return modeEntries(v, names)
}

// modeEntries builds fs.DirEntry values for names, skipping any name whose
// property read or mode classification panics (see entryModeFor).
func modeEntries(v js.Value, names []string) []fs.DirEntry {
	sort.Strings(names)
	entries := make([]fs.DirEntry, 0, len(names))
	for _, name := range names {
		mode := fs.FileMode(0)
		ok := false
		func() {
			defer func() { _ = recover() }()
			mode = entryModeFor(v.Get(name))
			ok = true
		}()
		if !ok {
			continue
		}
		entries = append(entries, fskit.Entry(name, mode))
	}
	return entries
}

// listObjViewEntries returns prototype-inclusive string keys (non-enumerable
// included). Symbol keys are omitted (path segments are strings only).
//
// Like listDirEntries, it must never panic: a Proxy's ownKeys or
// getPrototypeOf trap can throw, and property values can be values syscall/js
// cannot classify. Name collection keeps what it has when a trap throws; mode
// classification skips unreadable entries.
func listObjViewEntries(v js.Value) []fs.DirEntry {
	seen := map[string]struct{}{}
	var names []string

	func() {
		defer func() { _ = recover() }()
		cur := v
		for cur.Type() == js.TypeObject && !isNullish(cur) {
			ow := js.Global().Get("Reflect").Call("ownKeys", cur)
			for i := 0; i < ow.Length(); i++ {
				k := ow.Index(i)
				if k.Type() != js.TypeString {
					continue
				}
				s := k.String()
				if _, ok := seen[s]; ok {
					continue
				}
				seen[s] = struct{}{}
				names = append(names, s)
			}
			cur = js.Global().Get("Object").Call("getPrototypeOf", cur)
		}
	}()

	return modeEntries(v, names)
}
