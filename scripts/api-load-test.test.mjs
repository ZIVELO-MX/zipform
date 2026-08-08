import assert from "node:assert/strict";
import test from "node:test";
import { assertLoopbackUrl, benchmarkApi, compareBenchmarks, percentile } from "./api-load-test.mjs";

test("percentile sorts samples and rejects an empty set", () => {
  assert.equal(percentile([30, 10, 20], 0.5), 20);
  assert.throws(() => percentile([]), /No se recopilaron/);
});

test("only permits loopback benchmark targets", () => {
  assert.doesNotThrow(() => assertLoopbackUrl("http://127.0.0.1:3100"));
  assert.doesNotThrow(() => assertLoopbackUrl("http://localhost:3100"));
  assert.throws(() => assertLoopbackUrl("https://zipform.zivelo.dev"), /solo puede ejecutarse contra loopback/);
});

test("classifies a meaningful p95 improvement", () => {
  const baseline = { endpoints: [{ name: "projects", p95: 100, requestsPerSecond: 10 }] };
  const candidate = { endpoints: [{ name: "projects", p95: 80, requestsPerSecond: 12 }] };
  assert.equal(compareBenchmarks(baseline, candidate).verdict, "improvement");
});

test("classifies a regression using both relative and absolute thresholds", () => {
  const baseline = { endpoints: [{ name: "projects", p95: 100, requestsPerSecond: 10 }] };
  const candidate = { endpoints: [{ name: "projects", p95: 120, requestsPerSecond: 9 }] };
  assert.equal(compareBenchmarks(baseline, candidate).verdict, "regression");
});

test("benchmarks bounded v1/v2 pages and the mission batch contract", async () => {
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    requests.push({ path: `${url.pathname}${url.search}`, method: init.method });
    const payload = url.pathname === "/api/v1/projects"
      ? { data: [{ id: "project-1" }], nextCursor: "project-page-2" }
      : url.pathname === "/api/v1/missions"
        ? { data: [{ id: "mission-1" }], nextCursor: "mission-page-2" }
        : { data: [], nextCursor: null };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const report = await benchmarkApi({
    baseUrl: "http://127.0.0.1:3100",
    token: "local-test-token",
    samples: 1,
    concurrency: 1,
    fetchImpl,
  });

  const names = report.endpoints.map((endpoint) => endpoint.name);
  assert.deepEqual(
    ["projects", "missions", "inventory", "resources", "containers", "contents", "documents"]
      .filter((name) => !names.includes(name)),
    [],
  );
  assert.ok(names.includes("projects-page-2"));
  assert.ok(names.includes("missions-page-2"));
  assert.ok(requests.some((request) => request.path === "/api/v1/missions/batch" && request.method === "POST"));
});
