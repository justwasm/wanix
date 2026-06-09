// build-bubbletea compiles a Bubbletea Go package to wasm, injecting
// js/wasm stubs into Bubbletea v2 at build time.
//
// Usage:
//
//	go run ./tools/build-bubbletea -o app.wasm ./cmd/myapp/
package main

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
)

//go:embed all:stubs
var stubsFS embed.FS

type modulePatch struct {
	modulePath string
	stubDir    string
}

var patches = []modulePatch{
	{modulePath: "charm.land/bubbletea/v2", stubDir: "stubs/bubbletea"},
	{modulePath: "github.com/atotto/clipboard", stubDir: "stubs/clipboard"},
}

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: build-bubbletea [go build flags] <packages>")
		os.Exit(2)
	}
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "build-bubbletea: %v\n", err)
		os.Exit(1)
	}
}

func run(buildArgs []string) error {
	// Ensure dependencies are downloaded
	download := exec.Command("go", "mod", "download")
	download.Stderr = os.Stderr
	if err := download.Run(); err != nil {
		return fmt.Errorf("go mod download: %w", err)
	}

	tmpDir, err := os.MkdirTemp("", "build-bubbletea-*")
	if err != nil {
		return fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	origModPath, err := goEnv("GOMOD")
	if err != nil {
		return fmt.Errorf("locate go.mod: %w", err)
	}
	if origModPath == "" || origModPath == os.DevNull {
		return errors.New("no go.mod found")
	}

	tmpMod := filepath.Join(tmpDir, "go.mod")
	if err := copyFile(origModPath, tmpMod); err != nil {
		return fmt.Errorf("copy go.mod: %w", err)
	}
	origSum := filepath.Join(filepath.Dir(origModPath), "go.sum")
	if _, err := os.Stat(origSum); err == nil {
		if err := copyFile(origSum, filepath.Join(tmpDir, "go.sum")); err != nil {
			return fmt.Errorf("copy go.sum: %w", err)
		}
	}

	for _, p := range patches {
		srcDir, err := findModuleDir(p.modulePath)
		if err != nil {
			return fmt.Errorf("locate %s: %w", p.modulePath, err)
		}

		dstDir := filepath.Join(tmpDir, p.stubDir)
		if err := copyTree(srcDir, dstDir); err != nil {
			return fmt.Errorf("copy %s: %w", p.modulePath, err)
		}

		if err := writeStubs(stubsFS, p.stubDir, dstDir); err != nil {
			return fmt.Errorf("write stubs for %s: %w", p.modulePath, err)
		}

		// Bump go version for modern features
		dstMod := filepath.Join(dstDir, "go.mod")
		bumpCmd := exec.Command("go", "mod", "edit", "-modfile="+dstMod, "-go=1.25")
		bumpCmd.Stderr = os.Stderr
		if err := bumpCmd.Run(); err != nil {
			return fmt.Errorf("bump go version for %s: %w", p.modulePath, err)
		}

		editCmd := exec.Command("go", "mod", "edit",
			"-modfile="+tmpMod,
			"-replace="+p.modulePath+"="+dstDir)
		editCmd.Stderr = os.Stderr
		if err := editCmd.Run(); err != nil {
			return fmt.Errorf("add replace for %s: %w", p.modulePath, err)
		}
	}

	args := append([]string{"build", "-modfile=" + tmpMod}, buildArgs...)
	cmd := exec.Command("go", args...)
	cmd.Env = append(os.Environ(), "GOOS=js", "GOARCH=wasm")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func writeStubs(fsys embed.FS, stubDir, dstDir string) error {
	return fs.WalkDir(fsys, stubDir, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		data, err := fsys.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(filepath.Join(dstDir, filepath.Base(path)), data, 0644)
	})
}

func findModuleDir(path string) (string, error) {
	var info struct{ Dir string }
	if out, err := exec.Command("go", "list", "-m", "-json", path).Output(); err == nil {
		if json.Unmarshal(out, &info) == nil && info.Dir != "" {
			return info.Dir, nil
		}
	}
	out, err := exec.Command("go", "mod", "download", "-json", path+"@latest").Output()
	if err != nil {
		return "", fmt.Errorf("fetch %s: %w", path, err)
	}
	if json.Unmarshal(out, &info); info.Dir == "" {
		return "", fmt.Errorf("module %s not found in cache", path)
	}
	return info.Dir, nil
}

func goEnv(name string) (string, error) {
	out, err := exec.Command("go", "env", name).Output()
	if err != nil {
		return "", err
	}
	s := string(out)
	if n := len(s); n > 0 && s[n-1] == '\n' {
		s = s[:n-1]
	}
	return s, nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func copyTree(src, dst string) error {
	return fs.WalkDir(os.DirFS(src), ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		dstPath := filepath.Join(dst, path)
		if d.IsDir() {
			return os.MkdirAll(dstPath, 0755)
		}
		return copyFile(filepath.Join(src, path), dstPath)
	})
}
