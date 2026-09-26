import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fetchOCIImage } from "../elements/oci.js";

const layer = new TextEncoder().encode("oci-layer");
const digest = `sha256:${createHash("sha256").update(layer).digest("hex")}`;
const originalFetch = globalThis.fetch;
let manifestRequests = 0;
let tokenRequests = 0;

globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  if (url === "https://registry-1.docker.io/v2/library/example/manifests/latest") {
    manifestRequests += 1;
    if (manifestRequests === 1) {
      return new Response(null, {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="https://auth.example/token",service="registry.docker.io",scope="repository:library/example:pull"' },
      });
    }
    if (!options.headers?.Authorization) {
      return new Response(null, {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="https://auth.example/token",service="registry.docker.io",scope="repository:library/example:pull"' },
      });
    }
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return Response.json({
      manifests: [{ digest: "sha256:manifest", platform: { os: "linux", architecture: "amd64" } }],
    });
  }
  if (url === "https://auth.example/token?service=registry.docker.io&scope=repository%3Alibrary%2Fexample%3Apull") {
    tokenRequests += 1;
    return Response.json({ token: "test-token" });
  }
  if (url === "https://registry-1.docker.io/v2/library/example/manifests/sha256:manifest") {
    if (!options.headers?.Authorization) {
      return new Response(null, {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="https://auth.example/token",service="registry.docker.io",scope="repository:library/example:pull"' },
      });
    }
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return Response.json({ layers: [{ digest, mediaType: "application/vnd.oci.image.layer.v1.tar" }] });
  }
  if (url === `https://registry-1.docker.io/v2/library/example/blobs/${digest}`) {
    if (!options.headers?.Authorization) {
      return new Response(null, {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="https://auth.example/token",service="registry.docker.io",scope="repository:library/example:pull"' },
      });
    }
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return new Response(layer);
  }
  throw new Error(`unexpected request ${url}`);
};

try {
  const layers = await fetchOCIImage("docker.io/example:latest", "linux/amd64");
  assert.equal(layers.length, 1);
  assert.deepEqual([...new Uint8Array(await new Response(layers[0]).arrayBuffer())], [...layer]);
  assert.equal(manifestRequests, 2);
  // The bearer dance fires only on the first challenge; every subsequent
  // manifest and blob fetch reuses the cached token (one token request
  // total for the whole image pull, no matter how many layers).
  assert.equal(tokenRequests, 1);
  console.log("OCI loader: PASS");
} finally {
  globalThis.fetch = originalFetch;
}
