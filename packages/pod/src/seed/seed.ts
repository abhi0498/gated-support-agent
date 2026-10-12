import { settings, tickets, type Db } from "@gsa/core";
import {
  SEED_ORDERS,
  SEED_POLICY_LIMIT_CENTS,
  SEED_PROOFS,
  SEED_SHIPMENTS,
} from "../../seed/store.js";
import { customers, orders, proofs, shipments } from "../db/schema.js";
import { loadEvalSet, type EvalTicket } from "./eval-set.js";

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`seed data is inconsistent: no ${what}`);
  return value;
}

/**
 * Loads the store and the eval set's tickets. Idempotent: it upserts on natural keys
 * (email, order number, ticket ref), so re-running restores seeded rows without
 * touching runs, decisions or drafts. Labels are never written (ADR 0002).
 */
export async function seedDatabase(db: Db, evalSet: EvalTicket[] = loadEvalSet()): Promise<void> {
  await db.transaction(async (tx) => {
    const customerIds = new Map<string, string>();
    for (const { customer } of SEED_ORDERS) {
      if (customerIds.has(customer.email)) continue;
      const [row] = await tx
        .insert(customers)
        .values(customer)
        .onConflictDoUpdate({ target: customers.email, set: { name: customer.name } })
        .returning({ id: customers.id });
      customerIds.set(customer.email, must(row, `customer ${customer.email}`).id);
    }

    const orderIds = new Map<string, string>();
    for (const o of SEED_ORDERS) {
      const values = {
        customerId: must(customerIds.get(o.customer.email), `customer ${o.customer.email}`),
        status: o.status,
        totalCents: o.totalCents,
        items: o.items,
        shippingAddress: o.shippingAddress,
        placedAt: new Date(o.placedAt),
      };
      const [row] = await tx
        .insert(orders)
        .values({ number: o.number, ...values })
        .onConflictDoUpdate({ target: orders.number, set: values })
        .returning({ id: orders.id });
      orderIds.set(o.number, must(row, `order ${o.number}`).id);
    }

    for (const s of SEED_SHIPMENTS) {
      const values = {
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        eta: s.eta,
        shippedAt: new Date(s.shippedAt),
      };
      await tx
        .insert(shipments)
        .values({ orderId: must(orderIds.get(s.orderNumber), `order ${s.orderNumber}`), ...values })
        .onConflictDoUpdate({ target: shipments.orderId, set: values });
    }

    for (const p of SEED_PROOFS) {
      const values = { status: p.status, updatedAt: new Date(p.updatedAt) };
      await tx
        .insert(proofs)
        .values({ orderId: must(orderIds.get(p.orderNumber), `order ${p.orderNumber}`), ...values })
        .onConflictDoUpdate({ target: proofs.orderId, set: values });
    }

    for (const t of evalSet) {
      // Only what a real support inbox would receive: the label stays behind.
      const values = {
        subject: t.subject,
        body: t.body,
        customerEmail: t.customerEmail,
        orderRef: t.orderRef,
        createdAt: new Date(t.createdAt),
      };
      await tx
        .insert(tickets)
        .values({ ref: t.ref, ...values })
        .onConflictDoUpdate({ target: tickets.ref, set: values });
    }

    // Settings hold live state (the kill switch), so re-seeding never overwrites them.
    await tx
      .insert(settings)
      .values({ policyLimitCents: SEED_POLICY_LIMIT_CENTS })
      .onConflictDoNothing();
  });
}
