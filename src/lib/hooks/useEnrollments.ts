"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enrollmentService } from "@/lib/services/enrollment";
import { queryKeys } from "@/lib/utils/query-keys";
import type { Enrollment } from "@/types/enrollment";
import type { ApiError } from "@/lib/api/error";

export function useMyEnrollments(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enrollments.me,
    queryFn: () => enrollmentService.listMine(),
    enabled: opts?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useIsEnrolled(courseId: number, enrollments?: Enrollment[]) {
  return enrollments?.find((e) => e.courseId === courseId && e.status !== "cancelled") ?? null;
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { courseId: number }) => enrollmentService.create(input),
    onMutate: async ({ courseId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.enrollments.me });
      const prev = qc.getQueryData<Enrollment[]>(queryKeys.enrollments.me);
      const optimistic: Enrollment = {
        id: -Date.now(),
        courseId,
        status: "active",
        progress: 0,
        enrolledAt: new Date().toISOString(),
        lastAccessedUnitId: null,
      };
      qc.setQueryData<Enrollment[]>(queryKeys.enrollments.me, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { prev };
    },
    onError: (err: ApiError, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.enrollments.me, ctx.prev);
      toast.error(err.message || "Could not enroll. Please try again.");
    },
    onSuccess: () => {
      toast.success("You're enrolled. Have fun learning!");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.enrollments.me });
    },
  });
}

export function useCancelEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => enrollmentService.cancel(id),
    onSuccess: () => {
      toast.success("Enrollment cancelled");
      qc.invalidateQueries({ queryKey: queryKeys.enrollments.me });
    },
    onError: (err: ApiError) => toast.error(err.message || "Could not cancel"),
  });
}
