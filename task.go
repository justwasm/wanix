package wanix

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"strconv"
	"strings"
	"sync"

	"tractor.dev/toolkit-go/engine/cli"
	"tractor.dev/wanix/fs"
	"tractor.dev/wanix/fs/fskit"
	"tractor.dev/wanix/fs/vfs"
	"tractor.dev/wanix/misc"
	"tractor.dev/wanix/misc/shlex"
)

// contextKey is a value for use with context.WithValue. It's used as
// a pointer so it fits in an interface{} without allocation.
type contextKey struct {
	name string
}

func (k *contextKey) String() string { return "task context value " + k.name }

var (
	TaskContextKey = &contextKey{"task"}
)

func FromContext(ctx context.Context) (*Task, bool) {
	p, ok := ctx.Value(TaskContextKey).(*Task)
	return p, ok
}

type TaskDriver interface {
	Check(*Task) bool
	Start(*Task) error
}

type Task struct {
	driver TaskDriver
	parent *Task
	ns     *vfs.NS
	id     int
	alias  string
	kind   string
	cmd    string
	args   []string
	env    []string
	exit   string
	dir    string
	fds    map[int]*openFile
	fdIdx  int
	closer func()
	fsys   *TaskFS
	worker any
	export fs.FS
	mu     sync.Mutex
}

func Export(t *Task, export fs.FS) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.export = export
}

func SetWorker(t *Task, worker any) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.worker = worker
}

// SetCloser registers cleanup that runs after a task exits or is terminated.
func SetCloser(t *Task, fn func()) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.closer = fn
}

func GetWorker(t *Task) any {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.worker
}

type openFile struct {
	file fs.File
	path string
	// more?
}

// NewRoot returns a task, so we dont really have the TaskFS
// in the public API. For now we have a couple methods that normally
// make more sense on TaskFS, but are on Task.

func (t *Task) Lookup(rid string) (*Task, error) {
	return t.fsys.Lookup(rid)
}

func (t *TaskFS) Lookup(rid string) (*Task, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	tt, ok := t.resources[rid]
	if !ok {
		return nil, fs.ErrNotExist
	}
	return tt.(*Task), nil
}

func (t *Task) Tasks() (tasks []*Task) {
	t.fsys.mu.Lock()
	defer t.fsys.mu.Unlock()
	for _, tt := range t.fsys.resources {
		tasks = append(tasks, tt.(*Task))
	}
	return tasks
}

// kludge: this would imply task specific registration, but its global.
// this is until we have a better registration system.
func (t *Task) Register(kind string, driver TaskDriver) {
	t.fsys.types[kind] = driver
}

// Alloc creates a child task in this task's namespace.
func (t *Task) Alloc(kind string) (*Task, error) {
	return t.fsys.Alloc(kind, t)
}

func (t *Task) Start() error {
	if t.driver != nil {
		return t.driver.Start(t)
	}
	return nil
}

func (r *Task) ID() string {
	return strconv.Itoa(r.id)
}

func (r *Task) Context() context.Context {
	return r.NS().Context()
}

func (r *Task) Export() (fs.FS, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.export == nil {
		return nil, fs.ErrNotExist
	}
	return r.export, nil
}

func (r *Task) NS() *vfs.NS {
	return r.ns
}

func (r *Task) Parent() *Task {
	return r.parent
}

func (r *Task) Root() *Task {
	if r.parent == nil {
		return r
	}
	return r.parent.Root()
}

func (r *Task) Cmd() string {
	return r.cmd
}

func (r *Task) Arg(idx int) string {
	if idx < 0 || idx >= len(r.args) {
		return ""
	}
	return r.args[idx]
}

// Args returns a copy of the parsed command arguments.
func (r *Task) Args() []string {
	return append([]string(nil), r.args...)
}

func (r *Task) Env() []string {
	return r.env
}

func (r *Task) Alias() string {
	return r.alias
}

func (r *Task) Dir() string {
	return r.dir
}

func (r *Task) Bind(srcPath, dstPath string, opts ...fs.BindOption) error {
	return r.ns.Bind(r.ns, srcPath, dstPath, opts...)
}

func (r *Task) Unbind(srcPath, dstPath string) error {
	return r.ns.Unbind(r.ns, srcPath, dstPath)
}

func (r *Task) OpenFD(file fs.File, path string) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.fdIdx++
	r.fds[r.fdIdx] = &openFile{file: file, path: path}
	return r.fdIdx
}

// SetFD installs a file at an explicit descriptor number. Spawn uses this to
// give child tasks their standard streams without depending on a global table.
func (r *Task) SetFD(fd int, file fs.File, path string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.fds[fd] = &openFile{file: file, path: path}
	if fd > r.fdIdx {
		r.fdIdx = fd
	}
}

