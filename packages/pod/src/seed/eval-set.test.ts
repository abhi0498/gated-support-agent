// Every check here is a label bug caught before the evals trust it.
import { describe, expect, it } from "vitest";
import {
  SEED_ORDERS,
  SEED_POLICY_LIMIT_CENTS,
  SEED_PROOFS,
  SEED_SHIPMENTS,
  type SeedOrder,
} from "../../seed/store.js";
import type { PodIntent } from "../intents.js";
import { loadEvalSet, type EvalTicket } from "./eval-set.js";

const evalSet = loadEvalSet();

const AUTO_SEND_INTENTS: PodIntent[] = ["order_status", "proof_status", "address_change"];

const MIN_PER_INTENT: Record<PodIntent, number> = {
  order_status: 12,
  address_change: 9,
  proof_status: 8,
  reprint_defect: 7,
  refund_request: 6,
  angry_escalation: 6,
  artwork_question: 6,
  other: 6,
};

/** The order a ticket is about: by its order ref, or the sender's only order when there is no ref. */
function orderFor(t: EvalTicket): SeedOrder | undefined {
  if (t.orderRef !== null) return SEED_ORDERS.find((o) => o.number === t.orderRef);
  const own = SEED_ORDERS.filter((o) => o.customer.email === t.customerEmail);
  return own.length === 1 ? own[0] : undefined;
}

describe("eval set integrity", () => {
  it("parses, and every ref is unique", () => {
    const refs = evalSet.map((t) => t.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("has at least the agreed number of tickets for each intent", () => {
    for (const [intent, min] of Object.entries(MIN_PER_INTENT)) {
      const n = evalSet.filter((t) => t.label.intent === intent).length;
      expect(n, intent).toBeGreaterThanOrEqual(min);
    }
  });

  it("only cites order refs that exist, except tickets tagged wrong_order_ref", () => {
    for (const t of evalSet) {
      if (t.orderRef === null) continue;
      const exists = SEED_ORDERS.some((o) => o.number === t.orderRef);
      expect(exists, t.ref).toBe(!t.tags.includes("wrong_order_ref"));
    }
  });

  it("only labels auto_send for order_status, proof_status and address_change", () => {
    for (const t of evalSet.filter((t) => t.label.expectedAction === "auto_send")) {
      expect(AUTO_SEND_INTENTS, t.ref).toContain(t.label.intent);
    }
  });

  it("escalates every ticket whose order is above the policy limit", () => {
    const overLimit = evalSet.filter((t) => {
      const order = orderFor(t);
      return order !== undefined && order.totalCents > SEED_POLICY_LIMIT_CENTS;
    });
    expect(overLimit.length).toBeGreaterThan(0);
    for (const t of overLimit) {
      expect(t.label.expectedAction, t.ref).toBe("escalate");
      expect(t.tags, t.ref).toContain("over_limit");
    }
  });

  it("every required fact matches the ticket's own order", () => {
    for (const t of evalSet) {
      if (t.label.requiredFacts.length === 0) continue;
      const order = orderFor(t);
      if (!order) throw new Error(`${t.ref} has required facts but no resolvable order`);
      const shipment = SEED_SHIPMENTS.find((s) => s.orderNumber === order.number);
      const proof = SEED_PROOFS.find((p) => p.orderNumber === order.number);

      for (const fact of t.label.requiredFacts) {
        const where = `${t.ref} ${fact.name}`;
        switch (fact.name) {
          case "tracking_number":
            expect(fact.value, where).toBe(shipment?.trackingNumber);
            break;
          case "eta":
            expect(fact.value, where).toBe(shipment?.eta);
            break;
          case "order_status":
            expect(fact.value, where).toBe(order.status);
            break;
          case "proof_status":
            expect(fact.value, where).toBe(proof?.status);
            break;
          case "new_address": {
            // The canonical form must be what the customer asked for: their words minus the country code.
            expect(order.status, `${where}: order must still be stageable`).toBe("paid");
            const withoutCountry = fact.value.replace(/, [A-Z]{2}$/, "");
            expect(t.body, where).toContain(withoutCountry);
            break;
          }
        }
      }
    }
  });
});
