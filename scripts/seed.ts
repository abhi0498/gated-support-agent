// pnpm seed: migrates, then loads the store and eval-set tickets. Safe to re-run,
// and works on a fresh database.
import { createDb, migrateDb } from "@gsa/core";
import { seedDatabase } from "@gsa/pod/seed";
import { MIGRATIONS_FOLDER, requireEnv } from "./env.js";

const url = requireEnv("DATABASE_URL");
await migrateDb(url, MIGRATIONS_FOLDER);

const db = createDb(url);
try {
  await seedDatabase(db);
  console.log("seeded");
} finally {
  await db.$client.end();
}
