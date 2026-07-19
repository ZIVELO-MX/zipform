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

test("documents the local API and keeps production calls on the fixed origin", () => {
  const skill = readRepositoryFile(".codex/skills/tloz-mission-operator/SKILL.md");
  const wrapper = readRepositoryFile(".codex/skills/tloz-mission-operator/scripts/tloz-api.mjs");

  assert.match(skill, /pnpm api:local/);
  assert.match(skill, /pnpm perf:api/);
  assert.match(wrapper, /https:\/\/zipform\.zivelo\.dev/);
  assert.doesNotMatch(wrapper, /process\.env\.ZIPFORM_API_BASE_URL/);
  assert.match(skill, /install-tloz-api\.mjs/);
  assert.match(skill, /tloz-api \/api\/v1/);
});

test("prioritizes missions assigned to the authenticated TLOZ agent", () => {
  const skill = readRepositoryFile(".codex/skills/tloz-mission-operator/SKILL.md");
  const workflows = readRepositoryFile(".codex/skills/tloz-mission-operator/references/api-workflows.md");

  const identityStep = skill.indexOf("GET /api/v1/users/me");
  const assignedQueryStep = skill.indexOf("ownerId={authenticatedUserId}");
  assert.ok(identityStep >= 0, "The skill must resolve the authenticated user");
  assert.ok(assignedQueryStep > identityStep, "Assigned mission discovery must follow authenticated-user discovery");
  assert.match(skill, /Ownership priority must never replace an explicit identifier/);
  assert.match(skill, /status order `now`, `next`, then `later`/);
  assert.match(workflows, /explicit mission identifier always takes precedence/);
});
