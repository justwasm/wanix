package wanix

import (
	"io"
)

// DetectWASMKind reads a WASM binary and detects whether it's
// a Go JS (GOOS=js GOARCH=wasm) or WASI (TinyGo, etc.) binary.
// Returns "gojs", "wasi", or "" if undetectable.
func DetectWASMKind(r io.Reader) string {
	data, err := io.ReadAll(io.LimitReader(r, 1<<20)) // 1MB max
	if err != nil || len(data) < 8 {
		return ""
	}

	// Check WASM magic: \x00asm
	if data[0] != 0x00 || data[1] != 0x61 || data[2] != 0x73 || data[3] != 0x6d {
		return ""
	}
	// Check WASM version: \x01\x00\x00\x00
	if data[4] != 0x01 || data[5] != 0x00 || data[6] != 0x00 || data[7] != 0x00 {
		return ""
	}

	offset := 8
	var hasGoImport, hasWasiImport bool

	for offset < len(data) {
		// Section ID (1 byte)
		if offset >= len(data) {
			break
		}
		sectionID := data[offset]
		offset++

		// Section size (LEB128 u32)
		size, newOffset := readULEB128(data, offset)
		offset = newOffset
		if offset+int(size) > len(data) {
			break
		}
		content := data[offset : offset+int(size)]
		offset += int(size)

		if sectionID != 2 { // Import section
			continue
		}

		// Parse Import section
		coff := 0
		var importCount uint32
		importCount, coff = readULEB128(content, coff)

		for i := uint32(0); i < importCount; i++ {
			// module name
			var modLen uint32
			modLen, coff = readULEB128(content, coff)
			if coff+int(modLen) > len(content) {
				return detectFromFlags(hasGoImport, hasWasiImport)
			}
			modName := string(content[coff : coff+int(modLen)])
			coff += int(modLen)

			switch modName {
			case "go":
				hasGoImport = true
			case "wasi_snapshot_preview1":
				hasWasiImport = true
			}

			// import name
			var nameLen uint32
			nameLen, coff = readULEB128(content, coff)
			if coff+int(nameLen) > len(content) {
				return detectFromFlags(hasGoImport, hasWasiImport)
			}
			coff += int(nameLen)

			// import kind (1 byte)
			if coff+1 > len(content) {
				return detectFromFlags(hasGoImport, hasWasiImport)
			}
			kind := content[coff]
			coff++

			// kind-specific data
			switch kind {
			case 0: // func
				if coff+1 > len(content) {
					return detectFromFlags(hasGoImport, hasWasiImport)
				}
				_, coff = readULEB128(content, coff) // type index
			case 1: // table
				if coff+2 > len(content) {
					return detectFromFlags(hasGoImport, hasWasiImport)
				}
				coff++ // elemtype
				_, coff = readLimits(content, coff)
			case 2: // mem
				_, coff = readLimits(content, coff)
			case 3: // global
				if coff+2 > len(content) {
					return detectFromFlags(hasGoImport, hasWasiImport)
				}
				coff += 2 // valtype + mut
			}
	}

	return detectFromFlags(hasGoImport, hasWasiImport)
	}
	return detectFromFlags(hasGoImport, hasWasiImport)
}

func detectFromFlags(hasGoImport, hasWasiImport bool) string {
	if hasWasiImport {
		return "wasi"
	}
	// Go JS has "go" import; non-WASI WASM also falls back to gojs
	return "gojs"
}

// readULEB128 decodes a unsigned LEB128-encoded uint32.
func readULEB128(data []byte, offset int) (uint32, int) {
	var result uint32
	var shift uint
	for {
		b := data[offset]
		offset++
		result |= uint32(b&0x7f) << shift
		if b&0x80 == 0 {
			break
		}
		shift += 7
	}
	return result, offset
}

// readLimits reads a WASM limits-encoded pair (flags + initial, optional max).
func readLimits(data []byte, offset int) (uint32, int) {
	flags, offset := readULEB128(data, offset)
	initial, offset := readULEB128(data, offset)
	_ = initial
	if flags&1 != 0 {
		_, offset = readULEB128(data, offset) // max
	}
	return 0, offset
}
