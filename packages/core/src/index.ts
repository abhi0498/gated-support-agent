// Domain-agnostic core: agent loop, model adapters, gate, evals, scorecard, kill switch.
// Nothing in this package may reference a specific domain.

export const CORE_NAME = "@gsa/core";

export * from "./db/client.js";
export * from "./db/schema.js";
