"use client";

import { useCallback, useRef } from "react";
import { Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizPlayer } from "@/components/player/quiz-player";
import { AssignmentPlayer } from "@/components/player/assignment-player";
import { PlayerContentOverlays } from "@/components/player/player-content-overlays";
import { UnitContentDisplay } from "@/components/player/unit-content-display";
import { PlayerItemType, type IPlayerCourse, type IPlayerUnit } from "@/types/player";

interface PlayerContentProps {
  course: IPlayerCourse;
  courseId: number;
  item: IPlayerUnit | null;
  prev: IPlayerUnit | null;
  next: IPlayerUnit | null;
  onNavigate: (unitId: number) => void;
  onCompleteUnit: (unitId: number, options?: { advance?: boolean }) => void | Promise<void>;
}

export function PlayerContent({
  course,
  courseId,
  item,
  prev,
  next,
  onNavigate,
  onCompleteUnit,
}: PlayerContentProps) {
  const onCompleteUnitRef = useRef(onCompleteUnit);
  onCompleteUnitRef.current = onCompleteUnit;

  const handleVideoEnded = useCallback((unitId: number) => {
    void onCompleteUnitRef.current(unitId, { advance: true });
  }, []);

  if (!item) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black p-6">
        <Skeleton className="h-8 w-2/3 bg-gray-800" />
      </div>
    );
  }

  const isQuiz = item.type === PlayerItemType.Quiz;
  const isAssignment = item.unit_type === "assignment" || item.icon?.includes("assignment");
  const isLocked = course.lock === 1 && item.status < 1;
  const done = item.status >= 1;
  const canComplete = !isQuiz && !isAssignment && !done && !isLocked;
  const showOverlays = !isLocked && !isQuiz && !isAssignment;

  return (
    <div className="group relative flex min-h-[calc(100vh-4rem)] flex-col bg-black">
      {isLocked ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-white">
          <Lock className="h-12 w-12 text-amber-400" />
          <p className="text-lg">This content is locked. Complete previous units first.</p>
        </div>
      ) : isQuiz ? (
        <div className="p-4 sm:p-8">
          <QuizPlayer
            courseId={courseId}
            quizId={item.id}
            title={item.title}
            onContinue={onNavigate}
          />
        </div>
      ) : isAssignment ? (
        <div className="p-4 sm:p-8">
          <AssignmentPlayer courseId={courseId} assignmentId={item.id} title={item.title} />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <UnitContentDisplay
            key={`${courseId}-${item.id}`}
            courseId={courseId}
            unitId={item.id}
            unitTitle={item.title}
            canAutoComplete={canComplete}
            onVideoEnded={handleVideoEnded}
          />
        </div>
      )}

      {showOverlays ? (
        <PlayerContentOverlays prev={prev} next={next} onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}
