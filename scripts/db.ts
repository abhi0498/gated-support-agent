// pnpm db:migrate | pnpm db:reset
import { fileURLToPath } from "node:url";
import { migrateDb, resetDb } from "@gsa/core";

export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../drizzle", import.meta.url));

async function main(command: string | undefined): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");

  if (command === "migrate") {
    await migrateDb(url, MIGRATIONS_FOLDER);
    console.log("database migrated");
  } else if (command === "reset") {
    await resetDb(url, MIGRATIONS_FOLDER);
    console.log("database reset and migrated");
  } else {
    throw new Error(`unknown command: ${String(command)} (expected migrate or reset)`);
  }
}

await main(process.argv[2]);
