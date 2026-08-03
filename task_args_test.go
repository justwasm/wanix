package wanix

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestEncodeTaskArgsPreservesArgumentBoundaries(t *testing.T) {
	want := []string{"go", "list", "-m", "-f", "{{.Path}}\n{{.Dir}}\n{{.GoVersion}}\n", ""}
	var got []string
	if err := json.Unmarshal([]byte(encodeTaskArgs(want)), &got); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("decoded args = %q, want %q", got, want)
	}
}
