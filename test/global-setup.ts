import { fileURLToPath } from "node:url";
import { resetDb } from "@gsa/core";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../drizzle", import.meta.url));

// Runs the committed migrations against a fresh test database once per test run,
// so tests prove the SQL we ship, not just the TypeScript schema.
export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set (copy .env.example to .env)");
  await resetDb(url, MIGRATIONS_FOLDER);
}
