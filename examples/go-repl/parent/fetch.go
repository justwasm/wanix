package main

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// readCacheOrFetch returns the local path to a cached copy of url,
// downloading it to /fetchcache/ on first access.
func readCacheOrFetch(url string) (string, error) {
	name := url
	if idx := strings.LastIndex(url, "/"); idx >= 0 {
		name = url[idx+1:]
	}
	if name == "" {
		name = "fetch"
	}

	cacheDir := "/fetchcache"
	cachePath := filepath.Join(cacheDir, name)

	if _, err := os.Stat(cachePath); err == nil {
		return cachePath, nil
	}

	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return "", err
	}

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("http %s", resp.Status)
	}

	f, err := os.Create(cachePath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, resp.Body); err != nil {
		return "", err
	}

	return cachePath, nil
}

// ExtractTarGz extracts a local .tar.gz file into dst.
func ExtractTarGz(tgzPath, dst string) error {
	st, err := os.Stat(dst)
	switch {
	case os.IsNotExist(err):
		if err := os.MkdirAll(dst, 0755); err != nil {
			return err
		}
	case err != nil:
		return err
	case !st.IsDir():
		return fmt.Errorf("%q is not a directory", dst)
	}

	f, err := os.Open(tgzPath)
	if err != nil {
		return err
	}
	defer f.Close()

	gzr, err := gzip.NewReader(f)
	if err != nil {
		return err
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)

	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		name := filepath.Clean(hdr.Name)

		if name == ".." || strings.HasPrefix(name, ".."+string(os.PathSeparator)) {
			return fmt.Errorf("invalid tar path: %q", hdr.Name)
		}

		target := filepath.Join(dst, name)
		fmt.Println(target)

		switch hdr.Typeflag {

		case tar.TypeDir:
			if err := os.MkdirAll(target, os.FileMode(hdr.Mode)); err != nil {
				return err
			}

		case tar.TypeReg, tar.TypeRegA:
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}

			cf, err := os.OpenFile(
				target,
				os.O_CREATE|os.O_WRONLY|os.O_TRUNC,
				os.FileMode(hdr.Mode),
			)
			if err != nil {
				return err
			}

			_, copyErr := io.Copy(cf, tr)
			closeErr := cf.Close()

			if copyErr != nil {
				return copyErr
			}
			if closeErr != nil {
				return closeErr
			}
			_ = os.Chtimes(target, time.Now(), hdr.ModTime)

		case tar.TypeSymlink:
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}

			_ = os.Remove(target)

			if err := os.Symlink(hdr.Linkname, target); err != nil {
				return err
			}

		case tar.TypeLink:
			linkTarget := filepath.Join(dst, filepath.Clean(hdr.Linkname))

			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}

			_ = os.Remove(target)

			if err := os.Link(linkTarget, target); err != nil {
				return err
			}

		default:
			// 忽略 fifo、char device、block device 等特殊文件
		}
	}
}

// FetchTo downloads a .tar.gz URL and extracts it into dst.
// Uses readCacheOrFetch internally so repeated calls with the
// same URL skip re-downloading.
func FetchTo(tgzURL, dst string) error {
	cached, err := readCacheOrFetch(tgzURL)
	if err != nil {
		return err
	}
	return ExtractTarGz(cached, dst)
}
