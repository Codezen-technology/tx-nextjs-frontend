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

/** Partition used by the Overview "Team Overview" card. */
export interface TeamPartition {
  total: number;
  enrolled: number;
  unassigned: number;
  pending: number;
  archived: number;
}

/**
 * Partition a page of learners by display status and assignment.
 *
 * `assignedUserIds` comes from the assignment list, so "enrolled" means the
 * learner has at least one course — not merely that they have logged in.
 */
export function partitionLearners(
  learners: Learner[],
  assignedUserIds: ReadonlySet<number>,
): TeamPartition {
  const partition: TeamPartition = {
    total: learners.length,
    enrolled: 0,
    unassigned: 0,
    pending: 0,
    archived: 0,
  };

  for (const learner of learners) {
    const status = deriveLearnerStatus(learner);

    if (status === "archived") {
      partition.archived += 1;
      continue;
    }

    if (status === "pending") {
      partition.pending += 1;
      continue;
    }

    if (assignedUserIds.has(learner.user_id)) {
      partition.enrolled += 1;
    } else {
      partition.unassigned += 1;
    }
  }

  return partition;
}
