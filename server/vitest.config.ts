import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/globalSetup.ts",
    // All tests share one MySQL test DB — run files one at a time, not parallel.
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      DATABASE_URL: "mysql://root:palatia@localhost:3306/palatia_test",
      JWT_SECRET: "test-secret",
      CORS_ORIGIN: "http://localhost:3000",
    },
  },
});