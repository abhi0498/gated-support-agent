import { describe, expect, it } from "vitest";
import { formatAddress } from "./address.js";

describe("formatAddress", () => {
  it("writes a one-line address", () => {
    expect(
      formatAddress({
        line1: "1201 Grove Ave",
        city: "Richmond",
        region: "VA",
        postalCode: "23220",
        country: "US",
      }),
    ).toBe("1201 Grove Ave, Richmond, VA 23220, US");
  });

  it("includes line2 after line1", () => {
    expect(
      formatAddress({
        line1: "350 Atlantic Ave",
        line2: "Apt 5C",
        city: "Brooklyn",
        region: "NY",
        postalCode: "11217",
        country: "US",
      }),
    ).toBe("350 Atlantic Ave, Apt 5C, Brooklyn, NY 11217, US");
  });
});
