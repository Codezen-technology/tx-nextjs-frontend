import type { Learner } from "@/types/business-dashboard";

/**
 * Whether a certificate may be generated for this learner.
 *
 * Progress alone is not enough: a learner can reach 100% having failed the
 * quizzes, and issuing a certificate is the one action on this page that cannot
 * be taken back. A row with no score yet is *not* eligible — "we have not
 * checked" and "they passed" are different answers, and only one of them
 * justifies a certificate.
 */
export function canGenerateCertificate(
  learner: Pick<Learner, "progress" | "quiz_scores">,
  passMark: number,
): boolean {
  if ((learner.progress ?? 0) < 100) return false;
  const percentage = learner.quiz_scores?.percentage;
  return percentage == null ? false : percentage >= passMark;
}

/** Why the Generate button is absent, for a learner who has finished the course. */
export function certificateBlockedReason(
  learner: Pick<Learner, "quiz_scores">,
  passMark: number,
): string {
  return learner.quiz_scores?.percentage == null
    ? "Awaiting score"
    : `Below ${passMark}% pass mark`;
}
