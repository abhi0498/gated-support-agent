// Print-on-demand tables. Foreign keys may point into core, never the reverse (ADR 0001).
import { agentRuns } from "@gsa/core";
import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["paid", "printing", "shipped", "delivered"]);

export const proofStatus = pgEnum("proof_status", [
  "pending",
  "sent",
  "approved",
  "changes_requested",
]);

export const addressChangeStatus = pgEnum("address_change_status", [
  "staged",
  "applied",
  "discarded",
]);

export const reprintStatus = pgEnum("reprint_status", ["pending", "approved", "rejected"]);

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  title: string;
  qty: number;
}

export const customers = pgTable("customers", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    number: text().notNull().unique(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id),
    status: orderStatus().notNull().default("paid"),
    totalCents: integer().notNull(),
    items: jsonb().$type<OrderItem[]>().notNull(),
    shippingAddress: jsonb().$type<Address>().notNull(),
    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.customerId), check("total_non_negative", sql`${t.totalCents} >= 0`)],
);

export const shipments = pgTable("shipments", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .unique()
    .references(() => orders.id),
  carrier: text().notNull(),
  trackingNumber: text().notNull().unique(),
  eta: date({ mode: "string" }).notNull(),
  shippedAt: timestamp({ withTimezone: true }).notNull(),
});

export const proofs = pgTable("proofs", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .unique()
    .references(() => orders.id),
  status: proofStatus().notNull().default("pending"),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Staged by a run, applied only when that run's draft is sent.
export const addressChanges = pgTable(
  "address_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id),
    runId: uuid()
      .notNull()
      .references(() => agentRuns.id),
    newAddress: jsonb().$type<Address>().notNull(),
    status: addressChangeStatus().notNull().default("staged"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.runId), index().on(t.orderId)],
);

// A human decides; nothing here ever triggers a reprint by itself.
export const reprintProposals = pgTable(
  "reprint_proposals",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id),
    runId: uuid()
      .notNull()
      .references(() => agentRuns.id),
    reason: text().notNull(),
    status: reprintStatus().notNull().default("pending"),
    reviewerNote: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.runId), index().on(t.orderId)],
);
