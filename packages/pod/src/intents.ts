// Ticket intents, most severe first. A ticket that mixes several gets the first one present.
export const POD_INTENTS = [
  "angry_escalation",
  "refund_request",
  "reprint_defect",
  "address_change",
  "artwork_question",
  "proof_status",
  "order_status",
  "other",
] as const;

export type PodIntent = (typeof POD_INTENTS)[number];

// Names of the facts a reply can cite. Values come from tool results.
export const POD_FACT_NAMES = [
  "tracking_number",
  "eta",
  "order_status",
  "proof_status",
  "new_address",
] as const;

export type PodFactName = (typeof POD_FACT_NAMES)[number];
