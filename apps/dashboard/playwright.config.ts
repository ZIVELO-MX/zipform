import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`
      : `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TLOZ_DATA_DRIVER: "mock",
      TLOZ_LOCAL_API_MODE: "1",
      TLOZ_LOCAL_API_KEY: "zipform-local-e2e-api-only",
      AUTH_SECRET: "zipform-local-e2e-only",
      AUTH_URL: baseURL,
    },
  },
});
