import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 900 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100"
      : "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TLOZ_DATA_DRIVER: "mock",
      TLOZ_LOCAL_API_MODE: "1",
      TLOZ_LOCAL_API_KEY: "zipform-local-e2e-api-only",
      AUTH_SECRET: "zipform-local-e2e-only",
      AUTH_URL: "http://127.0.0.1:3100",
    },
  },
});
