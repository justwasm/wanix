//go:build js && wasm

package fsa

import (
	_ "embed"
	"log"
	"strings"
	"sync"
	"syscall/js"
	"time"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/misc/jsutil"
)

//go:embed metadb.js
var metadbJS []byte

// FileMetadata represents stored metadata for a file
type FileMetadata struct {
	Mode  fs.FileMode
	Mtime time.Time
	Atime time.Time
}

// MetadataStore manages file metadata globally
type MetadataStore struct {
	dataMu sync.RWMutex
	data   map[string]FileMetadata
	db     js.Value       // MetaDB instance (js.Undefined() if not loaded)
	idbMu  sync.Mutex     // serializes IndexedDB operations
}

var metadataSingleton *MetadataStore
var metadataOnce sync.Once
var loadMetaDBOnce sync.Once

// Metadata returns the global metadata store singleton
func Metadata() *MetadataStore {
	metadataOnce.Do(func() {
		metadataSingleton = &MetadataStore{
			data: make(map[string]FileMetadata),
			db:   js.Undefined(),
		}
	})
	return metadataSingleton
}

// Initialize sets up the metadata store and loads existing data from IndexedDB
func (ms *MetadataStore) Initialize(opfsRoot *FS) error {
	ms.loadMetaDB()
	return ms.loadFromDisk()
}

// loadMetaDB loads the MetaDB JavaScript and creates a database instance.
// Safe to call multiple times; only loads once.
func (ms *MetadataStore) loadMetaDB() {
	loadMetaDBOnce.Do(func() {
		buf := js.Global().Get("Uint8Array").New(len(metadbJS))
		js.CopyBytesToJS(buf, metadbJS)
		blob := js.Global().Get("Blob").New([]any{buf}, js.ValueOf(map[string]any{"type": "text/javascript"}))
		url := js.Global().Get("URL").Call("createObjectURL", blob)

		promise := jsutil.LoadScript(url.String(), false)
		if _, err := jsutil.AwaitErr(promise); err != nil {
			log.Panicln("fsa: metadata: failed to load metadb.js:", err)
		}

		ms.db = js.Global().Get("MetaDB").New("wanix-fsa-meta", "metadata")
	})
}

// GetMetadata retrieves metadata for a path
func (ms *MetadataStore) GetMetadata(path string) (FileMetadata, bool) {
	ms.dataMu.RLock()
	defer ms.dataMu.RUnlock()
	if ms.data == nil {
		return FileMetadata{}, false
	}
	meta, ok := ms.data[path]
	return meta, ok
}

// SetMetadata stores metadata for a path and persists to IndexedDB
func (ms *MetadataStore) SetMetadata(path string, metadata FileMetadata) {
	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	ms.data[path] = metadata
	ms.dataMu.Unlock()
	ms.putDB(path, metadata)
}

// SetMode updates only the mode for a path
func (ms *MetadataStore) SetMode(path string, mode fs.FileMode) {
	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	meta, ok := ms.data[path]
	if !ok {
		meta = FileMetadata{
			Mode:  mode,
			Mtime: time.Now(),
			Atime: time.Now(),
		}
	} else {
		meta.Mode = mode
	}
	ms.data[path] = meta
	ms.dataMu.Unlock()
	ms.putDB(path, meta)
}

// SetTimes updates mtime and atime for a path
func (ms *MetadataStore) SetTimes(path string, atime, mtime time.Time) {
	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	meta, ok := ms.data[path]
	if !ok {
		meta = FileMetadata{
			Mode:  DefaultFileMode, // Will be corrected when file is accessed
			Mtime: mtime,
			Atime: atime,
		}
	} else {
		meta.Mtime = mtime
		meta.Atime = atime
	}
	ms.data[path] = meta
	ms.dataMu.Unlock()
	ms.putDB(path, meta)
}

// DeleteMetadata removes metadata for a path (used when files are deleted)
func (ms *MetadataStore) DeleteMetadata(path string) {
	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	delete(ms.data, path)
	ms.dataMu.Unlock()
	ms.deleteDB(path)
}

// RenamePrefix moves all metadata entries rooted at oldPrefix to newPrefix.
// Handles both single files and directory trees. Returns the number of entries moved.
func (ms *MetadataStore) RenamePrefix(oldPrefix, newPrefix string) int {
	type renameOp struct {
		oldPath string
		newPath string
		meta    FileMetadata
	}

	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	var ops []renameOp
	for path, meta := range ms.data {
		if path == oldPrefix || strings.HasPrefix(path, oldPrefix+"/") {
			newPath := newPrefix + strings.TrimPrefix(path, oldPrefix)
			ms.data[newPath] = meta
			delete(ms.data, path)
			ops = append(ops, renameOp{oldPath: path, newPath: newPath, meta: meta})
		}
	}
	ms.dataMu.Unlock()

	// Persist changes to IDB asynchronously
	for _, op := range ops {
		ms.putDB(op.newPath, op.meta)
		ms.deleteDB(op.oldPath)
	}

	return len(ops)
}

// DeletePrefix removes all metadata entries with the given path prefix.
// Used when removing directory trees.
func (ms *MetadataStore) DeletePrefix(prefix string) {
	ms.dataMu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	var deleted []string
	for path := range ms.data {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			delete(ms.data, path)
			deleted = append(deleted, path)
		}
	}
	ms.dataMu.Unlock()

	for _, path := range deleted {
		ms.deleteDB(path)
	}
}

// putDB persists a single metadata entry to IndexedDB
func (ms *MetadataStore) putDB(path string, meta FileMetadata) {
	if !ms.db.Truthy() {
		return
	}
	go func() {
		ms.idbMu.Lock()
		defer ms.idbMu.Unlock()
		_, err := jsutil.AwaitErr(ms.db.Call("put", path, js.ValueOf(map[string]any{
			"mode":  int64(meta.Mode),
			"mtime": meta.Mtime.Unix(),
			"atime": meta.Atime.Unix(),
		})))
		if err != nil {
			log.Println("fsa: metadata: put:", err)
		}
	}()
}

// deleteDB removes a single metadata entry from IndexedDB
func (ms *MetadataStore) deleteDB(path string) {
	if !ms.db.Truthy() {
		return
	}
	go func() {
		ms.idbMu.Lock()
		defer ms.idbMu.Unlock()
		_, err := jsutil.AwaitErr(ms.db.Call("delete", path))
		if err != nil {
			log.Println("fsa: metadata: delete:", err)
		}
	}()
}

// loadFromDisk loads all metadata from IndexedDB into the in-memory cache
func (ms *MetadataStore) loadFromDisk() error {
	if !ms.db.Truthy() {
		return nil
	}

	ms.idbMu.Lock()
	defer ms.idbMu.Unlock()

	val, err := jsutil.AwaitErr(ms.db.Call("getAll"))
	if err != nil {
		log.Println("fsa: metadata: getAll:", err)
		return nil // Non-fatal; start with empty store
	}

	if val.IsUndefined() || val.IsNull() {
		return nil
	}

	ms.dataMu.Lock()
	defer ms.dataMu.Unlock()
	for i := 0; i < val.Length(); i++ {
		entry := val.Index(i)
		path := entry.Get("path").String()
		meta := FileMetadata{
			Mode:  fs.FileMode(entry.Get("mode").Int()),
			Mtime: time.Unix(int64(entry.Get("mtime").Int()), 0),
			Atime: time.Unix(int64(entry.Get("atime").Int()), 0),
		}
		ms.data[path] = meta
	}

	return nil
}
