import { resetDb } from "@gsa/core";
import { MIGRATIONS_FOLDER, requireEnv } from "../scripts/env.js";

// Runs the committed migrations against a fresh test database once per test run,
// so tests prove the SQL we ship, not just the TypeScript schema.
export default async function setup(): Promise<void> {
  const url = requireEnv("TEST_DATABASE_URL");
  // This drops every table, so refuse anything that isn't clearly a test database.
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`refusing to reset "${dbName}": TEST_DATABASE_URL must name a *_test database`);
  }
  await resetDb(url, MIGRATIONS_FOLDER);
}
