import type { Address } from "./db/schema.js";

/**
 * The one canonical way an address is written as a string. Fact matching compares
 * these strings, so labels, tool output and replies must all go through it.
 */
export function formatAddress(a: Address): string {
  const street = a.line2 ? `${a.line1}, ${a.line2}` : a.line1;
  return `${street}, ${a.city}, ${a.region} ${a.postalCode}, ${a.country}`;
}
