"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { playerService } from "@/lib/services/player";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePlayerStore } from "@/lib/stores/player.store";
import type { ApiError } from "@/lib/api/error";
import type { IQuiz, QuizAnswers } from "@/types/player";

// ─── Course / unit ──────────────────────────────────────────────────────────

export function usePlayerStatus(courseId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.player.status(courseId ?? 0),
    queryFn: () => playerService.status(courseId as number),
    enabled: Boolean(courseId),
  });
}

export function useUnitContent(
  courseId: number | null | undefined,
  unitId: number | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.player.unit(courseId ?? 0, unitId ?? 0),
    queryFn: () => playerService.unitContent(unitId as number, courseId as number),
    enabled: Boolean(courseId && unitId),
  });
}

export function useCompleteUnit(courseId: number) {
  const qc = useQueryClient();
  const openCompletion = usePlayerStore((s) => s.openCompletionModal);
  return useMutation({
    mutationFn: ({ unitId, progress }: { unitId: number; progress?: number }) =>
      playerService.completeUnit(unitId, courseId, progress),
    onSuccess: (data) => {
      const res = data as {
        completion_message?: string;
        course_complete?: boolean | number;
      };
      const finished = res?.course_complete === true || res?.course_complete === 1;
      if (finished) openCompletion(res.completion_message);
      void qc.invalidateQueries({ queryKey: queryKeys.player.status(courseId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not mark complete"),
  });
}

export function useFinishCourse(courseId: number) {
  const qc = useQueryClient();
  const openCompletion = usePlayerStore((s) => s.openCompletionModal);
  return useMutation({
    mutationFn: () => playerService.finish(courseId),
    onSuccess: (data) => {
      openCompletion(data?.finished?.message);
      void qc.invalidateQueries({ queryKey: queryKeys.player.status(courseId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not finish course"),
  });
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export function useQuiz(courseId: number, quizId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.player.quiz(courseId, quizId ?? 0),
    queryFn: () => playerService.quiz(quizId as number, courseId),
    enabled: Boolean(courseId && quizId),
  });
}

export function useStartQuiz(courseId: number) {
  return useMutation({
    mutationFn: (quizId: number) => playerService.startQuiz(quizId, courseId),
  });
}

export function useSubmitQuiz(courseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      quiz,
      answers,
    }: {
      quizId: number;
      quiz: IQuiz;
      answers: QuizAnswers;
    }) => playerService.submitQuiz(quizId, courseId, quiz, answers),
    onSuccess: (_res, { quizId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.player.quiz(courseId, quizId) });
      void qc.invalidateQueries({ queryKey: queryKeys.player.status(courseId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Quiz submission failed"),
  });
}

// ─── Assignment ─────────────────────────────────────────────────────────────

export function useAssignment(courseId: number, assignmentId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.player.assignment(courseId, assignmentId ?? 0),
    queryFn: () => playerService.assignment(assignmentId as number, courseId),
    enabled: Boolean(courseId && assignmentId),
  });
}

export function useStartAssignment(courseId: number) {
  return useMutation({
    mutationFn: (assignmentId: number) => playerService.startAssignment(assignmentId, courseId),
  });
}

export function useUploadAssignment(courseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      files,
      comment,
    }: {
      assignmentId: number;
      files: File[];
      comment: string;
    }) => playerService.uploadAssignment(assignmentId, files, comment),
    onSuccess: (_res, { assignmentId }) => {
      toast.success("Assignment submitted");
      void qc.invalidateQueries({ queryKey: queryKeys.player.assignment(courseId, assignmentId) });
      void qc.invalidateQueries({ queryKey: queryKeys.player.status(courseId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Upload failed"),
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function useCourseReviews(courseId: number) {
  return useQuery({
    queryKey: queryKeys.player.reviews(courseId),
    queryFn: () => playerService.courseReviews(courseId),
    enabled: Boolean(courseId),
  });
}

export function useMyReview(courseId: number) {
  return useQuery({
    queryKey: queryKeys.player.myReview(courseId),
    queryFn: () => playerService.myReview(courseId),
    enabled: Boolean(courseId),
    retry: false,
  });
}

export function useRetakeQuiz(courseId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: number) => playerService.retakeQuiz(quizId, courseId),
    onSuccess: (_res, quizId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.player.quiz(courseId, quizId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not retake quiz"),
  });
}

export function useSubmitReview(courseId: number) {
  const qc = useQueryClient();
  const closeReview = usePlayerStore((s) => s.closeReviewModal);
  return useMutation({
    mutationFn: ({ rating, review, title }: { rating: number; review: string; title?: string }) =>
      playerService.submitReview(courseId, rating, review, title),
    onSuccess: () => {
      toast.success("Review submitted");
      closeReview();
      void qc.invalidateQueries({ queryKey: queryKeys.player.reviews(courseId) });
      void qc.invalidateQueries({ queryKey: queryKeys.player.myReview(courseId) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not submit review"),
  });
}
