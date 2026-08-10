package fs

import (
	"context"
	"errors"
	"io"
	"os"
)

type OpenFileFS interface {
	FS
	OpenFile(name string, flag int, perm FileMode) (File, error)
}

type OpenFileContextFS interface {
	FS
	OpenFileContext(ctx context.Context, name string, flag int, perm FileMode) (File, error)
}

// OpenFile is a helper that opens a file with the given flag and permissions if supported.
func OpenFile(fsys FS, name string, flag int, perm FileMode) (f File, err error) {
	ctx := WithOrigin(ContextFor(fsys), fsys, name, "open")
	if flag&os.O_RDONLY != 0 {
		ctx = WithReadOnly(ctx)
	}

	if o, ok := fsys.(OpenFileContextFS); ok {
		return o.OpenFileContext(ctx, name, flag, perm)
	}

	if rfsys, rname, err := ResolveTo[OpenFileContextFS](fsys, ctx, name); err == nil {
		return rfsys.OpenFileContext(ctx, rname, flag, perm)
	}

	if o, ok := fsys.(OpenFileFS); ok {
		return o.OpenFile(name, flag, perm)
	}

	rfsys, rname, err := ResolveTo[OpenFileFS](fsys, ctx, name)
	if err == nil {
		return rfsys.OpenFile(rname, flag, perm)
	}

	// Handle write-only and read-write modes
	if flag&(os.O_WRONLY|os.O_RDWR) != 0 {
		created := false
		f, err = fsys.Open(name)
		if err != nil {
			// O_CREATE means create file if it doesn't exist
			if flag&os.O_CREATE != 0 && os.IsNotExist(err) {
				created = true
				f, err = Create(fsys, name)
				if err != nil {
					return nil, err
				}
			} else {
				return nil, err
			}
		}
		// O_TRUNC means truncate existing file
		// but if we created the file, we don't need to truncate
		if flag&os.O_TRUNC != 0 && !created {
			// Close and recreate to truncate
			f.Close()
			f, err = Create(fsys, name)
			if err != nil {
				return nil, err
			}
		}
		if perm != 0 {
			// Apply perm on the path; do NOT close-reopen the file here.
			// Reopening via fsys.Open resets the FileHandle back to
			// append=true, which silently undoes any truncate semantics we
			// just established via the O_TRUNC path above. Chmod is a
			// metadata-only operation and does not require the file to be
			// closed — perm persists across the lifetime of the file, and
			// subsequent Stats see it through the metadata store, not by
			// reopening.
			if err := Chmod(fsys, name, perm); err != nil && !errors.Is(err, ErrNotSupported) {
				return nil, err
			}
		}
		// O_APPEND means append to existing file
		if flag&os.O_APPEND != 0 {
			_, err = Seek(f, 0, io.SeekEnd)
			if err != nil {
				return nil, err
			}
		}
		return f, nil
	}
	return fsys.Open(name)
}
