import { describe, expect, it } from "vitest";
import { CORE_NAME } from "./index.js";

describe("@gsa/core", () => {
  it("is wired into the workspace", () => {
    expect(CORE_NAME).toBe("@gsa/core");
  });
});
