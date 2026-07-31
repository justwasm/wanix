//go:build js && wasm

package cache

import (
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
