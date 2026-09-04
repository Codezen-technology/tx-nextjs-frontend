import { describe, expect, it } from "vitest";
import { deriveLearnerStatus } from "@/lib/utils/business-learners";

describe("deriveLearnerStatus", () => {
  it("reports an inactive learner as archived regardless of login history", () => {
    expect(deriveLearnerStatus({ status: "inactive", last_login: "2026-01-01" })).toBe("archived");
  });

  it("reports an active learner who has never signed in as pending", () => {
    expect(deriveLearnerStatus({ status: "active", last_login: null })).toBe("pending");
    expect(deriveLearnerStatus({ status: "active" })).toBe("pending");
  });

  it("reports an active learner who has signed in as active", () => {
    expect(deriveLearnerStatus({ status: "active", last_login: "2026-08-01" })).toBe("active");
  });
});
