//go:build js && wasm

package cache

import (
	"sync"
	"syscall/js"
)

var (
	jsWasm    = js.Global().Get("WebAssembly")
	memCache  = make(map[string]js.Value, maxModules)
	order     []string
	mu        sync.Mutex
)

const maxModules = 32

// GetOrCompile returns a compiled WebAssembly.Module for the given path.
// On cache hit, returns the cached module immediately.
// On cache miss, compiles the binary, caches the module, and returns it.
func GetOrCompile(path string, binary []byte) (js.Value, error) {
	mu.Lock()
	if module, ok := memCache[path]; ok {
		mu.Unlock()
		return module, nil
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
	memCache[path] = module
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
	memCache = make(map[string]js.Value, maxModules)
	order = nil
	mu.Unlock()
}
