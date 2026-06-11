//go:build js && wasm && fsa_no_persist

package fsa

import (
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
	data sync.Map // path -> FileMetadata
}

var metadataSingleton *MetadataStore
var metadataOnce sync.Once

// Metadata returns the global metadata store singleton
func Metadata() *MetadataStore {
	metadataOnce.Do(func() {
		metadataSingleton = &MetadataStore{}
	})
	return metadataSingleton
}

// Initialize is a no-op for the memory-only store
func (ms *MetadataStore) Initialize(opfsRoot *FS) error {
	return nil
}

// GetMetadata retrieves metadata for a path
func (ms *MetadataStore) GetMetadata(path string) (FileMetadata, bool) {
	if val, ok := ms.data.Load(path); ok {
		return val.(FileMetadata), true
	}
	return FileMetadata{}, false
}

// SetMetadata stores metadata for a path
func (ms *MetadataStore) SetMetadata(path string, metadata FileMetadata) {
	ms.data.Store(path, metadata)
}

// SetMode updates only the mode for a path
func (ms *MetadataStore) SetMode(path string, mode fs.FileMode) {
	metadata, exists := ms.GetMetadata(path)
	if !exists {
		metadata = FileMetadata{
			Mode:  mode,
			Mtime: time.Now(),
			Atime: time.Now(),
		}
	} else {
		metadata.Mode = mode
	}
	ms.SetMetadata(path, metadata)
}

// SetTimes updates mtime and atime for a path
func (ms *MetadataStore) SetTimes(path string, atime, mtime time.Time) {
	metadata, exists := ms.GetMetadata(path)
	if !exists {
		metadata = FileMetadata{
			Mode:  DefaultFileMode,
			Mtime: mtime,
			Atime: atime,
		}
	} else {
		metadata.Mtime = mtime
		metadata.Atime = atime
	}
	ms.SetMetadata(path, metadata)
}

// DeleteMetadata removes metadata for a path
func (ms *MetadataStore) DeleteMetadata(path string) {
	ms.data.Delete(path)
}
