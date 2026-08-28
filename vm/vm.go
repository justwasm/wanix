package vm

import (
	"context"
	"log"
	"strings"
	"sync"

	"tractor.dev/toolkit-go/engine/cli"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
	"tractor.dev/wanix/fs/vfs"
	"tractor.dev/wanix/misc"
)

type VM struct {
	id     string
	alias  string
	kind   string
	guest  fs.FS
	device *Device
	mu     sync.Mutex
	vfs    *vfs.NS
}

func (r *VM) ID() string {
	return r.id
}

func (r *VM) Alias() string {
	return r.alias
}

func (r *VM) Kind() string {
	return r.kind
}

func (r *VM) Guest() fs.FS {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.guest
}

func (r *VM) SetGuest(exported fs.FS) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.vfs == nil {
		panic("vfs not initialized before setting guest")
	}
	r.guest = exported
	go func() {
		if err := r.vfs.Bind(r.guest, ".", "guest"); err != nil {
			log.Println("error binding guest", err)
		}
	}()
	return nil
}

func (r *VM) Open(name string) (fs.File, error) {
	return r.OpenContext(context.Background(), name)
}

// root returns the VM's own namespace (the control/id/alias field files
// bound at "."), created lazily like OpenContext does. Route hands Walk
// this namespace so typed operations on #vm/<id>/<file> (chmod,
// writeFile, ...) resolve to the target node instead of failing at the
// VM resource itself.
func (r *VM) root() (*vfs.NS, error) {
	base := r.baseFS()
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.vfs == nil {
		r.vfs = vfs.New(context.Background())
		if err := r.vfs.Bind(base, ".", "."); err != nil {
			return nil, err
		}
	}
	return r.vfs, nil
}

// Route implements fs.RouteFS; see root.
func (r *VM) Route(ctx context.Context, name string) (fs.FS, string, error) {
	vfsys, err := r.root()
	if err != nil {
		return nil, "", err
	}
	return vfsys, name, nil
}

func (r *VM) baseFS() fskit.MapFS {
	return fskit.MapFS{
		"ctl": misc.ControlFile(&cli.Command{
			Usage: "ctl",
			Short: "control the resource",
			Run: func(_ *cli.Context, args []string) {
				switch args[0] {
				case "start":
					// todo: check if already started
					// options, err := parseFlags(args[1:])
					// if err != nil {
					// 	log.Println("vm start:", err)
					// 	return
					// }
					// serialport, screenport, shmpipe := makeVM(r.ID(), options, false)
					// r.screenport = screenport
					// r.shmpipe = shmpipe
					// r.serial = newSerialReadWriter(serialport)
					// if err := TryPatch(ctx, r.serial, serialFile); err != nil {
					// 	log.Println("vm start:", err)
					// }
					// fsys, _, ok := fs.Origin(ctx)
					// if ok {
					// 	cachedfs := metacache.New(fsys)
					// 	srv := p9.NewServer(p9kit.Attacher(cachedfs, p9kit.WithMemAttrStore()), p9.WithServerLogger(ulog.Log))
					// 	log.Println("starting 9p server for shmpipe")
					// 	go srv.Handle(shmpipe, shmpipe)
					// }
				}
			},
		}),
		"id":   misc.FieldFile(r.ID()),
		"kind": misc.FieldFile(r.Kind()),
		"alias": misc.FieldFile(r.alias, func(in []byte) error {
			if len(in) > 0 {
				oldalias := r.alias
				r.alias = strings.TrimSpace(string(in))
				r.device.mu.Lock()
				if oldalias != "" {
					delete(r.device.aliases, oldalias)
				}
				r.device.aliases[r.alias] = r
				r.device.mu.Unlock()
			}
			return nil
		}),
	}
}

func (r *VM) OpenContext(ctx context.Context, name string) (fs.File, error) {
	vfsys, err := r.root()
	if err != nil {
		return nil, err
	}
	// if r.serial != nil {
	// 	fsys["ttyS0"] = fskit.FileFS(serialFile, "ttyS0")
	// }
	// if r.shmpipe != nil {
	// 	fsys["shmpipe0"] = fskit.FileFS(shmpipeFile, "shmpipe0")
	// }
	return fs.OpenContext(ctx, vfsys, name)
}
