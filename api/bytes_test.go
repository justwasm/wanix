package api

import (
	"bytes"
	"testing"
)

func TestBytesArg(t *testing.T) {
	if b, ok := bytesArg([]byte{1, 2}); !ok || !bytes.Equal(b, []byte{1, 2}) {
		t.Fatalf("[]byte round-trip failed: %v %v", b, ok)
	}
	if b, ok := bytesArg("hi"); !ok || string(b) != "hi" {
		t.Fatalf("string coercion failed: %v %v", b, ok)
	}
	if b, ok := bytesArg([]any{float64(0x5b), float64(0x5d), float64(0x0a)}); !ok || !bytes.Equal(b, []byte{0x5b, 0x5d, 0x0a}) {
		t.Fatalf("numeric array coercion failed: %v %v", b, ok)
	}
	if _, ok := bytesArg([]any{true}); ok {
		t.Fatal("bool array must be rejected")
	}
	if _, ok := bytesArg(42); ok {
		t.Fatal("bare number must be rejected")
	}
	if _, ok := bytesArg(nil); ok {
		t.Fatal("nil must be rejected")
	}
}
