// Print-on-demand reference policy: tools, intents, seed data and the Policy object.
// The eval set and seeding live behind @gsa/pod/eval-set and @gsa/pod/seed, off this
// entry point, so nothing the agent imports can reach the labels (ADR 0002).
import { CORE_NAME } from "@gsa/core";

export const POD_NAME = "@gsa/pod";
export const POD_DEPENDS_ON = CORE_NAME;

export * from "./address.js";
export * from "./db/schema.js";
export * from "./intents.js";
export { SEED_POLICY_LIMIT_CENTS, SEED_TODAY } from "../seed/store.js";