func (r *Task) CloseFD(fd int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if fd < 0 || fd > r.fdIdx {
		return fs.ErrInvalid
	}
	f, ok := r.fds[fd]
	if !ok {
		return fs.ErrInvalid
	}
	delete(r.fds, fd)
	return f.file.Close()
}

func (r *Task) FD(fd int) (fs.File, string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if fd < 0 || fd > r.fdIdx {
		return nil, "", fs.ErrInvalid
	}
	if fd < 3 {
		if existing, ok := r.fds[fd]; ok {
			return existing.file, existing.path, nil
		}
		if file, path, err := r.VFSOpen(fd); err == nil {
			return file, path, nil
		}
		r.fds[fd] = &openFile{file: &nullFile{}, path: "/dev/null"}
		return r.fds[fd].file, r.fds[fd].path, nil
	}
	if existing, ok := r.fds[fd]; ok {
		return existing.file, existing.path, nil
	}
	return nil, "", fs.ErrInvalid
}

func (r *Task) Open(name string) (fs.File, error) {
	return r.OpenContext(context.Background(), name)
}

func (r *Task) taskMap() fskit.MapFS {
	m := fskit.MapFS{
		"ctl": misc.ControlFile(&cli.Command{
			Usage: "ctl",
			Short: "control the Task",
			Run: func(ctx *cli.Context, args []string) {
				// todo: cause fs error on error!
				if len(args) >= 3 && args[0] == "bind" {
					var (
						optstr string
					)
					flags := flag.NewFlagSet("bind", flag.ContinueOnError)
					flags.StringVar(&optstr, "o", "", "optional string flag")
					if err := flags.Parse(args[1:]); err != nil {
						log.Println(err)
						return
					}
					var opts []fs.BindOption
					for _, opt := range strings.Split(optstr, ",") {
						opts = append(opts, fs.BindOption(opt))
					}

					if err := r.Bind(flags.Arg(0), flags.Arg(1), opts...); err != nil {
						log.Println(err)
					}
					return
				}
				if len(args) == 3 && args[0] == "unbind" {
					if err := r.Unbind(args[1], args[2]); err != nil {
						log.Println(err)
					}
					return
				}
				if len(args) == 1 && args[0] == "start" {
					if err := r.Start(); err != nil {
						log.Println(err)
					}
					return
				}
				if len(args) == 1 && args[0] == "terminate" {
					Terminate(r)
					return
				}
			},
		}),
		"id":   misc.FieldFile(r.ID()),
		"kind": misc.FieldFile(r.kind),
		// Use JSON rather than a newline-delimited list. Arguments such as
		// `go list -f` format strings legitimately contain newlines, which
		// must remain part of one argv entry.
		"args": misc.FieldFile(encodeTaskArgs(r.args)),
		"cmd": misc.FieldFile(r.cmd, func(in []byte) error {
			if len(in) > 0 {
				r.cmd = strings.TrimSpace(string(in))
				args, err := shlex.Split(r.cmd, true)
				if err != nil {
					return err
				}
				r.args = args
			}
			return nil
		}),
		"alias": misc.FieldFile(r.alias, func(in []byte) error {
			if len(in) > 0 {
				oldalias := r.alias
				r.alias = strings.TrimSpace(string(in))
				r.fsys.mu.Lock()
				if oldalias != "" {
					delete(r.fsys.aliases, oldalias)
				}
				r.fsys.aliases[r.alias] = r
				r.fsys.mu.Unlock()
			}
			return nil
		}),
		"env": misc.FieldFile(strings.Join(r.env, "\n"), func(in []byte) error {
			if len(in) > 0 {
				r.env = strings.Split(strings.TrimSpace(string(in)), "\n")
			}
			return nil
		}),
		"dir": misc.FieldFile(r.dir, func(in []byte) error {
			if len(in) > 0 {
				r.dir = strings.TrimSpace(string(in))
			}
			return nil
		}),
		"exit": misc.FieldFile(r.exit, func(in []byte) error {
			if len(in) > 0 {
				r.exit = strings.TrimSpace(string(in))
				if closer := r.closer; closer != nil {
					r.closer = nil
					go closer()
				}
			}
			return nil
		}),
		"binds": fskit.OpenFunc(func(ctx context.Context, name string) (fs.File, error) {
			return fskit.Entry("binds", 0555, []byte(r.NS().String()+"\n")).Open(name)
		}),
		"ns": r.ns,
		"fd": &fdFS{task: r},
	}
	if r.export != nil {
		m["export"] = r.export
	}
	return m
}

func encodeTaskArgs(args []string) string {
	if args == nil {
		return "[]"
	}
	encoded, err := json.Marshal(args)
	if err != nil {
		return "[]"
	}
	return string(encoded)
}

func (r *Task) Route(ctx context.Context, name string) (fs.FS, string, error) {
	return r.taskMap().Route(ctx, name)
}

