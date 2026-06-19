package term

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"

	"tractor.dev/wanix"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
	"tractor.dev/wanix/fs/pipe"
	"tractor.dev/wanix/fs/signal"
)

type Device struct {
	mu        sync.RWMutex
	resources map[string]fs.FS
	nextID    int
	root      *wanix.Task
}

func New(root *wanix.Task) *Device {
	return &Device{
		resources: make(map[string]fs.FS),
		nextID:    0,
		root:      root,
	}
}

func (d *Device) Open(name string) (fs.File, error) {
	return d.OpenContext(context.Background(), name)
}

func (d *Device) OpenContext(ctx context.Context, name string) (fs.File, error) {
	fsys, rname, err := d.ResolveFS(ctx, name)
	if err != nil {
		return nil, err
	}
	return fs.OpenContext(ctx, fsys, rname)
}

func (d *Device) Stat(name string) (fs.FileInfo, error) {
	return d.StatContext(context.Background(), name)
}

func (d *Device) StatContext(ctx context.Context, name string) (fs.FileInfo, error) {
	fsys, rname, err := d.ResolveFS(ctx, name)
	if err != nil {
		return nil, err
	}
	return fs.StatContext(ctx, fsys, rname)
}

func (d *Device) ResolveFS(ctx context.Context, name string) (fs.FS, string, error) {
	return fs.Resolve(fskit.UnionFS{
		fskit.MapFS{
			"new": fskit.OpenFunc(func(ctx context.Context, name string) (fs.File, error) {
				return &fskit.FuncFile{
					Node: fskit.Entry(name, 0555),
					ReadFunc: func(n *fskit.Node) error {
						// parse optional initial dimensions from path:
						//   #term/new            → no initial value
						//   #term/new/cols/rows/xpixel/ypixel → seed winch
						var initData []byte
						if name != "." {
							parts := strings.SplitN(name, "/", 4)
							if len(parts) == 4 {
								initData = []byte(fmt.Sprintf("%s %s %s %s\n", parts[0], parts[1], parts[2], parts[3]))
							}
						}
						rid, err := d.Alloc(initData)
						if err != nil {
							return err
						}
						fskit.SetData(n, []byte(rid+"\n"))
						return nil
					},
				}, nil
			}),
		},
		fskit.MapFS(d.resources),
	}, ctx, name)
}

func (d *Device) Get(rid string) (*Resource, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()
	res, ok := d.resources[rid]
	if !ok {
		return nil, fs.ErrNotExist
	}
	return res.(*Resource), nil
}

func (d *Device) Alloc(initData ...[]byte) (rid string, err error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	// force xterm css to load if not already
	loadXtermCSS()

	d.nextID++
	rid = strconv.Itoa(d.nextID)
	hub := signal.NewBroadcaster()
	if len(initData) > 0 && len(initData[0]) > 0 {
		hub.Broadcast(initData[0], signal.NoExclude)
	}
	_, dataPF, progPF := pipe.NewFS(true)
	// remove := func() {
	// 	d.remove(rid)
	// }
	progWrap := &programFile{PortFile: progPF}
	root := fskit.MapFS{
		"id":      fskit.RawNode([]byte(rid+"\n"), 0555),
		"data":    fskit.FileFS(dataPF, "data"),
		"program": fskit.FileFS(progWrap, "program"),
		"winch":   signal.NewFS(hub),
	}
	d.resources[rid] = &Resource{
		id:    rid,
		MapFS: root,
		hub:   hub,
		end:   progPF.Port,
	}
	return rid, nil
}

func (d *Device) remove(rid string) {
	d.mu.Lock()
	res, err := d.Get(rid)
	if err != nil {
		d.mu.Unlock()
		return
	}
	delete(d.resources, rid)
	d.mu.Unlock()
	res.shutdown()
}
