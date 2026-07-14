import assert from "node:assert/strict";
import test from "node:test";
import { compareBenchmarks, percentile } from "./api-load-test.mjs";

test("percentile sorts samples and rejects an empty set", () => {
  assert.equal(percentile([30, 10, 20], 0.5), 20);
  assert.throws(() => percentile([]), /No se recopilaron/);
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
