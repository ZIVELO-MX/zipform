import test from "node:test";
import assert from "node:assert/strict";
import { percentile, verifyOpenApiDeployment } from "./openapi-verification.mjs";

const validMission = {
  data: {
    displayId: "TLO-0004",
    status: "completed",
    progress: 100,
    checklistCount: 18,
    completed: 18,
  },
};

function response(body, { status = 200, contentType = "application/yaml", serverTiming = "openapi;dur=100" } = {}) {
  const headers = new Headers({ "content-type": contentType });
  if (serverTiming !== null) headers.set("server-timing", serverTiming);
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers });
}

function deploymentFetch(openApiResponses, mission = validMission) {
  let sample = 0;
  return async (url) => {
    if (url.endsWith("/api/openapi")) return openApiResponses[Math.min(sample++, openApiResponses.length - 1)];
    return response(mission, { contentType: "application/json" });
  };
}

function verify(fetchImpl, sampleCount = 1) {
  return verifyOpenApiDeployment({ bypassSecret: "bypass", zipformToken: "token", sampleCount, fetchImpl });
}

test("calculates the requested percentile from unsorted samples", () => {
  assert.equal(percentile([9, 1, 7, 3, 5], 0.95), 9);
  assert.equal(percentile([5, 1, 3], 0.5), 3);
});

test("rejects empty latency samples", () => {
  assert.throws(() => percentile([]), /No latency samples/);
});

test("warns without rejecting when Server-Timing is missing", async () => {
  const result = await verify(deploymentFetch([response("openapi: 3.1.0", { serverTiming: null })]));

  assert.equal(result.serverP95, null);
  assert.equal(result.wallP95 >= 0, true);
  assert.deepEqual(result.warnings, ["OpenAPI response is missing Server-Timing"]);
});

test("warns without rejecting when the available Server-Timing p95 exceeds 500 ms", async () => {
  const samples = [100, 200, 600].map((duration) => response("openapi: 3.1.0", { serverTiming: `openapi;dur=${duration}` }));
  const result = await verify(deploymentFetch(samples), samples.length);

  assert.equal(result.serverP95, 600);
  assert.deepEqual(result.warnings, ["OpenAPI Server-Timing p95 600.00 ms exceeds 500 ms"]);
});

test("rejects failed OpenAPI responses", async () => {
  await assert.rejects(verify(deploymentFetch([response("unavailable", { status: 503 })])), /OpenAPI returned HTTP 503/);
});

test("rejects invalid OpenAPI YAML", async () => {
  await assert.rejects(verify(deploymentFetch([response("not-openapi: true")])), /OpenAPI response is not YAML/);
});

test("rejects an invalid OpenAPI content type", async () => {
  await assert.rejects(verify(deploymentFetch([response("openapi: 3.1.0", { contentType: "text/plain" })])), /OpenAPI did not return YAML/);
});

test("rejects an invalid TLO-0004 deployed contract", async () => {
  const mission = { data: { ...validMission.data, progress: 95 } };
  await assert.rejects(verify(deploymentFetch([response("openapi: 3.1.0")], mission)), /does not match the completed mission contract/);
});
