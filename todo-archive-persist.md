# Archive Persist: Design & TODO

## 目标

让 `<wanix-bind type="archive">` 挂载的 tar/tar.gz 存档**持久化到浏览器本地存储**，页面刷新后无需重新下载。行为对标 hackpad 的 `OverlayTarGzip` + `persist: true`。

---

## 现状

当前 `wasm/wasm.go:176-197` 处理 `type="archive"` 的流程：

```
JS: fetch(url) → DecompressionStream("gzip") → ReadableStream
Go: tarfs.From(tar.NewReader(stream)) → memfs.New() → fs.CopyFS → NS.Bind(rwfs, ".")
```

关键问题：
- `memfs` 是纯内存，**页面刷新即丢失**
- 每次刷新都要重新下载并解压整个 tar.gz
- `cowfs` 已有 COW overlay 机制但未与 archive 流程结合
- `web/fsa` (OPFS) 和 `web/idbfs` (IndexedDB) 可作为持久化后端，但均未参与存档挂载

---

## 现有可复用组件

| 组件 | 位置 | 能力 |
|------|------|------|
| `tarfs.Reader` | `fs/tarfs/reader.go` | tar 内存 FS（只读，全量解析到 `map[string]map[string]*File`） |
| `tarfs.Archive` | `fs/tarfs/archiver.go` | 将 `fs.FS` 写入 tar 流 |
| `cowfs.FS` | `fs/cowfs/cowfs.go` | COW overlay: Base 只读 + Overlay 可写，tombstone/rename 持久化 |
| `cowfs.Whiteout()` | `fs/cowfs/cowfs.go:124` | 持久化 tombstone/rename 元数据到 overlay FS（文件形式） |
| `fsa.OPFS()` | `web/fsa/fsa.go:32` | Origin Private File System（持久化，语义接近 POSIX） |
| `idbfs.New()` | `web/idbfs/idbfs.go:41` | IndexedDB FS（持久化，支持 Create/Remove/Rename） |
| `fs.CopyFS` | `tractor.dev/wanix/fs` | 跨 FS 递归拷贝 |

---

## 设计：持久化 Archive Mount

### 核心思路

```go
// 组合 cowfs，用 tarfs.Reader 作 Base，OPFS/IDBFS 作 Overlay
cfs := &cowfs.FS{
    Base:    tarfs.From(tar.NewReader(stream)),  // 只读存档
    Overlay: opfsSubDir,                          // 持久化写入层
}
cfs.Whiteout(".wh")  // 持久化删除/重命名元数据
task.NS().Bind(cfs, ".", dst)
```

### 首次挂载流程

```
请求 tar.gz → 流式 fetch → gzip 解压 → tar 解析 → tarfs.Reader (只读)
                                                     ↓
                      cowfs { Base: tarfs, Overlay: OPFS/tarfs-cache }
                                                     ↓
                                  任务开始时后台写 OPFS 缓存 (可选)
                                                     ↓
                                  用户立即可读写 (COW 层记录差异)
```

### 再次挂载流程（缓存命中）

```
检测 OPFS 中是否存在 `.tarfs-complete` (或其他标记)
    ├── 有 → 跳过下载，直接挂载: cowfs { Base: OPFS-archive-cache, Overlay: OPFS-cow-overlay }
    └── 无 → 走首次挂载流程
```

### 架构分层

```
命名空间绑定 (NS.Bind)
    └── cowfs.FS (将 Base 视为只读，修改全部写入 Overlay)
            ├── Base:    tarfs.Reader 或 OPFS 归档缓存 (只读)
            └── Overlay: OPFS 命名子目录 (持久化 COW 差异)
                            └── .wh/deletes/  ← 删除标记
                            └── .wh/renames/  ← 重命名追踪
                            └── ...用户修改的文件
```

---

## TODO

### Phase 1: 核心持久化（针对 `persist` 属性的 archive）

