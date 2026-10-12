import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// camelCase in TypeScript, snake_case in Postgres. drizzle.config.ts must use the same casing.
export function createDb(url: string) {
  return drizzle(url, { casing: "snake_case" });
}

export type Db = ReturnType<typeof createDb>;

export async function migrateDb(url: string, migrationsFolder: string): Promise<void> {
  const db = createDb(url);
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await db.$client.end();
  }
}

/** Drops every table and Drizzle's migration journal, then migrates from scratch. */
export async function resetDb(url: string, migrationsFolder: string): Promise<void> {
  const db = createDb(url);
  try {
    await db.execute(sql`drop schema if exists drizzle cascade`);
    await db.execute(sql`drop schema public cascade`);
    await db.execute(sql`create schema public`);
  } finally {
    await db.$client.end();
  }
  await migrateDb(url, migrationsFolder);
}
