// Tables every domain needs: tickets, runs, decisions, drafts, settings.
// Nothing here may reference a domain table (ADR 0001).
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const gateAction = pgEnum("gate_action", ["auto_send", "draft", "escalate"]);

export const draftStatus = pgEnum("draft_status", [
  "pending",
  "approved",
  "rejected",
  "auto_sent",
  "superseded",
]);

/** A value from a tool result that the reply relies on. */
export interface CitedFact {
  name: string;
  value: string;
}

// The customer's words as received. Email and order ref are unverified text,
// not foreign keys: a ref that matches nothing must still be storable.
export const tickets = pgTable("tickets", {
  id: uuid().primaryKey().defaultRandom(),
  ref: text().notNull().unique(),
  subject: text().notNull(),
  body: text().notNull(),
  customerEmail: text().notNull(),
  orderRef: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Inserted when a run starts, so tools can attach staged changes to it;
// usage and trace are filled in when it finishes.
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    ticketId: uuid()
      .notNull()
      .references(() => tickets.id),
    model: text().notNull(),
    inputTokens: integer(),
    outputTokens: integer(),
    costUsd: numeric({ precision: 12, scale: 6 }),
    latencyMs: integer(),
    trace: jsonb().$type<unknown>(),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
  },
  // (id, ticket_id) is unique so drafts can reference both together.
  (t) => [index().on(t.ticketId), unique().on(t.id, t.ticketId)],
);

// The gate's Decision, next to the Verdict fields it was based on.
export const decisions = pgTable(
  "decisions",
  {
    id: uuid().primaryKey().defaultRandom(),
    runId: uuid()
      .notNull()
      .unique()
      .references(() => agentRuns.id),
    intent: text().notNull(),
    confidence: doublePrecision().notNull(),
    proposedAction: gateAction().notNull(),
    citedFacts: jsonb().$type<CitedFact[]>().notNull().default([]),
    action: gateAction().notNull(),
    reasons: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("confidence_range", sql`${t.confidence} between 0 and 1`)],
);

export const drafts = pgTable(
  "drafts",
  {
    id: uuid().primaryKey().defaultRandom(),
    ticketId: uuid()
      .notNull()
      .references(() => tickets.id),
    runId: uuid().notNull().unique(),
    body: text().notNull(),
    status: draftStatus().notNull().default("pending"),
    reviewerNote: text(),
    flaggedAt: timestamp({ withTimezone: true }),
    flagNote: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The draft's ticket must be its run's ticket, or the pending-draft rule below
    // would guard the wrong ticket.
    foreignKey({
      columns: [t.runId, t.ticketId],
      foreignColumns: [agentRuns.id, agentRuns.ticketId],
    }),
    // At most one pending draft per ticket: a new run must supersede the old one.
    uniqueIndex("drafts_one_pending_per_ticket")
      .on(t.ticketId)
      .where(sql`${t.status} = 'pending'`),
    // Only a reply that actually went out can be flagged as wrong.
    check("flag_only_auto_sent", sql`${t.flaggedAt} is null or ${t.status} = 'auto_sent'`),
  ],
);

// Exactly one row: the primary key can only ever be `true`.
export const settings = pgTable(
  "settings",
  {
    id: boolean().primaryKey().default(true),
    autoSendEnabled: boolean().notNull().default(true),
    threshold: doublePrecision().notNull().default(0.85),
    policyLimitCents: integer().notNull().default(20000),
    disabledReason: text(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("single_row", sql`${t.id}`),
    check("threshold_range", sql`${t.threshold} between 0 and 1`),
  ],
);