- [ ] **定义 archive 元数据**：设计标记文件（如 `.tarfs-complete`）及版本/校验信息，用于检测缓存有效性
- [ ] **新增 `archivepersist` 包**（`fs/archivepersist/`）：封装首次解压 + 缓存检测逻辑，提供预制 `fs.FS`
  - [ ] `MountPersistArchive(reader io.Reader, persistFS fs.FS, path string) (fs.FS, error)`: 检查 persistFS 中是否已有缓存，若无则写入
  - [ ] 内部使用 `tarfs.Reader` 作 Base，`persistFS` 作持久化层
- [ ] **扩展 `wasm/wasm.go` 的 archive 处理分支**：
  - [ ] 读取 `<wanix-bind>` 的 `persist` 属性
  - [ ] 若 `persist="opfs"` 或 `persist="idbfs"`，使用对应持久化后端
  - [ ] 若 `persist="true"`，默认使用 OPFS
  - [ ] 若 `persist` 未设置，保持现有 `memfs` 行为（兼容）
- [ ] **后台缓存写入**：首次挂载后 goroutine 将 `tarfs.Reader` 全量拷贝到 OPFS（与用户操作并行），写入标记文件
- [ ] **再次加载时检测标记**：省略下载 + 解析，直接挂载 cowfs{Base: OPFS-archive-cache, Overlay: OPFS-cow-layer}

### Phase 2: cowfs 增强

- [ ] **文件内容级别的持久化**：当前 `cowfs.Whiteout` 只持久化 tombstone/rename 元数据，不会将用户修改的文件内容写回 overlay。需要验证 `cowfs.copyIfNeeded` + overlay FS 的可写接口是否覆盖此场景
- [ ] **cowfs 新增 `SyncOverlay()`**：将 overlay 中的脏文件整理写回，由调用方控制持久化时机

### Phase 3: 缓存验证与清理

- [ ] **版本校验**：tar.gz URL 或 ETag 变化时自动忽略旧缓存，重新下载
- [ ] **`<wanix-bind cache-key="...">` 属性**：允许调用方自定义缓存键（替代 URL 哈希）
- [ ] **存储配额**：OPFS 有浏览器配额限制，需要清理策略（LRU 或手动 evict API）
- [ ] **`#web/opfs` 下统一管理 archive 缓存**：如 `#web/opfs/.cache/archives/<hash>/`

### Phase 4: 流式挂载（可选优化）

- [ ] **tarfs.Reader 改为流式读取**：当前 `tarfs.From` 需 `tar.Next()` 全量读取到内存。可改为类似 hackpad `ReaderFS` 的按文件 lazy blocking（后台 goroutine 流式解析，`Open` 阻塞直到对应文件就绪）
- [ ] 配合 persist: 首次流式解压时同时写入 OPFS 和 mem cache

---

## 决策点

1. **持久化后端选型**：OPFS vs IDBFS
   - OPFS (`fsa`): 语义接近 POSIX，文件操作更直接，适合大量小文件
   - IDBFS (`idbfs`): 基于 IndexedDB，大 blob 存储更成熟，但操作开销略高
   - 建议默认 **OPFS**，IDBFS 作为 fallback

2. **缓存粒度**：
   - 方案 A: 全量缓存整个 archive 到 OPFS（简单，hackpad 方案）
   - 方案 B: 按文件 lazy 缓存（复杂，首次加载快但实现量翻倍）
   - 建议先做 **方案 A**（全量），Phase 4 再考虑流式

3. **cowfs.Base 支持 TarFS 的适配**：
   - `tarfs.Reader` 当前返回 `*File` 带 `bytes.NewReader`，不支持写入
   - cowfs 通过 `copyIfNeeded` 在首次修改时将文件从 Base 拷贝到 Overlay——这要求 Base 支持 `Open` + `Read`，**tarfs.Reader 已满足**
   - 无需额外适配

---

## 参考

- hackpad 实现：`internal/fs/fs.go` 的 `OverlayTarGzip` / `persistDB` / `ReaderFS`
- hackpad OPFS 层：`internal/opfs/opfs.go`（实现方式与 `web/fsa` 类似）
- wanix `cowfs`：`fs/cowfs/cowfs.go`
- wanix 当前 archive 流程：`wasm/wasm.go:176-197` + `elements/bind.js:95-146`
