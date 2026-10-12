// pnpm seed: loads the store and eval-set tickets. Safe to re-run.
import { createDb } from "@gsa/core";
import { seedDatabase } from "@gsa/pod";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");

const db = createDb(url);
try {
  await seedDatabase(db);
  console.log("seeded");
} finally {
  await db.$client.end();
}
