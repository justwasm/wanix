package ocifs

import (
	"archive/tar"
	"errors"
	"fmt"
	"io"
	"path"
	"strings"

	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/memfs"
)

// FS is an OCI image filesystem assembled by applying image layers in order.
type FS struct {
	*memfs.FS
}

func New(layers []io.Reader) (*FS, error) {
	fsys := &FS{FS: memfs.New()}
	for _, layer := range layers {
		if err := fsys.Apply(layer); err != nil {
			return nil, err
		}
	}
	return fsys, nil
}

func (fsys *FS) Apply(layer io.Reader) error {
	reader := tar.NewReader(layer)
	for {
		header, err := reader.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		name, err := layerPath(header.Name)
		if err != nil {
			return err
		}
		if name == "." {
			continue
		}
		if handled, err := fsys.applyWhiteout(name); handled || err != nil {
			if err != nil {
				return err
			}
			continue
		}
		if err := fsys.applyEntry(reader, header, name); err != nil {
			return err
		}
	}
}

func layerPath(name string) (string, error) {
	name = strings.TrimPrefix(path.Clean("/"+name), "/")
	if name == "" {
		return ".", nil
	}
	if !fs.ValidPath(name) {
		return "", fmt.Errorf("invalid OCI layer path %q", name)
	}
	return name, nil
}

func (fsys *FS) applyWhiteout(name string) (bool, error) {
	base := path.Base(name)
	parent := path.Dir(name)
	if base == ".wh..wh..opq" {
		entries, err := fs.ReadDir(fsys, parent)
		if err != nil && err != fs.ErrNotExist {
			return true, err
		}
		for _, entry := range entries {
			if err := fs.RemoveAll(fsys, path.Join(parent, entry.Name())); err != nil {
				return true, err
			}
		}
		return true, nil
	}
	if !strings.HasPrefix(base, ".wh.") {
		return false, nil
	}
	err := fs.RemoveAll(fsys, path.Join(parent, strings.TrimPrefix(base, ".wh.")))
	if err == fs.ErrNotExist {
		err = nil
	}
	return true, err
}

func (fsys *FS) applyEntry(reader io.Reader, header *tar.Header, name string) error {
	if err := fs.MkdirAll(fsys, path.Dir(name), 0755); err != nil {
		return err
	}
	switch header.Typeflag {
	case tar.TypeDir:
		if _, err := fs.Stat(fsys, name); err == nil {
			return fs.Chmod(fsys, name, fs.FileMode(header.Mode).Perm())
		}
		return fs.Mkdir(fsys, name, fs.FileMode(header.Mode).Perm())
	case tar.TypeReg, tar.TypeRegA:
		if err := removeIfExists(fsys, name); err != nil {
			return err
		}
		file, err := fs.OpenFile(fsys, name, 0x1|0x40|0x200, fs.FileMode(header.Mode).Perm())
		if err != nil {
			return err
		}
		writer, ok := file.(io.Writer)
		if !ok {
			_ = file.Close()
			return fmt.Errorf("OCI layer file %q is not writable", name)
		}
		_, copyErr := io.Copy(writer, reader)
		closeErr := file.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	case tar.TypeSymlink:
		if err := removeIfExists(fsys, name); err != nil {
			return err
		}
		return fs.Symlink(fsys, header.Linkname, name)
	default:
		return nil
	}
}

func removeIfExists(fsys fs.FS, name string) error {
	err := fs.RemoveAll(fsys, name)
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	return err
}
