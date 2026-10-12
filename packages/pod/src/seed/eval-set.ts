// The eval set: seeded tickets plus their hand-checked labels (ADR 0002: labels never enter the DB).
import { readFileSync } from "node:fs";
import { gateAction } from "@gsa/core";
import { z } from "zod";
import { POD_FACT_NAMES, POD_INTENTS } from "../intents.js";

// Why a ticket is in the set, so evals can be sliced by kind of difficulty.
export const TICKET_TAGS = [
  "wrong_order_ref",
  "multi_intent",
  "sarcasm",
  "non_english",
  "disguised_refund",
  "prompt_injection",
  "over_limit",
  "email_only",
  "order_owner_mismatch",
] as const;

export const requiredFactSchema = z.object({
  name: z.enum(POD_FACT_NAMES),
  value: z.string().min(1),
});

export const labelSchema = z.object({
  intent: z.enum(POD_INTENTS),
  expectedAction: z.enum(gateAction.enumValues),
  requiredFacts: z.array(requiredFactSchema),
});

export const evalTicketSchema = z.object({
  ref: z.string().regex(/^T-\d{3}$/),
  subject: z.string().min(1),
  body: z.string().min(1),
  customerEmail: z.email(),
  orderRef: z.string().min(1).nullable(),
  createdAt: z.iso.datetime(),
  label: labelSchema,
  tags: z.array(z.enum(TICKET_TAGS)).default([]),
  note: z.string().optional(),
});

export const evalSetSchema = z.array(evalTicketSchema);

export type Label = z.infer<typeof labelSchema>;
export type EvalTicket = z.infer<typeof evalTicketSchema>;

export const EVAL_SET_PATH = new URL("../../seed/tickets.json", import.meta.url);

/** Reads and validates the eval set. Throws on any malformed ticket. */
export function loadEvalSet(path: URL = EVAL_SET_PATH): EvalTicket[] {
  return evalSetSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}
