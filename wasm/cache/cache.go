//go:build js && wasm

package cache

import (
	"errors"
	"hash/fnv"
	"sync"
	"syscall/js"
)

type entry struct {
	module js.Value
	hash   uint64
}

var (
	jsWasm   = js.Global().Get("WebAssembly")
	memCache = make(map[string]entry, maxModules)
	order    []string
	mu       sync.Mutex
)

const maxModules = 32

// GetOrCompile returns a compiled WebAssembly.Module for the given path.
// It verifies content integrity via a hash of the binary — if the file at the
// same path has changed, it recompiles and updates the cache.
func GetOrCompile(path string, binary []byte) (js.Value, error) {
	h := hash64(binary)

	mu.Lock()
	if e, ok := memCache[path]; ok && e.hash == h {
		mu.Unlock()
		return e.module, nil
	}
	mu.Unlock()

	// Compile outside the lock
	jsBin := js.Global().Get("Uint8Array").New(len(binary))
	js.CopyBytesToJS(jsBin, binary)
	compilePromise := jsWasm.Call("compile", jsBin)
	resultCh := make(chan js.Value, 1)
	errCh := make(chan error, 1)
	success := js.FuncOf(func(this js.Value, args []js.Value) any {
		resultCh <- args[0]
		return nil
	})
	failure := js.FuncOf(func(this js.Value, args []js.Value) any {
		errCh <- js.Error{Value: args[0]}
		return nil
	})
	compilePromise.Call("then", success, failure)

	var module js.Value
	select {
	case module = <-resultCh:
	case err := <-errCh:
		return js.Value{}, err
	}

	mu.Lock()
	if len(memCache) >= maxModules {
		oldest := order[0]
		delete(memCache, oldest)
		order = order[1:]
	}
	memCache[path] = entry{module: module, hash: h}
	order = append(order, path)
	mu.Unlock()

	return module, nil
}

// Drop removes a module from the cache. Used when a WASM file is modified.
func Drop(path string) {
	mu.Lock()
	delete(memCache, path)
	for i, p := range order {
		if p == path {
			order = append(order[:i], order[i+1:]...)
			break
		}
	}
	mu.Unlock()
}

// Clear empties the entire cache.
func Clear() {
	mu.Lock()
	memCache = make(map[string]entry, maxModules)
	order = nil
	mu.Unlock()
}

// hash64 computes a 64-bit FNV-1a hash of the binary content.
// Fast non-crypto hash — collision risk is negligible for cache invalidation.
func hash64(data []byte) uint64 {
	h := fnv.New64a()
	h.Write(data)
	return h.Sum64()
}

// --- Streaming compile from a URL (instantiateStreaming direction) ---
//
// Large binaries (the 25MB gojs hush shell) must not be read into kernel
// memory chunk-by-chunk: fetch binds materialize their stream with one
// JS round-trip per chunk, which stalls in throttled environments before
// the file ever lands in the task namespace. Instead the drivers compile
// straight from the bind's source URL with WebAssembly.compileStreaming
// (the browser fetches + compiles on its own thread) and the compiled
// Module is cached here by URL, so the memory cache is preserved and
// repeated runs skip both the network and the compile.

// fetchBindSrcs maps a bind destination path (e.g. "bin/bash") to the
// fetch source URL it was created from. Registered by wasm.go while
// applying namespace binds; consulted by the drivers before falling back
// to reading the file from the namespace.
var fetchBindSrcs sync.Map // dst -> src URL

// RegisterFetchBind records a fetch/file bind's dst -> src mapping.
func RegisterFetchBind(dst, src string) {
	if dst == "" || src == "" {
		return
	}
	fetchBindSrcs.Store(dst, src)
}

// FetchBindSrc returns the fetch source URL for a bind dst ("" if none).
func FetchBindSrc(dst string) string {
	if v, ok := fetchBindSrcs.Load(dst); ok {
		return v.(string)
	}
	return ""
}

// GetOrCompileStreaming compiles the WebAssembly module at url via
// WebAssembly.compileStreaming (browser-side fetch + compile, never in
// kernel memory) and caches the Module by URL. It mirrors GetOrCompile's
// promise-await pattern; a 404 or a non-wasm response surfaces as an
// error so the caller can fall back to the file path.
func GetOrCompileStreaming(url string) (js.Value, error) {
	if url == "" {
		return js.Value{}, errors.New("empty url")
	}

	mu.Lock()
	if e, ok := memCache[url]; ok {
		mu.Unlock()
		return e.module, nil
	}
	mu.Unlock()

	// compileStreaming wants an application/wasm response; blob: URLs
	// (the OPFS bind cache) often lack that header, so fall back to
	// fetch+arrayBuffer+compile, which still keeps the bytes in the
	// browser rather than reading the namespace file chunk-by-chunk.
	var module js.Value
	m, err := awaitValue(jsWasm.Call("compileStreaming", js.Global().Get("fetch").Invoke(url)))
	if err != nil {
		ab, abErr := awaitValue(js.Global().Get("fetch").Invoke(url).Call("then",
			js.FuncOf(func(this js.Value, args []js.Value) any {
				return args[0].Call("arrayBuffer")
			})))
		if abErr != nil {
			return js.Value{}, abErr
		}
		m, err = awaitValue(jsWasm.Call("compile", ab))
		if err != nil {
			return js.Value{}, err
		}
	}
	module = m

	mu.Lock()
	if len(memCache) >= maxModules {
		oldest := order[0]
		delete(memCache, oldest)
		order = order[1:]
	}
	memCache[url] = entry{module: module}
	order = append(order, url)
	mu.Unlock()

	return module, nil
}

// awaitValue resolves a promise to its value (or error) via the same
// js.FuncOf + select pattern used elsewhere in this package.
func awaitValue(promise js.Value) (js.Value, error) {
	resultCh := make(chan js.Value, 1)
	errCh := make(chan error, 1)
	success := js.FuncOf(func(this js.Value, args []js.Value) any {
		resultCh <- args[0]
		return nil
	})
	failure := js.FuncOf(func(this js.Value, args []js.Value) any {
		errCh <- js.Error{Value: args[0]}
		return nil
	})
	promise.Call("then", success, failure)
	select {
	case v := <-resultCh:
		return v, nil
	case err := <-errCh:
		return js.Value{}, err
	}
}
