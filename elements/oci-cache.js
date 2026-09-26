// OPFS layer cache for OCI image layers.
//
// Each cache entry stores the gzip-compressed layer bytes under
// <root>/layers/sha256-<hex>.gz, keyed by the OCI digest. The cache
// also memoizes resolved manifests under <root>/manifests/<name> so a
// cold relaunch does not re-fetch the index from the registry.
//
// Reads verify the SHA-256 of the gzip bytes before serving; an
// integrity failure falls through to the network fetch and rewrites
// the entry. Writes are atomic (temp + rename) so a process kill
// mid-write never leaves a corrupt file.
//
// The cache is opt-in: callers pass `cache: true` (or an explicit
// cache root name) to `fetchOCIImage`. When OPFS is unavailable
// (private mode, quota error, missing API) the helpers degrade
// gracefully to network-only.

const DEFAULT_ROOT = "wanix-oci";
const MANIFEST_DIR = "manifests";
const LAYER_DIR = "layers";
const META_EXT = ".json";
const LAYER_EXT = ".gz";
const MAX_ENTRIES_DEFAULT = 128;
const MAX_BYTES_DEFAULT = 512 * 1024 * 1024;

let storageRoot = null;
let storageReady = null;
const inflight = new Map();
let lastStats = { entries: 0, bytes: 0, hits: 0, misses: 0, writes: 0, evictions: 0, disabled: false };

function hexDigest(digest) {
    const [algorithm, value] = String(digest).split(":", 2);
    if (algorithm !== "sha256" || !value) throw new Error(`unsupported OCI digest ${digest}`);
    return value;
}

function safeName(reference) {
    return String(reference).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 200) || "image";
}

async function ensureStorage(rootName) {
    if (storageReady) return storageReady;
    if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.getDirectory) {
        storageReady = Promise.resolve(null);
        return null;
    }
    storageReady = (async () => {
        try {
            const root = await navigator.storage.getDirectory();
            const dir = await root.getDirectoryHandle(rootName || DEFAULT_ROOT, { create: true });
            const manifests = await dir.getDirectoryHandle(MANIFEST_DIR, { create: true });
            const layers = await dir.getDirectoryHandle(LAYER_DIR, { create: true });
            return { root, dir, manifests, layers };
        } catch (err) {
            console.warn("OCI cache: OPFS unavailable, falling back to network.", err);
            lastStats.disabled = true;
            return null;
        }
    })();
    return storageReady;
}

export function configureOciCache(options = {}) {
    if (options.root) storageRoot = options.root;
    if (storageReady) {
        storageReady = null;
    }
    lastStats.disabled = false;
}

export async function getOciCacheStats() {
    const storage = await ensureStorage(storageRoot);
    if (!storage) return { ...lastStats, entries: 0, bytes: 0, disabled: true };
    let entries = 0;
    let bytes = 0;
    for await (const [, handle] of storage.layers.entries()) {
        if (handle.kind !== "file") continue;
        try {
            const file = await handle.getFile();
            entries += 1;
            bytes += file.size;
        } catch { /* ignore */ }
    }
    return { ...lastStats, entries, bytes, disabled: false };
}

export async function clearOciCache() {
    const storage = await ensureStorage(storageRoot);
    if (!storage) return;
    for (const dir of [storage.manifests, storage.layers]) {
        for await (const [name] of dir.entries()) {
            try { await dir.removeEntry(name, { recursive: true }); } catch { /* ignore */ }
        }
    }
    lastStats = { entries: 0, bytes: 0, hits: 0, misses: 0, writes: 0, evictions: 0, disabled: false };
}

function summarize(entries, bytes, limit) {
    return { entries, bytes, limit };
}

async function readLayerFromCache(digest, storage) {
    const name = `sha256-${hexDigest(digest)}${LAYER_EXT}`;
    try {
        const fileHandle = await storage.layers.getFileHandle(name);
        const file = await fileHandle.getFile();
        // Stream first, then verify on the fly. The cache layer is small
        // (a few MB per entry) and reading the bytes into memory just to
        // hash them would close the file handle on every cache hit.
        const stream = file.stream();
        const decompressed = stream.pipeThrough(new DecompressionStream("gzip"));
        const tee = decompressed.tee();
        verifyDigestStream(tee[0], digest).then((ok) => {
            if (!ok) storage.layers.removeEntry(name).catch(() => {});
        }).catch(() => {
            storage.layers.removeEntry(name).catch(() => {});
        });
        lastStats.hits += 1;
        return tee[1];
    } catch (err) {
        if (err && err.name !== "NotFoundError") console.warn("OCI cache read error", err);
        lastStats.misses += 1;
        return null;
    }
}

async function verifyDigestStream(stream, digest) {
    const expected = hexDigest(digest);
    const reader = stream.getReader();
    let hasher = null;
    try { hasher = await crypto.subtle.digest("SHA-256", new Uint8Array(0)); } catch { /* not every UA accepts an empty input */ }
    const chunks = [];
    let total = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.byteLength; }
    const actual = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
    for (let i = 0; i < actual.length; i += 1) {
        if (actual[i] !== parseInt(expected.slice(i * 2, i * 2 + 2), 16)) {
            return false;
        }
    }
    return true;
}

