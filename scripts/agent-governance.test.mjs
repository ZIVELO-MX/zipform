import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

function readRepositoryFile(path) {
  try {
    return readFileSync(new URL(path, repositoryRoot), "utf8");
  } catch (cause) {
    throw new Error(`Unable to read governance file: ${path}`, { cause });
  }
}

test("reserves pull request merges for the user", () => {
  const instructions = readRepositoryFile("AGENTS.md");

  assert.match(instructions, /Never merge a pull request/);
  assert.match(instructions, /Only the user may decide and execute a pull request merge/);
  assert.match(instructions, /Never commit directly to `main`, including documentation-only changes/);
});

test("routes TLOZ pull request handoff through the agent template", () => {
  const skill = readRepositoryFile(".codex/skills/tloz-mission-operator/SKILL.md");
  const template = readRepositoryFile(".github/pull_request_template.md");

  assert.match(skill, /\.github\/pull_request_template\.md/);
  assert.match(skill, /Follow the merge authority in `AGENTS\.md`/);
  assert.match(template, /## Misión TLOZ/);
  assert.match(template, /## Contratos, datos y migraciones/);
  assert.match(template, /## Checklist del agente/);
});
