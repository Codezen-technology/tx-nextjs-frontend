"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLearnerQuizScores } from "@/lib/hooks/useBusinessDashboard";

interface QuizScoresDialogProps {
  courseId: number;
  learner: { userId: number; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-quiz breakdown for one learner on one course.
 *
 * There is no per-quiz pass/fail or attempt date: WPLMS stores marks as post
 * meta keyed by user id and records neither, so the API does not invent them.
 */
export function QuizScoresDialog({ courseId, learner, onOpenChange }: QuizScoresDialogProps) {
  const { data, isLoading, isError } = useLearnerQuizScores(
    learner ? courseId : null,
    learner?.userId ?? null,
  );

  const rows = data?.quiz_scores ?? [];

  return (
    <Dialog open={learner != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quiz scores</DialogTitle>
          <DialogDescription>{learner?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-4 text-sm text-red-600">Could not load quiz scores.</p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-sm text-neutral-300">
            No quiz attempts recorded for this learner yet.
          </p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-neutral-300 uppercase">
                  <th className="pb-2">Quiz</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-neutral-30 divide-y">
                {rows.map((row) => (
                  <tr key={row.quiz_id}>
                    <td className="py-2 text-neutral-900">{row.quiz_name}</td>
                    <td className="py-2 text-right text-neutral-700">
                      {row.score} / {row.max_score}
                    </td>
                    <td className="py-2 text-right font-medium text-neutral-900">
                      {row.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-neutral-30 border-t font-semibold">
                  <td className="pt-2 text-neutral-900">
                    Overall ({data?.total_quizzes ?? rows.length} quizzes)
                  </td>
                  <td className="pt-2 text-right text-neutral-700">
                    {data?.score ?? 0} / {data?.max_score ?? 0}
                  </td>
                  <td className="pt-2 text-right text-neutral-900">{data?.percentage ?? 0}%</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-xs text-neutral-300">
              Pass or fail is this overall percentage against your organisation&rsquo;s passing
              mark.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
