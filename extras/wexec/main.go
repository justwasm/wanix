package main

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

func debug(format string, a ...any) {
	if os.Getenv("DEBUG") == "1" {
		log.Printf(format+"\n", a...)
	}
}

func main() {
	log.SetFlags(log.Lshortfile)
	if len(os.Args) < 2 {
		log.Fatal("usage: wexec <wasm> [args...]")
	}

	// fake /env program to print environment for debugging
	if os.Args[1] == "/env" {
		fmt.Println(os.Environ())
		fmt.Println("---")
		for _, env := range os.Environ() {
			fmt.Println(">", env)
		}
		fmt.Println("---")
		fmt.Println(strings.Join(append(os.Environ(), ""), "\n"))
		os.Exit(0)
	}

	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	args := os.Args[1:]
	// A WASM module starts with the \0asm magic; anything else is a
	// JavaScript task source. wexec runs both through the task driver.
	taskKind := "wasi"
	if program, readErr := os.ReadFile(args[0]); readErr == nil && !bytes.HasPrefix(program, []byte{'\x00', 'a', 's', 'm'}) {
		taskKind = "js"
	}
	if taskKind == "js" {
		args[0] = strings.TrimPrefix(filepath.Join(wd, args[0]), "/")
	} else {
		args[0] = strings.TrimPrefix(filepath.Join("vm/1/fsys", wd, args[0]), "/")
	}

	debug("allocating pid")
	pidRaw, err := os.ReadFile("/task/new/" + taskKind)
	if err != nil {
		log.Fatal(err)
	}
	pid := strings.TrimSpace(string(pidRaw))
	stdoutPath := fmt.Sprintf("/task/%s/fd/1", pid)
	stderrPath := fmt.Sprintf("/task/%s/fd/2", pid)
	if taskKind == "js" {
		// JS workers expose their captured output through WEXEC_STDOUT /
		// WEXEC_STDERR files instead of task fds; create them up front so
		// the worker never races a missing path.
		stdoutPath = fmt.Sprintf("/tmp/.wexec-%s.out", pid)
		stderrPath = fmt.Sprintf("/tmp/.wexec-%s.err", pid)
		for _, name := range []string{stdoutPath, stderrPath} {
			f, createErr := os.Create(name)
			if createErr != nil {
				log.Fatal(createErr)
			}
			f.Close()
		}
	}

	debug("writing cmd")
	if err := appendFile(fmt.Sprintf("/task/%s/cmd", pid), []byte(strings.Join(args, " "))); err != nil {
		log.Fatal(err)
	}

	debug("writing env")
	env := strings.Join(append(os.Environ(), ""), "\n")
	if taskKind == "js" {
		hostPath := func(name string) string {
			return strings.TrimPrefix(filepath.Join(wd, name), "/")
		}
		env += "WEXEC_STDOUT=" + hostPath(stdoutPath) + "\n"
		env += "WEXEC_STDERR=" + hostPath(stderrPath) + "\n"
	}
	if err := appendFile(fmt.Sprintf("/task/%s/env", pid), []byte(env)); err != nil {
		log.Fatal(err)
	}

	if taskKind == "js" {
		// Terminating a JS task kills the worker without a shell exit code;
		// record the conventional 130 so the caller observes the signal.
		signals := make(chan os.Signal, 1)
		signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-signals
			_ = appendFile(fmt.Sprintf("/task/%s/exit", pid), []byte("130"))
		}()
	}

	var done atomic.Int32
	var wg sync.WaitGroup
	if taskKind == "js" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			pollJSOutput(stdoutPath, stderrPath, &done)
		}()
	} else {
		wg.Add(2)
		go func() {
			defer wg.Done()
			copyOutput(stdoutPath, os.Stdout, &done, false)
		}()
		go func() {
			defer wg.Done()
			copyOutput(stderrPath, os.Stderr, &done, false)
		}()
	}

	debug("starting")
	if err := appendFile(fmt.Sprintf("/task/%s/ctl", pid), []byte("start")); err != nil {
		log.Fatal(err)
	}

	debug("waiting for exit")
	for {
		b, err := readLiveFile(fmt.Sprintf("/task/%s/exit", pid))
		if err != nil {
			log.Fatal(err)
		}
		out := strings.TrimSpace(string(b))
		if out != "" {
			debug("exit code: %s", out)
			code, err := strconv.Atoi(out)
			if err != nil {
				log.Fatal(err)
			}
			done.Store(1)
			debug("waiting for threads to finish")
			wg.Wait()
			debug("exiting with code %d", code)
			os.Exit(code)
		}
		time.Sleep(100 * time.Millisecond)
	}
}

// pollJSOutput drains the WEXEC_STDOUT/WEXEC_STDERR capture files until the
// task exits, skipping non-monotonic rewinds (live-read semantics).
func pollJSOutput(stdoutPath, stderrPath string, done *atomic.Int32) {
	stdoutOffset, stderrOffset := 0, 0
	for done.Load() == 0 {
		pollJSFile(stdoutPath, os.Stdout, &stdoutOffset)
		pollJSFile(stderrPath, os.Stderr, &stderrOffset)
		time.Sleep(250 * time.Millisecond)
	}
}

func pollJSFile(path string, dst io.Writer, offset *int) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, syscall.ENODATA) || errors.Is(err, syscall.EAGAIN) {
			return
		}
		log.Fatal(err)
	}
	if len(data) > *offset {
		dst.Write(data[*offset:])
		*offset = len(data)
	}
}

// readLiveFile reads a file that may still be written by a live process,
// returning whatever is currently available instead of failing on EOF or
// requiring a complete snapshot.
func readLiveFile(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	buf := make([]byte, 4096)
	out := make([]byte, 0, 4096)
	for {
		n, readErr := f.Read(buf)
		if n > 0 {
			out = append(out, buf[:n]...)
		}
		if readErr == io.EOF {
			return out, nil
		}
		if readErr != nil {
			return nil, readErr
		}
		if n == 0 {
			return out, nil
		}
	}
}

func copyOutput(path string, dst io.Writer, done *atomic.Int32, reopen bool) {
	buf := make([]byte, 4096)
	if reopen {
		offset := 0
		for {
			data, err := os.ReadFile(path)
			if err != nil {
				if errors.Is(err, syscall.ENODATA) || errors.Is(err, syscall.EAGAIN) {
					time.Sleep(30 * time.Millisecond)
					continue
				}
				log.Fatal(err)
			}
			if len(data) > offset {
				dst.Write(data[offset:])
				offset = len(data)
			}
			if done.Load() == 1 && len(data) == offset {
				return
			}
			time.Sleep(30 * time.Millisecond)
		}
	}
	stream, err := os.Open(path)
	if err != nil {
		log.Fatal(err)
	}
	defer stream.Close()
	for {
		n, err := stream.Read(buf)
		if err != nil && err != io.EOF {
			log.Fatal(err)
		}
		if done.Load() == 1 && n == 0 {
			return
		}
		dst.Write(buf[:n])
		time.Sleep(30 * time.Millisecond)
	}
}

func appendFile(path string, data []byte) error {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(data)
	return err
}
