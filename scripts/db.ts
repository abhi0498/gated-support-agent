// pnpm db:migrate | pnpm db:reset
import { migrateDb, resetDb } from "@gsa/core";
import { MIGRATIONS_FOLDER, requireEnv } from "./env.js";

const url = requireEnv("DATABASE_URL");
const command = process.argv[2];

if (command === "migrate") {
  await migrateDb(url, MIGRATIONS_FOLDER);
  console.log("database migrated");
} else if (command === "reset") {
  await resetDb(url, MIGRATIONS_FOLDER);
  console.log("database reset and migrated");
} else {
  throw new Error(`unknown command: ${String(command)} (expected migrate or reset)`);
}
