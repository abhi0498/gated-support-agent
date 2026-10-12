import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { agentRuns, drafts, settings, tickets } from "./schema.js";
import { createTestDb, truncate } from "./testing.js";

// These prove invariants the database itself enforces, whatever the code above it does.
describe("core schema constraints", () => {
  const db = createTestDb();

  beforeEach(async () => {
    await truncate(db, tickets, settings);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  async function newRun() {
    const [ticket] = await db
      .insert(tickets)
      .values({ ref: "T-001", subject: "Where is it?", body: "Order?", customerEmail: "a@b.test" })
      .returning();
    if (!ticket) throw new Error("ticket not inserted");
    const insertRun = async () => {
      const [run] = await db
        .insert(agentRuns)
        .values({ ticketId: ticket.id, model: "mock" })
        .returning();
      if (!run) throw new Error("run not inserted");
      return run;
    };
    return { ticket, insertRun };
  }

  it("allows exactly one settings row", async () => {
    await db.insert(settings).values({});
    await expect(db.insert(settings).values({})).rejects.toThrow();
    await expect(db.insert(settings).values({ id: false })).rejects.toThrow();
  });

  it("stores the threshold without float drift", async () => {
    await db.insert(settings).values({});
    const [row] = await db.select().from(settings);
    expect(row?.threshold).toBe(0.85);
  });

  it("allows only one pending draft per ticket", async () => {
    const { ticket, insertRun } = await newRun();
    const run1 = await insertRun();
    const run2 = await insertRun();
    await db.insert(drafts).values({ ticketId: ticket.id, runId: run1.id, body: "one" });

    await expect(
      db.insert(drafts).values({ ticketId: ticket.id, runId: run2.id, body: "two" }),
    ).rejects.toThrow();

    // Superseding the first frees the slot.
    await db.update(drafts).set({ status: "superseded" }).where(eq(drafts.runId, run1.id));
    await db.insert(drafts).values({ ticketId: ticket.id, runId: run2.id, body: "two" });
  });

  it("only lets auto-sent drafts be flagged", async () => {
    const { ticket, insertRun } = await newRun();
    const run = await insertRun();
    const flagged = { ticketId: ticket.id, runId: run.id, body: "x", flaggedAt: new Date() };

    await expect(db.insert(drafts).values({ ...flagged, status: "approved" })).rejects.toThrow();
    await db.insert(drafts).values({ ...flagged, status: "auto_sent" });
  });
});
