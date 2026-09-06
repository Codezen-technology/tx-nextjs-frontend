import type { Learner } from "@/types/business-dashboard";

/**
 * Display status for a team member.
 *
 * `pending` is not a stored value — a learner who has been created but has
 * never signed in is neither active nor archived, and showing them as "active"
 * hides the fact that the invitation was never accepted.
 */
export type LearnerDisplayStatus = "active" | "pending" | "archived";

export function deriveLearnerStatus(
  learner: Pick<Learner, "status" | "last_login">,
): LearnerDisplayStatus {
  if (learner.status === "inactive") return "archived";
  if (!learner.last_login) return "pending";
  return "active";
}
