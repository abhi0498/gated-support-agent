// YOUR TEST. Every check here is a label bug caught before the evals trust it.
// Turn each it.todo into a real test. Useful imports:
//   loadEvalSet()            -> EvalTicket[] (already Zod-validated; a malformed file throws)
//   SEED_ORDERS, SEED_SHIPMENTS, SEED_PROOFS from "../../seed/store.js"
//   formatAddress()          -> the canonical address string
// Tip: write one, run `pnpm test`, break tickets.json on purpose and watch it go red.
import { describe, it } from "vitest";

describe("eval set integrity", () => {
  it.todo("parses, and every ref is unique");
  it.todo("has at least the agreed number of tickets for each intent");
  it.todo("only cites order refs that exist, except tickets tagged wrong_order_ref");
  it.todo("only labels auto_send for order_status, proof_status and address_change");
  it.todo("escalates every ticket whose order is above the policy limit");
  it.todo("every required fact value appears in the seeded store data");
});
