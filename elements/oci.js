const OCI_ACCEPT = [
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

export async function fetchOCIImage(reference, platform = "linux/amd64") {
    const image = parseReference(reference);
    const headers = { Accept: OCI_ACCEPT };
    const manifest = await fetchManifest(image, image.reference, headers);
    const selected = selectManifest(manifest.body, platform);
    const imageManifest = selected
        ? await fetchManifest(image, selected.digest, headers)
        : manifest;
    if (!Array.isArray(imageManifest.body.layers)) {
        throw new Error(`OCI image ${reference} has no filesystem layers`);
    }
    return Promise.all(imageManifest.body.layers.map((layer) => fetchLayer(image, layer)));
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

async function fetchManifest(image, reference, headers) {
    const response = await registryFetch(image, `/v2/${image.repository}/manifests/${reference}`, headers);
    const body = await response.json();
    return { body, digest: response.headers.get("Docker-Content-Digest") };
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

async function fetchLayer(image, layer) {
    const response = await registryFetch(image, `/v2/${image.repository}/blobs/${layer.digest}`, {});
    const bytes = new Uint8Array(await response.arrayBuffer());
    await verifyDigest(bytes, layer.digest);
    const stream = new Blob([bytes]).stream();
    if (layer.mediaType.includes("+gzip") || (bytes[0] === 0x1f && bytes[1] === 0x8b)) {
        if (typeof DecompressionStream === "undefined") throw new Error("OCI gzip layers require DecompressionStream");
        return stream.pipeThrough(new DecompressionStream("gzip"));
    }
    return stream;
}

async function registryFetch(image, pathname, headers) {
    const url = `https://${image.registry}${pathname}`;
    let response = await fetch(url, { headers });
    if (response.status !== 401) {
        if (!response.ok) throw new Error(`OCI registry returned HTTP ${response.status} for ${pathname}`);
        return response;
    }
    const challenge = response.headers.get("WWW-Authenticate") || "";
    const token = await fetchToken(challenge);
    response = await fetch(url, { headers: { ...headers, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`OCI registry returned HTTP ${response.status} for ${pathname}`);
    return response;
}

async function fetchToken(challenge) {
    const params = Object.fromEntries([...challenge.matchAll(/([a-z]+)="([^"]+)"/gi)].map((match) => [match[1], match[2]]));
    if (!params.realm) throw new Error("OCI registry did not provide a bearer token realm");
    const url = new URL(params.realm);
    if (params.service) url.searchParams.set("service", params.service);
    if (params.scope) url.searchParams.set("scope", params.scope);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OCI token service returned HTTP ${response.status}`);
    const body = await response.json();
    if (!body.token && !body.access_token) throw new Error("OCI token service returned no token");
    return body.token || body.access_token;
}

async function verifyDigest(bytes, digest) {
    const [algorithm, expected] = digest.split(":", 2);
    if (algorithm !== "sha256" || !expected) throw new Error(`unsupported OCI digest ${digest}`);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const actual = [...hash].map((value) => value.toString(16).padStart(2, "0")).join("");
    if (actual !== expected) throw new Error(`OCI layer digest mismatch for ${digest}`);
}
