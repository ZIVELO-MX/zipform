import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = async (path) => {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch (error) {
    throw new Error(`Unable to read deployment configuration: ${path}`, {
      cause: error,
    });
  }
};

test("Vercel builds the dashboard from the workspace root", async () => {
  const config = JSON.parse(await readProjectFile("vercel.json"));

  assert.equal(config.framework, "nextjs");
  assert.equal(config.outputDirectory, "apps/dashboard/.next");
  assert.match(config.installCommand, /pnpm install --frozen-lockfile/);
  assert.match(config.buildCommand, /pnpm db:generate/);
  assert.match(config.buildCommand, /@zipform\/dashboard build/);
});

test("CI gates preview and production deployments on verification", async () => {
  const workflow = await readProjectFile(".github/workflows/ci.yml");

  assert.match(workflow, /deploy-preview:[\s\S]*?needs: verify/);
  assert.match(workflow, /deploy-production:[\s\S]*?needs: verify/);
  assert.match(workflow, /environment=preview/);
  assert.match(workflow, /environment=production/);
  assert.match(workflow, /deploy --prebuilt --prod/);
  assert.match(workflow, /secrets\.VERCEL_TOKEN/);
  assert.match(workflow, /secrets\.VERCEL_ORG_ID/);
  assert.match(workflow, /secrets\.VERCEL_PROJECT_ID/);
});
