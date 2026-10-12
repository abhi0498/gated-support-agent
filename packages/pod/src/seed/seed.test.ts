import { agentRuns, settings, tickets } from "@gsa/core";
import { createTestDb, truncate } from "@gsa/core/testing";
import { count, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { customers, orders, proofs, shipments } from "../db/schema.js";
import { seedDatabase } from "./seed.js";

describe("seedDatabase", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await truncate(db, customers, tickets, settings);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  async function counts() {
    return Promise.all(
      [customers, orders, shipments, proofs, tickets, settings].map(async (table) => {
        const [row] = await db.select({ n: count() }).from(table);
        return row?.n;
      }),
    );
  }

  it("produces the same rows when run twice", async () => {
    await seedDatabase(db);
    const first = await counts();
    await seedDatabase(db);
    expect(await counts()).toEqual(first);
    expect(first).toEqual([52, 52, 28, 9, 60, 1]);
  });

  it("restores seeded rows that were changed", async () => {
    await seedDatabase(db);
    await db.update(orders).set({ status: "delivered" }).where(eq(orders.number, "PD-10421"));

    await seedDatabase(db);

    const [order] = await db.select().from(orders).where(eq(orders.number, "PD-10421"));
    expect(order?.status).toBe("paid");
  });

  it("leaves run history and the kill switch alone", async () => {
    await seedDatabase(db);
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ref, "T-001"));
    if (!ticket) throw new Error("T-001 not seeded");
    await db.insert(agentRuns).values({ ticketId: ticket.id, model: "mock" });
    await db.update(settings).set({ autoSendEnabled: false, disabledReason: "tripped" });

    await seedDatabase(db);

    const [runs] = await db.select({ n: count() }).from(agentRuns);
    const [row] = await db.select().from(settings);
    expect(runs?.n).toBe(1);
    expect(row?.autoSendEnabled).toBe(false);
  });
});
