import { resetDb } from "@gsa/core";
import { MIGRATIONS_FOLDER, requireEnv } from "../scripts/env.js";

// Runs the committed migrations against a fresh test database once per test run,
// so tests prove the SQL we ship, not just the TypeScript schema.
export default async function setup(): Promise<void> {
  await resetDb(requireEnv("TEST_DATABASE_URL"), MIGRATIONS_FOLDER);
}
