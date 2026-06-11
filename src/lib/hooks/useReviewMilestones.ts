"use client";

import { useEffect, useRef } from "react";
import { REVIEW_MILESTONES } from "@/lib/player/constants";
import { usePlayerStore } from "@/lib/stores/player.store";

/** Auto-open review modal at 50%, 75%, 100% if user has not reviewed yet. */
export function useReviewMilestones(progress: number, hasReview: boolean) {
  const openReview = usePlayerStore((s) => s.openReviewModal);
  const lastShown = useRef(0);

  useEffect(() => {
    if (hasReview) return;
    const milestone = REVIEW_MILESTONES.find((m) => progress >= m && lastShown.current < m);
    if (milestone) {
      openReview();
      lastShown.current = milestone;
    }
  }, [progress, hasReview, openReview]);
}
