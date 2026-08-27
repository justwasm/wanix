package api

// bytesArg coerces an RPC argument into bytes. The cbor codec decodes cbor
// byte strings as []byte, but the gojs worker may send write payloads whose
// codec representation is a string or a numeric array; panic-free coercion
// keeps a malformed or unexpected payload from crashing the whole kernel.
func bytesArg(v any) ([]byte, bool) {
	switch d := v.(type) {
	case []byte:
		return d, true
	case string:
		return []byte(d), true
	case []any:
		b := make([]byte, len(d))
		for i, x := range d {
			switch n := x.(type) {
			case float64:
				b[i] = byte(n)
			case uint64:
				b[i] = byte(n)
			case int64:
				b[i] = byte(n)
			default:
				return nil, false
			}
		}
		return b, true
	}
	return nil, false
}
