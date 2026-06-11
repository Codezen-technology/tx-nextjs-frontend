"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyReview, usePlayerStatus } from "@/lib/hooks/usePlayer";
import { useReviewMilestones } from "@/lib/hooks/useReviewMilestones";
import { useUnitCompletion } from "@/lib/hooks/useUnitCompletion";
import {
  calculatePlayerProgress,
  getNextIncompleteUnit,
  getPlayableUnits,
} from "@/lib/player/progress";
import { usePlayerStore } from "@/lib/stores/player.store";
import { PlayerTopBar } from "@/components/player/player-top-bar";
import { PlayerSidebarShell } from "@/components/player/player-sidebar-shell";
import { PlayerContent } from "@/components/player/player-content";
import { PlayerCourseTabs } from "@/components/player/player-course-tabs";
import { CompletionModal } from "@/components/player/completion-modal";
import { ReviewModal } from "@/components/player/review-modal";
import type { IPlayerUnit } from "@/types/player";

interface CoursePlayerProps {
  courseId: number;
  unitId: number;
}

/** Full-screen course player shell (parity with WP RootContainer). */
export function CoursePlayer({ courseId, unitId }: CoursePlayerProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { data: course, isLoading, isError, refetch } = usePlayerStatus(courseId);
  const { data: myReview, isLoading: reviewLoading } = useMyReview(courseId);
  const setCourse = usePlayerStore((s) => s.setCourse);
  const setCurrentUnit = usePlayerStore((s) => s.setCurrentUnit);

  const { handleUnitCompletion, markingUnitId } = useUnitCompletion(course, courseId);

  useEffect(() => {
    setCourse(courseId);
    setCurrentUnit(unitId);
  }, [courseId, unitId, setCourse, setCurrentUnit]);

  const items: IPlayerUnit[] = useMemo(() => course?.courseitems ?? [], [course]);
  const playableItems = useMemo(() => (course ? getPlayableUnits(course) : []), [course]);
  const currentIdx = playableItems.findIndex((i) => i.id === unitId);
  const current = currentIdx >= 0 ? playableItems[currentIdx] : null;
  const prev = currentIdx > 0 ? playableItems[currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < playableItems.length - 1 ? playableItems[currentIdx + 1] : null;

  const progress = course ? calculatePlayerProgress(course) : 0;
  const hasReview = Boolean(myReview?.comment_ID || myReview?.review);

  useReviewMilestones(progress, hasReview);

  const goTo = useCallback(
    (id: number) => router.push(`/learn/${courseId}/${id}`),
    [router, courseId],
  );

  const onCompleteUnit = useCallback(
    async (id: number, options?: { advance?: boolean }) => {
      const unit = playableItems.find((u) => u.id === id);
      if (!unit) return;

      const shouldAdvance = options?.advance !== false;
      const nextUnit = getNextIncompleteUnit(playableItems, id);

      if (unit.status < 1) {
        const ok = await handleUnitCompletion(id, unit.duration || 0);
        if (!ok) return;
      }

      if (shouldAdvance && nextUnit) {
        goTo(nextUnit.id);
      }
    },
    [playableItems, handleUnitCompletion, goTo],
  );

  if (isLoading) {
    return (
      <div className="course-player flex h-svh items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="course-player flex h-svh items-center justify-center bg-black p-4">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600">Could not load course. Please try again.</p>
          <Button className="mt-4" variant="destructive" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-player flex min-h-svh flex-col bg-black">
      <PlayerTopBar
        courseTitle={course.course_title}
        progress={progress}
        hasReview={hasReview}
        reviewLoading={reviewLoading}
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 flex-col lg:mt-16 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <PlayerContent
            course={course}
            courseId={courseId}
            item={current}
            prev={prev}
            next={next}
            onNavigate={goTo}
            onCompleteUnit={onCompleteUnit}
          />
          <PlayerCourseTabs
            items={items}
            courseId={courseId}
            activeUnitId={unitId}
            onCompleteUnit={onCompleteUnit}
            markingUnitId={markingUnitId}
          />
        </div>

        <PlayerSidebarShell
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          course={course}
          courseId={courseId}
          items={items}
          activeUnitId={unitId}
          progress={progress}
          onCompleteUnit={onCompleteUnit}
          markingUnitId={markingUnitId}
        />
      </div>

      <CompletionModal courseId={courseId} />
      <ReviewModal courseId={courseId} />
    </div>
  );
}
