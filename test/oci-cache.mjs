import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fetchOCIImage } from "../elements/oci.js";
import { getOciCacheStats, clearOciCache, configureOciCache } from "../elements/oci-cache.js";

const layerBytes = new TextEncoder().encode("oci-cached-layer");
const digest = `sha256:${createHash("sha256").update(layerBytes).digest("hex")}`;
const originalFetch = globalThis.fetch;
const requests = [];

globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  requests.push(url);
  if (url === "https://registry-1.docker.io/v2/library/example/manifests/latest") {
    return Response.json({
      manifests: [{ digest: "sha256:manifest", platform: { os: "linux", architecture: "amd64" } }],
    });
  }
  if (url === "https://registry-1.docker.io/v2/library/example/manifests/sha256:manifest") {
    return Response.json({ layers: [{ digest, mediaType: "application/vnd.oci.image.layer.v1.tar" }] });
  }
  if (url === `https://registry-1.docker.io/v2/library/example/blobs/${digest}`) {
    return new Response(layerBytes);
  }
  throw new Error(`unexpected request ${url}`);
};

configureOciCache({ root: "wanix-oci-test" });
await clearOciCache();

try {
  const first = await fetchOCIImage("docker.io/example:latest", "linux/amd64", "", { cache: true });
  const requestsAfterFirst = requests.length;
  assert.ok(first.length === 1, "expected one layer stream");

  const stats = await getOciCacheStats();
  console.log("OCI cache: stats", stats);
  assert.equal(stats.disabled, true, "OPFS is unavailable in node, cache should be disabled");
  assert.ok(requestsAfterFirst > 0);
  console.log("OCI cache: PASS");
} finally {
  globalThis.fetch = originalFetch;
}