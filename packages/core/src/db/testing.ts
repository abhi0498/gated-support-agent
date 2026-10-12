import { getTableName, sql, type Table } from "drizzle-orm";
import { createDb, type Db } from "./client.js";

/** A client for the migrated test database. Close it with `db.$client.end()`. */
export function createTestDb(): Db {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set (copy .env.example to .env)");
  return createDb(url);
}

/** Empties the given tables (and anything referencing them) between tests. */
export async function truncate(db: Db, ...tables: Table[]): Promise<void> {
  const names = tables.map((t) => sql.identifier(getTableName(t)));
  await db.execute(sql`truncate ${sql.join(names, sql`, `)} restart identity cascade`);
}
