import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Local runs read TEST_DATABASE_URL from .env; CI sets it directly (existing vars win).
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/api"],
    globalSetup: ["./test/global-setup.ts"],
    // DB tests share one database, so test files run one at a time.
    fileParallelism: false,
  },
});
