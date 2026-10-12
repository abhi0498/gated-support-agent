// Print-on-demand reference policy: tools, intents, seed data and the Policy object.
import { CORE_NAME } from "@gsa/core";

export const POD_NAME = "@gsa/pod";
export const POD_DEPENDS_ON = CORE_NAME;

export * from "./address.js";
export * from "./db/schema.js";
export * from "./intents.js";
export * from "./seed/eval-set.js";
export * from "./seed/seed.js";
export { SEED_POLICY_LIMIT_CENTS, SEED_TODAY } from "../seed/store.js";
