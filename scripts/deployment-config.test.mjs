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
  const config = JSON.parse(
    await readProjectFile("apps/dashboard/vercel.json"),
  );

  assert.equal(config.framework, "nextjs");
  assert.equal(config.outputDirectory, ".next");
  assert.match(config.installCommand, /cd \.\.\/\.\./);
  assert.match(config.buildCommand, /pnpm db:generate/);
  assert.match(config.buildCommand, /@zipform\/dashboard build/);
});

test("CI delegates deployments to the Vercel Git integration", async () => {
  const workflow = await readProjectFile(".github/workflows/ci.yml");

  assert.match(workflow, /verify:/);
  assert.match(workflow, /run: pnpm check/);
  assert.match(workflow, /secrets\.VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.doesNotMatch(workflow, /deploy-preview:/);
  assert.doesNotMatch(workflow, /deploy-production:/);
  assert.doesNotMatch(workflow, /secrets\.VERCEL_(?!AUTOMATION_BYPASS_SECRET)/);
});

test("Next.js traces the generated Prisma engine from the monorepo", async () => {
  const config = await readProjectFile("apps/dashboard/next.config.mjs");

  assert.match(config, /outputFileTracingRoot: monorepoRoot/);
  assert.match(config, /@prisma\+client@\*\/node_modules\/\.prisma\/client\/\*\*\/\*/);
});
