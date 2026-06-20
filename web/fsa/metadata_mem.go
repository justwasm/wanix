//go:build js && wasm && fsa_no_persist

package fsa

import (
	"strings"
	"sync"
	"time"

	"tractor.dev/wanix/fs"
)

// FileMetadata represents stored metadata for a file
type FileMetadata struct {
	Mode  fs.FileMode
	Mtime time.Time
	Atime time.Time
}

// MetadataStore manages file metadata in memory only (no persistence)
type MetadataStore struct {
	mu   sync.RWMutex
	data map[string]FileMetadata
}

var metadataSingleton *MetadataStore
var metadataOnce sync.Once

// Metadata returns the global metadata store singleton
func Metadata() *MetadataStore {
	metadataOnce.Do(func() {
		metadataSingleton = &MetadataStore{
			data: make(map[string]FileMetadata),
		}
	})
	return metadataSingleton
}

// Initialize is a no-op for the memory-only store
func (ms *MetadataStore) Initialize(opfsRoot *FS) error {
	return nil
}

// GetMetadata retrieves metadata for a path
func (ms *MetadataStore) GetMetadata(path string) (FileMetadata, bool) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()
	if ms.data == nil {
		return FileMetadata{}, false
	}
	meta, ok := ms.data[path]
	return meta, ok
}

// SetMetadata stores metadata for a path
func (ms *MetadataStore) SetMetadata(path string, metadata FileMetadata) {
	ms.mu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	ms.data[path] = metadata
	ms.mu.Unlock()
}

// SetMode updates only the mode for a path
func (ms *MetadataStore) SetMode(path string, mode fs.FileMode) {
	ms.mu.Lock()
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
	ms.mu.Unlock()
}

// SetTimes updates mtime and atime for a path
func (ms *MetadataStore) SetTimes(path string, atime, mtime time.Time) {
	ms.mu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	meta, ok := ms.data[path]
	if !ok {
		meta = FileMetadata{
			Mode:  DefaultFileMode,
			Mtime: mtime,
			Atime: atime,
		}
	} else {
		meta.Mtime = mtime
		meta.Atime = atime
	}
	ms.data[path] = meta
	ms.mu.Unlock()
}

// DeleteMetadata removes metadata for a path
func (ms *MetadataStore) DeleteMetadata(path string) {
	ms.mu.Lock()
	if ms.data == nil {
		ms.data = make(map[string]FileMetadata)
	}
	delete(ms.data, path)
	ms.mu.Unlock()
}

// RenamePrefix moves all metadata entries rooted at oldPrefix to newPrefix.
// Returns the number of entries moved.
func (ms *MetadataStore) RenamePrefix(oldPrefix, newPrefix string) int {
	ms.mu.Lock()
	defer ms.mu.Unlock()
	count := 0
	for path, meta := range ms.data {
		if path == oldPrefix || strings.HasPrefix(path, oldPrefix+"/") {
			newPath := newPrefix + strings.TrimPrefix(path, oldPrefix)
			ms.data[newPath] = meta
			delete(ms.data, path)
			count++
		}
	}
	return count
}

// DeletePrefix removes all metadata entries with the given path prefix.
func (ms *MetadataStore) DeletePrefix(prefix string) {
	ms.mu.Lock()
	defer ms.mu.Unlock()
	for path := range ms.data {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			delete(ms.data, path)
		}
	}
}