func (r *Task) OpenContext(ctx context.Context, name string) (fs.File, error) {
	return fs.OpenContext(ctx, r.taskMap(), name)
}

// LookPath resolves a program name to a path in the task namespace using
// the task's PATH environment, mirroring execvp semantics. Names that
// already contain a separator are returned unchanged. If no PATH entry
// matches, the bare name is returned so drivers still try it relative to
// the namespace root and surface the usual "file does not exist" error.
func (r *Task) LookPath(name string) string {
	if name == "" || strings.Contains(name, "/") {
		return name
	}
	for _, dir := range r.pathDirs() {
		candidate := name
		if dir != "" {
			candidate = dir + "/" + name
		}
		ok, err := fs.Exists(r.NS(), candidate)
		if err == nil && ok {
			return candidate
		}
	}
	return name
}

// SetArg0 replaces the program name, mirroring how execvp exposes the
// resolved path as argv[0]. Spawned workers re-read the binary by this
// name, so drivers call it after LookPath to keep the process consistent.
func (r *Task) SetArg0(name string) {
	if len(r.args) == 0 {
		r.args = []string{name}
	} else {
		r.args[0] = name
	}
}

// SetArgs replaces the full argument vector. Shebang resolution uses it to
// rewrite a `#!` script invocation into its interpreter invocation.
func (r *Task) SetArgs(args []string) {
	r.args = args
}

// resolveShebang rewrites a task whose program file starts with `#!` into
// the interpreter invocation, mirroring execve(2): the interpreter becomes
// argv[0] (followed by at most one interpreter argument), the script path
// becomes the next argument, and the original arguments follow. Returns
// true when the argument vector was rewritten. The interpreter is resolved
// through LookPath so `#!/usr/bin/env` style shebangs work unchanged.
func (r *Task) resolveShebang() bool {
	program := r.LookPath(r.Arg(0))
	f, err := r.NS().Open(program)
	if err != nil {
		return false
	}
	buf := make([]byte, 512)
	n, _ := f.Read(buf)
	f.Close()
	if n < 3 || buf[0] != '#' || buf[1] != '!' {
		return false
	}
	// Only the first line is the shebang; execve ignores the rest.
	var line []byte
	if i := bytes.IndexByte(buf[2:n], '\n'); i >= 0 {
		line = buf[2 : 2+i]
	} else {
		line = buf[2:n]
	}
	fields := strings.Fields(strings.TrimSpace(string(line)))
	if len(fields) == 0 {
		return false
	}
	// The interpreter runs as its own task and resolves the script path
	// against ITS namespace/cwd, while the original exec may have happened
	// elsewhere. Pass the script path in absolute namespace form so the
	// interpreter opens the same file regardless of its cwd.
	scriptPath := program
	if !strings.HasPrefix(scriptPath, "/") {
		scriptPath = "/" + scriptPath
	}
	args := []string{r.LookPath(fields[0])}
	if len(fields) > 1 {
		args = append(args, fields[1])
	}
	args = append(args, scriptPath)
	args = append(args, r.Args()[1:]...)
	r.SetArgs(args)
	return true
}

// pathDirs returns the directories searched by LookPath, from the task's
// PATH environment, defaulting to the conventional dirs when unset.
func (r *Task) pathDirs() []string {
	for _, kv := range r.env {
		if v, ok := strings.CutPrefix(kv, "PATH="); ok {
			return strings.Split(v, ":")
		}
	}
	return []string{"/bin", "/usr/bin"}
}

// fdFS exposes explicitly registered file descriptors to namespace bindings.
// It intentionally does not lock Task.mu because Task.FD can reach this path
// while already holding that lock.
type fdFS struct {
	task *Task
}

// VFSOpen resolves a standard descriptor installed through namespace binds.
// Task.FD holds r.mu while calling it, so fdFS must remain lock-free.
func (r *Task) VFSOpen(fd int) (fs.File, string, error) {
	name := fmt.Sprintf("#task/%s/fd/%d", r.ID(), fd)
	file, err := r.NS().Open(name)
	if err != nil {
		return nil, "", err
	}
	r.fds[fd] = &openFile{file: file, path: name}
	return file, name, nil
}

type nullFile struct{ fs.File }

func (f *nullFile) Read([]byte) (int, error)       { return 0, io.EOF }
func (f *nullFile) Write(data []byte) (int, error) { return len(data), nil }
func (f *nullFile) Close() error                   { return nil }

func (f *fdFS) Open(name string) (fs.File, error) {
	if name == "." {
		return fskit.Entry("fd", 0555|fs.ModeDir).Open(".")
	}
	fd, err := strconv.Atoi(name)
	if err != nil {
		return nil, fs.ErrNotExist
	}
	of, ok := f.task.fds[fd]
	if !ok || of == nil {
		return nil, fs.ErrNotExist
	}
	return of.file, nil
}

