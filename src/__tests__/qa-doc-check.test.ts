import { describe, it, expect } from "vitest";
import { runChecks } from "../../scripts/qa-doc-check.mjs";

describe("QA_BY_PAGE.md structural integrity", () => {
  it("passes all four invariants", () => {
    const failures = runChecks();
    if (failures.length > 0) {
      throw new Error(
        `QA doc check failed with ${failures.length} issue(s):\n\n${failures.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}`,
      );
    }
    expect(failures).toHaveLength(0);
  });
});
