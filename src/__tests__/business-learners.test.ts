import { describe, expect, it } from "vitest";
import { deriveLearnerStatus, partitionLearners } from "@/lib/utils/business-learners";
import type { Learner } from "@/types/business-dashboard";

function learner(overrides: Partial<Learner> = {}): Learner {
  return {
    id: 1,
    user_id: 1,
    email: "a@example.test",
    display_name: "A",
    role: "learner",
    status: "active",
    ...overrides,
  };
}

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

describe("partitionLearners", () => {
  it("splits a team into enrolled, unassigned, pending and archived", () => {
    const learners = [
      learner({ id: 1, user_id: 11, last_login: "2026-08-01" }), // enrolled
      learner({ id: 2, user_id: 12, last_login: "2026-08-01" }), // unassigned
      learner({ id: 3, user_id: 13 }), // pending — never signed in
      learner({ id: 4, user_id: 14, status: "inactive", last_login: "2026-08-01" }), // archived
    ];

    expect(partitionLearners(learners, new Set([11]))).toEqual({
      total: 4,
      enrolled: 1,
      unassigned: 1,
      pending: 1,
      archived: 1,
    });
  });

  it("does not count an archived learner as enrolled even when they hold an assignment", () => {
    const learners = [learner({ user_id: 11, status: "inactive", last_login: "2026-08-01" })];

    const result = partitionLearners(learners, new Set([11]));

    expect(result.archived).toBe(1);
    expect(result.enrolled).toBe(0);
  });

  it("returns zeroes for an empty team", () => {
    expect(partitionLearners([], new Set())).toEqual({
      total: 0,
      enrolled: 0,
      unassigned: 0,
      pending: 0,
      archived: 0,
    });
  });
});
