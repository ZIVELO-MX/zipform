import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/*.integration.test.ts", "node_modules"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 70 }
    }
  }
});
