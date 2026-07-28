//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"os"
	"sync"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	opts := api.BuildOptions{
		Bundle:   true,
		Write:    true,
		Format:   api.FormatESModule,
		External: []string{"util"},
		LogLevel: api.LogLevelInfo,
	}

	var wg sync.WaitGroup

	handleOpts := opts
	handleOpts.EntryPoints = []string{"api/handle.js"}
	handleOpts.Outfile = "dist/wanix.handle.js"
	wg.Add(1)
	go func() {
		defer wg.Done()
		build(handleOpts)
	}()

	wanixOpts := opts
	wanixOpts.EntryPoints = []string{"index.ts"}
	wanixOpts.Outfile = "dist/wanix.js"
	wanixOpts.Loader = map[string]api.Loader{
		".go.js":     api.LoaderText,
		".tinygo.js": api.LoaderText,
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		build(wanixOpts)
	}()

	wanixMinOpts := wanixOpts
	wanixMinOpts.Outfile = "dist/wanix.min.js"
	wanixMinOpts.MinifyWhitespace = true
	wanixMinOpts.MinifyIdentifiers = true
	wanixMinOpts.MinifySyntax = true
	wg.Add(1)
	go func() {
		defer wg.Done()
		build(wanixMinOpts)
	}()

	wasiOpts := api.BuildOptions{
		Bundle:   true,
		Write:    true,
		Format:   api.FormatESModule,
		External: []string{"util"},
		LogLevel: api.LogLevelInfo,
		EntryPoints: []string{"wasi/mod.ts"},
		Outfile: "wasi/worker/lib.js",
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		build(wasiOpts)
	}()

	gojsOpts := api.BuildOptions{
		Bundle:   true,
		Write:    true,
		Format:   api.FormatESModule,
		External: []string{"util"},
		LogLevel: api.LogLevelInfo,
		EntryPoints: []string{"gojs/mod.ts"},
		Outfile: "gojs/worker/lib.js",
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		build(gojsOpts)
	}()

	wg.Wait()
	fmt.Println("js build complete")
}

func build(opts api.BuildOptions) {
	ctx, ctxErr := api.Context(opts)
	if ctxErr != nil {
		fmt.Fprintf(os.Stderr, "%v\n", ctxErr)
		os.Exit(1)
	}
	result := ctx.Rebuild()
	ctx.Dispose()
	if len(result.Errors) > 0 {
		for _, e := range result.Errors {
			fmt.Fprintln(os.Stderr, e.Text)
		}
		os.Exit(1)
	}
}