type TaskFS struct {
	types     map[string]TaskDriver
	resources map[string]fs.FS
	aliases   map[string]fs.FS
	nextID    int
	mu        sync.Mutex
}

type autoDriver func(*Task) error

func (d autoDriver) Check(*Task) bool {
	return false
}

func (d autoDriver) Start(t *Task) error {
	return d(t)
}

func NewTaskFS() *TaskFS {
	d := &TaskFS{
		types:     make(map[string]TaskDriver),
		resources: make(map[string]fs.FS),
		aliases:   make(map[string]fs.FS),
		nextID:    0,
	}
	// empty namespace process
	d.Register("auto", autoDriver(func(t *Task) error {
		d.mu.Lock()
		defer d.mu.Unlock()
		// A `#!` script has no binary driver, so resolve its interpreter
		// before dispatching, mirroring execve(2). The loop is bounded so
		// nested shebangs cannot spin forever.
		for i := 0; i < 4; i++ {
			for kind, driver := range d.types {
				if driver.Check(t) {
					t.kind = kind
					return driver.Start(t)
				}
			}
			if !t.resolveShebang() {
				break
			}
		}
		return nil
	}))
	return d
}

func (d *TaskFS) Register(kind string, driver TaskDriver) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.types[kind] = driver
}

func (d *TaskFS) Alloc(kind string, parent *Task) (*Task, error) {
	d.mu.Lock()
	driver, ok := d.types[kind]
	d.mu.Unlock()
	if !ok {
		return nil, fs.ErrNotExist
	}
	d.nextID++
	rid := strconv.Itoa(d.nextID)

	p := &Task{
		fsys:   d,
		driver: driver,
		id:     d.nextID,
		kind:   kind,
		fds:    make(map[int]*openFile),
		fdIdx:  3,
	}
	ctx := context.WithValue(context.Background(), TaskContextKey, p)
	if parent != nil {
		p.parent = parent
		p.ns = parent.ns.Clone(ctx)
	} else {
		p.ns = vfs.New(ctx)
	}
	d.resources[rid] = p
	return p, nil
}

func (d *TaskFS) vfsNS(ctx context.Context) (*vfs.NS, error) {
	m := fskit.MapFS{
		"new": fskit.OpenFunc(func(ctx context.Context, name string) (fs.File, error) {
			if name == "." {
				var nodes []fs.DirEntry
				for kind := range d.types {
					nodes = append(nodes, fskit.Entry(kind, 0555))
				}
				return fskit.DirFile(fskit.Entry("new", 0555), nodes...), nil
			}
			return &fskit.FuncFile{
				Node: fskit.Entry(name, 0555),
				ReadFunc: func(n *fskit.Node) (err error) {
					t, found := FromContext(ctx)
					if !found {
						t, err = d.Lookup("1")
						if err != nil {
							return err
						}
					}
					p, err := d.Alloc(name, t)
					if err != nil {
						return err
					}
					fskit.SetData(n, []byte(p.ID()+"\n"))
					return nil
				},
			}, nil
		}),
	}
	fsys := vfs.New(ctx)
	if err := fsys.Bind(fskit.MapFS(d.aliases), ".", "."); err != nil {
		return nil, err
	}
	if err := fsys.Bind(fskit.MapFS(d.resources), ".", "."); err != nil {
		return nil, err
	}
	if err := fsys.Bind(m, ".", "."); err != nil {
		return nil, err
	}
	t, ok := FromContext(ctx)
	if ok {
		if _, exists := d.resources[t.ID()]; exists {
			if err := fsys.Bind(d.resources[t.ID()], ".", "self"); err != nil {
				return nil, err
			}
		}
	}
	return fsys, nil
}

func (d *TaskFS) Route(ctx context.Context, name string) (fs.FS, string, error) {
	ns, err := d.vfsNS(ctx)
	if err != nil {
		return nil, "", err
	}
	return ns.Route(ctx, name)
}

func (d *TaskFS) Stat(name string) (fs.FileInfo, error) {
	log.Println("bare stat:", name)
	return d.StatContext(context.Background(), name)
}

func (d *TaskFS) StatContext(ctx context.Context, name string) (fs.FileInfo, error) {
	ns, err := d.vfsNS(ctx)
	if err != nil {
		return nil, err
	}
	return fs.StatContext(ctx, ns, name)
}

func (d *TaskFS) Open(name string) (fs.File, error) {
	log.Println("bare open:", name)
	return d.OpenContext(context.Background(), name)
}

func (d *TaskFS) OpenContext(ctx context.Context, name string) (fs.File, error) {
	ns, err := d.vfsNS(ctx)
	if err != nil {
		return nil, err
	}
	return fs.OpenContext(ctx, ns, name)
}
