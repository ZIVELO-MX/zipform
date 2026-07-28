import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { install } from "../.codex/skills/tloz-mission-operator/scripts/install-tloz-api.mjs";
import { run } from "../.codex/skills/tloz-mission-operator/scripts/tloz-api.mjs";

test("runs an authenticated JSON request against the fixed origin", async () => {
  const calls = [];
  const output = [];
  const code = await run(["/api/v1/projects", "PATCH"], {
    token: "zaf_test",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return { ok: true, text: async () => '{"ok":true}' };
    },
    write: (value) => output.push(value),
  });
  assert.equal(code, 0);
  assert.deepEqual(calls[0], {
    url: "https://zipform.zivelo.dev/api/v1/projects",
    init: { method: "PATCH", headers: { Authorization: "Bearer zaf_test", Accept: "application/json" } },
  });
  assert.deepEqual(output, ['{"ok":true}']);
});

test("validates configuration and payloads before making requests", async () => {
  const errors = [];
  assert.equal(await run([], { token: "zaf_test", error: (...args) => errors.push(args.join(" ")) }), 2);
  assert.equal(await run(["/api/v1/projects"], { error: (...args) => errors.push(args.join(" ")) }), 2);
  assert.equal(await run(["/api/v1/projects", "POST", "--data-file", "missing.json"], {
    token: "zaf_test",
    error: (...args) => errors.push(args.join(" ")),
  }), 2);
  assert.equal(errors.length, 3);
  assert.ok(errors.every((message) => !message.includes("zaf_test")));
});

test("maps API and network failures to a non-success exit code", async () => {
  const errors = [];
  assert.equal(await run(["/api/v1/projects"], {
    token: "zaf_test",
    fetchImpl: async () => ({ ok: false, status: 422, text: async () => "x".repeat(600) }),
    error: (...args) => errors.push(args.join(" ")),
  }), 1);
  assert.match(errors[0], /^API respondió HTTP 422:/);
  assert.ok(errors[0].length < 540);
  assert.equal(await run(["/api/v1/projects"], {
    token: "zaf_test",
    fetchImpl: async () => { throw new Error("offline"); },
    error: (...args) => errors.push(args.join(" ")),
  }), 1);
  assert.match(errors[1], /offline/);
});

test("installs an executable idempotently in a user-selected bin directory", async () => {
  const binDir = await mkdtemp(join(tmpdir(), "tloz-api-bin-"));
  const target = await install(["--bin-dir", binDir]);
  const first = await readFile(target, "utf8");
  const mode = (await stat(target)).mode & 0o777;
  assert.equal(mode, 0o755);
  assert.equal(await install(["--bin-dir", binDir]), target);
  assert.equal(await readFile(target, "utf8"), first);
});
