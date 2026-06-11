"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCourseCurriculum } from "@/lib/hooks/useCourses";
import { useCourseProgress } from "@/lib/hooks/useUnits";

export default function LearnStartPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = Number(params.courseId);

  const { data: curriculum, isLoading } = useCourseCurriculum(courseId);
  const { data: progress } = useCourseProgress(courseId);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    if (isLoading) return;

    const lastUnitId = progress?.lastUnitId;
    if (lastUnitId) {
      router.replace(`/learn/${courseId}/${lastUnitId}`);
      return;
    }

    const first = curriculum?.sections?.flatMap((s) => s.units)?.find((u) => u.id)?.id;
    if (first) {
      router.replace(`/learn/${courseId}/${first}`);
    } else if (!isLoading) {
      // No resolvable unit (empty/locked curriculum). The public course page is
      // slug-only, and we only have the numeric id here, so send the user back
      // to their learning dashboard rather than a 404.
      router.replace("/dashboard/my-learning");
    }
  }, [courseId, curriculum, progress, isLoading, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Preparing your unit\u2026</span>
      </div>
    </div>
  );
}
