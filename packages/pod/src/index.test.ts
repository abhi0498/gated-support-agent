import { describe, expect, it } from "vitest";
import { POD_DEPENDS_ON, POD_NAME } from "./index.js";

describe("@gsa/pod", () => {
  it("resolves @gsa/core through the workspace", () => {
    expect(POD_NAME).toBe("@gsa/pod");
    expect(POD_DEPENDS_ON).toBe("@gsa/core");
  });
});