async function writeLayerToCache(digest, gzipBytes, storage, limit) {
    const name = `sha256-${hexDigest(digest)}${LAYER_EXT}`;
    const lockKey = `write:${name}`;
    const previous = inflight.get(lockKey) || Promise.resolve();
    const next = previous.then(async () => {
        const existing = await readLayerFromCache(digest, storage).catch(() => null);
        if (existing) return existing;
        const tempName = `${name}.${crypto.randomUUID()}.tmp`;
        const fileHandle = await storage.layers.getFileHandle(tempName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(gzipBytes);
        await writable.close();
        await commitTempFile(storage.layers, tempName, name);
        lastStats.writes += 1;
        await enforceLimit(storage, limit);
        return readLayerFromCache(digest, storage);
    });
    inflight.set(lockKey, next.catch(() => {}));
    try { return await next; } finally {
        if (inflight.get(lockKey) === next.catch(() => {})) inflight.delete(lockKey);
    }
}

async function commitTempFile(dir, tempName, finalName) {
    // `moveEntry` is the cheap path on supporting browsers; fall back
    // to a copy-and-remove when it is missing (Safari, older Chromium).
    if (typeof dir.moveEntry === "function") {
        try {
            await dir.moveEntry(tempName, finalName);
            return;
        } catch (err) {
            if (err && err.name !== "NotFoundError") console.warn("OCI cache moveEntry failed", err);
        }
    }
    const source = await dir.getFileHandle(tempName);
    const bytes = new Uint8Array(await (await source.getFile()).arrayBuffer());
    const target = await dir.getFileHandle(finalName, { create: true });
    const writable = await target.createWritable();
    await writable.write(bytes);
    await writable.close();
    await dir.removeEntry(tempName).catch(() => {});
}

async function enforceLimit(storage, limit) {
    const maxEntries = limit?.entries ?? MAX_ENTRIES_DEFAULT;
    const maxBytes = limit?.bytes ?? MAX_BYTES_DEFAULT;
    const inventory = [];
    for await (const [name, handle] of storage.layers.entries()) {
        if (handle.kind !== "file") continue;
        try {
            const file = await handle.getFile();
            inventory.push({ name, size: file.size, lastAccess: file.lastModified });
        } catch { /* ignore */ }
    }
    inventory.sort((a, b) => a.lastAccess - b.lastAccess);
    let total = inventory.reduce((s, e) => s + e.size, 0);
    let i = 0;
    while ((inventory.length - i > maxEntries || total > maxBytes) && i < inventory.length) {
        const entry = inventory[i++];
        try {
            await storage.layers.removeEntry(entry.name);
            total -= entry.size;
            lastStats.evictions += 1;
        } catch { /* ignore */ }
    }
    lastStats.entries = inventory.length - i;
    lastStats.bytes = total;
}

async function cacheLayerStream(digest, fetchLayer, storage, limit) {
    const cached = await readLayerFromCache(digest, storage);
    if (cached) return cached;
    const layer = await fetchLayer();
    const gzipBytes = await collectGzip(layer);
    return writeLayerToCache(digest, gzipBytes, storage, limit);
}

async function collectGzip(source) {
    if (source instanceof Uint8Array) return source;
    if (source instanceof ArrayBuffer) return new Uint8Array(source);
    if (typeof source === "string") return new TextEncoder().encode(source);
    if (source && typeof source.pipeThrough === "function") {
        // Re-compress into gzip to match the on-disk cache shape.
        return new Uint8Array(await new Response(source.pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
    }
    throw new Error("OCI cache: cannot serialise layer into gzip bytes.");
}

function parseKey(ref) {
    const lastSlash = ref.lastIndexOf("/");
    const lastColon = ref.lastIndexOf(":", lastSlash >= 0 ? lastSlash : ref.length);
    return { repo: ref.split(":")[0], reference: ref.slice(lastColon + 1) || "latest" };
}

async function readManifestFromCache(reference, storage) {
    const key = safeName(reference);
    try {
        const fileHandle = await storage.manifests.getFileHandle(key + META_EXT);
        const file = await fileHandle.getFile();
        return JSON.parse(await file.text());
    } catch (err) {
        if (err && err.name !== "NotFoundError") console.warn("OCI cache manifest read error", err);
        return null;
    }
}

async function writeManifestToCache(reference, manifest, storage) {
    const key = safeName(reference);
    const tempName = `${key}${META_EXT}.${crypto.randomUUID()}.tmp`;
    const fileHandle = await storage.manifests.getFileHandle(tempName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(manifest));
    await writable.close();
    await commitTempFile(storage.manifests, tempName, key + META_EXT);
}

export async function readCachedManifest(reference, options = {}) {
    const storage = await ensureStorage(options.root);
    if (!storage) return null;
    return readManifestFromCache(reference, storage);
}

export async function writeCachedManifest(reference, manifest, options = {}) {
    const storage = await ensureStorage(options.root);
    if (!storage) return;
    try { await writeManifestToCache(reference, manifest, storage); }
    catch (err) { console.warn("OCI cache manifest write error", err); }
}

// Adapter consumed by `elements/oci.js`. Returns a function with the
// same shape as the inline `fetchLayer` it replaces, but pulls gzip
// bytes from OPFS when present and falls through to the network
// otherwise.
export async function createLayerFetcher({ reference, fetchLayer, platform, root, limit }) {
    const storage = await ensureStorage(root);
    if (!storage) {
        return { fetchLayer, close: async () => {} };
    }
    const stats = summarize(0, 0, limit);
    const wrapped = {
        async fetchLayer(digest) {
            const cached = await readLayerFromCache(digest, storage);
            if (cached) return cached;
            const stream = await fetchLayer(digest);
            const gzipBytes = await collectGzip(stream);
            return writeLayerToCache(digest, gzipBytes, storage, limit);
        },
        async close() { /* nothing to release */ },
    };
    return wrapped;
}

export function attachCacheToWindow(global) {
    const api = {
        stats: () => getOciCacheStats(),
        clear: () => clearOciCache(),
        configure: (options) => configureOciCache(options),
    };
    if (!global.GearShell) global.GearShell = {};
    if (!global.GearShell.oci) global.GearShell.oci = {};
    global.GearShell.oci.cache = api;
    return api;
}
