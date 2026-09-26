const OCI_ACCEPT = [
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

export async function fetchOCIImage(reference, platform = "linux/amd64", proxyPrefix = "", options = {}) {
    const proxy = (url) => proxyPrefix ? `${proxyPrefix}${url}` : url;
    const image = parseReference(reference);
    const session = createRegistrySession(image, proxy);
    const headers = { Accept: OCI_ACCEPT };

    let manifestBody;
    if (options.cache) {
        const { readCachedManifest, writeCachedManifest } = await import("./oci-cache.js");
        manifestBody = await readCachedManifest(reference, { root: options.root });
    }
    if (!manifestBody) {
        const indexResponse = await session.fetch(`/v2/${image.repository}/manifests/${image.reference}`, headers);
        manifestBody = await indexResponse.json();
        if (options.cache) {
            const { writeCachedManifest } = await import("./oci-cache.js");
            await writeCachedManifest(reference, manifestBody, { root: options.root });
        }
    }

    const selected = selectManifest(manifestBody, platform);
    const imageManifest = selected
        ? await (await session.fetch(`/v2/${image.repository}/manifests/${selected.digest}`, headers)).json()
        : manifestBody;
    if (!Array.isArray(imageManifest.layers)) {
        throw new Error(`OCI image ${reference} has no filesystem layers`);
    }

    let fetchLayerFn = (digest, mediaType) => fetchLayerBytes(session, digest, mediaType);
    if (options.cache) {
        const { createLayerFetcher } = await import("./oci-cache.js");
        const fetcher = await createLayerFetcher({
            reference,
            platform,
            root: options.root,
            limit: options.limit,
            fetchLayer: (digest) => fetchLayerBytes(session, digest),
        });
        fetchLayerFn = (digest, mediaType) => fetcher.fetchLayer(digest, mediaType);
    }
    return Promise.all(imageManifest.layers.map((layer) => {
        const layerMediaType = layer.mediaType || "application/vnd.oci.image.layer.v1.tar";
        return fetchLayerWithDecompression(fetchLayerFn, layer.digest, layerMediaType);
    }));
}

async function fetchLayerWithDecompression(fetchLayerFn, digest, mediaType) {
    if (shouldDecompressLayerMagic(mediaType) && typeof DecompressionStream === "undefined") {
        throw new Error("OCI gzip layers require DecompressionStream");
    }
    const result = await fetchLayerFn(digest, mediaType);
    // Result is always a ReadableStream of the on-the-wire layer bytes
    // (gzip-compressed if the registry sent gzip). The cache stores the
    // exact same bytes, so the consumer is the only one decompressing.
    const stream = result instanceof Uint8Array ? new Blob([result]).stream() : result;
    if (!shouldDecompressLayerMagic(mediaType)) {
        return stream;
    }
    return stream.pipeThrough(new DecompressionStream("gzip"));
}

function shouldDecompressLayerMagic(mediaType) {
    return !!(mediaType && mediaType.includes("+gzip"));
}

// One bearer token per image pull: the first 401 kicks off the token
// request and every subsequent manifest / layer fetch awaits the same
// promise, so a multi-layer image does at most one round-trip to the
// token endpoint regardless of how many blobs follow.
function createRegistrySession(image, proxy) {
    let tokenPromise = null;
    const requestToken = async (challenge) => {
        const params = Object.fromEntries([...challenge.matchAll(/([a-z]+)="([^"]+)"/gi)].map((match) => [match[1], match[2]]));
        if (!params.realm) throw new Error("OCI registry did not provide a bearer token realm");
        const realmUrl = new URL(params.realm);
        if (params.service) realmUrl.searchParams.set("service", params.service);
        if (params.scope) realmUrl.searchParams.set("scope", params.scope);
        const url = proxy ? proxy(realmUrl.toString()) : realmUrl.toString();
        const response = await fetch(url);
        if (!response.ok) throw new Error(`OCI token service returned HTTP ${response.status}`);
        const body = await response.json();
        if (!body.token && !body.access_token) throw new Error("OCI token service returned no token");
        return body.token || body.access_token;
    };
    return {
        image,
        fetch: async (pathname, headers = {}) => {
            const url = proxy ? proxy(`https://${image.registry}${pathname}`) : `https://${image.registry}${pathname}`;
            let response = await fetch(url, { headers });
            if (response.status === 401) {
                const challenge = response.headers.get("WWW-Authenticate") || "";
                if (!tokenPromise) tokenPromise = requestToken(challenge);
                const token = await tokenPromise;
                response = await fetch(url, { headers: { ...headers, Authorization: `Bearer ${token}` } });
            }
            if (!response.ok) throw new Error(`OCI registry returned HTTP ${response.status} for ${pathname}`);
            return response;
        },
    };
}

function parseReference(reference) {
    const value = reference.replace(/^oci:\/\//, "");
    const slash = value.indexOf("/");
    const first = slash < 0 ? value : value.slice(0, slash);
    const explicitRegistry = first.includes(".") || first.includes(":") || first === "localhost";
    const registry = !explicitRegistry || first === "docker.io" ? "registry-1.docker.io" : first;
    let repository = explicitRegistry ? value.slice(slash + 1) : value;
    if (registry === "registry-1.docker.io" && !repository.includes("/")) repository = `library/${repository}`;
    const digestIndex = repository.indexOf("@");
    if (digestIndex >= 0) {
        return { registry, repository: repository.slice(0, digestIndex), reference: repository.slice(digestIndex + 1) };
    }
    const tagIndex = repository.lastIndexOf(":");
    if (tagIndex >= 0) {
        return { registry, repository: repository.slice(0, tagIndex), reference: repository.slice(tagIndex + 1) };
    }
    return { registry, repository, reference: "latest" };
}

function selectManifest(manifest, platform) {
    if (!Array.isArray(manifest.manifests)) return null;
    const [os, architecture, variant] = platform.split("/");
    const found = manifest.manifests.find((entry) =>
        entry.platform?.os === os && entry.platform?.architecture === architecture &&
        (!variant || entry.platform?.variant === variant),
    );
    if (!found) throw new Error(`OCI image has no manifest for ${platform}`);
    return found;
}

async function fetchLayerBytes(session, digest) {
    // Returns the on-the-wire layer bytes (gzip-compressed when the
    // registry sent gzip). The consumer is responsible for
    // decompression because only it knows whether the cache is in
    // play, and the OPFS layer cache stores the wire bytes verbatim.
    return (async () => {
        const response = await session.fetch(`/v2/${session.image.repository}/blobs/${digest}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        await verifyDigest(bytes, digest);
        return bytes;
    })();
}

async function verifyDigest(bytes, digest) {
    const [algorithm, expected] = digest.split(":", 2);
    if (algorithm !== "sha256" || !expected) throw new Error(`unsupported OCI digest ${digest}`);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const actual = [...hash].map((value) => value.toString(16).padStart(2, "0")).join("");
    if (actual !== expected) throw new Error(`OCI layer digest mismatch for ${digest}`);
}