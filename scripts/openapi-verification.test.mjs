import test from "node:test";
import assert from "node:assert/strict";
import { percentile } from "./openapi-verification.mjs";

test("calculates the requested percentile from unsorted samples", () => {
  assert.equal(percentile([9, 1, 7, 3, 5], 0.95), 9);
  assert.equal(percentile([5, 1, 3], 0.5), 3);
});

test("rejects empty latency samples", () => {
  assert.throws(() => percentile([]), /No latency samples/);
});
