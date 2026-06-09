//go:build js && wasm

package clipboard

import (
	"errors"
	"syscall/js"
	"time"
)

const clipboardTimeout = 10 * time.Second

func readAll() (string, error) {
	nav := js.Global().Get("navigator")
	if nav.IsUndefined() || nav.IsNull() {
		return "", errors.New("clipboard: navigator not available")
	}
	clip := nav.Get("clipboard")
	if clip.IsUndefined() || clip.IsNull() {
		return "", errors.New("clipboard: navigator.clipboard not available")
	}

	result := make(chan string, 1)
	errCh := make(chan error, 1)

	thenFunc := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) > 0 {
			result <- args[0].String()
		} else {
			result <- ""
		}
		return nil
	})
	defer thenFunc.Release()

	catchFunc := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) > 0 {
			errCh <- errors.New(args[0].Call("toString").String())
		} else {
			errCh <- errors.New("clipboard: readText failed")
		}
		return nil
	})
	defer catchFunc.Release()

	clip.Call("readText").Call("then", thenFunc).Call("catch", catchFunc)

	select {
	case text := <-result:
		return text, nil
	case err := <-errCh:
		return "", err
	case <-time.After(clipboardTimeout):
		return "", errors.New("clipboard: readText timed out")
	}
}

func writeAll(text string) error {
	nav := js.Global().Get("navigator")
	if nav.IsUndefined() || nav.IsNull() {
		return errors.New("clipboard: navigator not available")
	}
	clip := nav.Get("clipboard")
	if clip.IsUndefined() || clip.IsNull() {
		return errors.New("clipboard: navigator.clipboard not available")
	}

	errCh := make(chan error, 1)

	thenFunc := js.FuncOf(func(_ js.Value, _ []js.Value) any {
		errCh <- nil
		return nil
	})
	defer thenFunc.Release()

	catchFunc := js.FuncOf(func(_ js.Value, args []js.Value) any {
		if len(args) > 0 {
			errCh <- errors.New(args[0].Call("toString").String())
		} else {
			errCh <- errors.New("clipboard: writeText failed")
		}
		return nil
	})
	defer catchFunc.Release()

	clip.Call("writeText", text).Call("then", thenFunc).Call("catch", catchFunc)

	select {
	case err := <-errCh:
		return err
	case <-time.After(clipboardTimeout):
		return errors.New("clipboard: writeText timed out")
	}
}
