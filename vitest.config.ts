import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Local runs read TEST_DATABASE_URL from .env; CI sets it directly (existing vars win).
if (existsSync(".env")) process.loadEnvFile(".env");

const PROJECTS = ["packages/core", "packages/pod", "apps/api"];

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    // DB tests share one database, so nothing may overlap: files within a project run
    // one at a time, and each project gets its own group so projects run in sequence
    // (projects without a groupOrder all run in parallel).
    fileParallelism: false,
    projects: PROJECTS.map((root, i) => ({
      extends: true,
      test: { root, name: root.split("/")[1], sequence: { groupOrder: i } },
    })),
  },
});
