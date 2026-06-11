"use client";

import { useCallback, useMemo } from "react";
import { useCompleteUnit, useFinishCourse } from "@/lib/hooks/usePlayer";
import { getPlayableUnits } from "@/lib/player/progress";
import type { IPlayerCourse } from "@/types/player";

export function useUnitCompletion(course: IPlayerCourse | undefined, courseId: number) {
  const complete = useCompleteUnit(courseId);
  const finish = useFinishCourse(courseId);

  const playableUnits = useMemo(() => (course ? getPlayableUnits(course) : []), [course]);

  const completedDuration = useMemo(
    () => playableUnits.filter((u) => u.status >= 1).reduce((acc, u) => acc + (u.duration || 0), 0),
    [playableUnits],
  );

  const courseTotalDuration = useMemo(
    () => playableUnits.reduce((acc, u) => acc + (u.duration || 0), 0),
    [playableUnits],
  );

  const incompleteUnits = useMemo(() => playableUnits.filter((u) => u.status < 1), [playableUnits]);

  const calculateUnitProgress = useCallback(
    (unitDuration: number) => {
      if (unitDuration && courseTotalDuration && completedDuration !== null) {
        return Math.round(((completedDuration + unitDuration) / courseTotalDuration) * 100);
      }
      return 0;
    },
    [completedDuration, courseTotalDuration],
  );

  const isLastUnitToComplete = useCallback(
    (unitId: number) => incompleteUnits.length === 1 && incompleteUnits[0]?.id === unitId,
    [incompleteUnits],
  );

  const handleUnitCompletion = useCallback(
    async (unitId: number, unitDuration: number): Promise<boolean> => {
      try {
        const progress = calculateUnitProgress(unitDuration);
        await complete.mutateAsync({ unitId, progress });
        if (isLastUnitToComplete(unitId)) {
          await finish.mutateAsync();
        }
        return true;
      } catch {
        return false;
      }
    },
    [calculateUnitProgress, complete, finish, isLastUnitToComplete],
  );

  return {
    handleUnitCompletion,
    calculateUnitProgress,
    isLastUnitToComplete,
    incompleteUnits,
    isCompleting: complete.isPending || finish.isPending,
    markingUnitId: complete.isPending ? complete.variables?.unitId : null,
  };
}
