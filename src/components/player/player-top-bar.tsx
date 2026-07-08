"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";
import { PlayerProgressCircle } from "@/components/player/player-progress-circle";
import { usePlayerStore } from "@/lib/stores/player.store";

interface PlayerTopBarProps {
  courseTitle: string;
  progress: number;
  hasReview: boolean;
  reviewLoading?: boolean;
  onToggleSidebar: () => void;
}

export function PlayerTopBar({
  courseTitle,
  progress,
  hasReview,
  reviewLoading,
  onToggleSidebar,
}: PlayerTopBarProps) {
  const router = useRouter();
  const openReview = usePlayerStore((s) => s.openReviewModal);

  return (
    <div className="fixed top-0 right-0 left-0 z-50 bg-gray-800 text-white">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/my-learning")}
            className="rounded-md p-1 text-slate-50 transition-colors hover:bg-slate-500/20"
            aria-label="Back to my learning"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="line-clamp-2 text-sm font-bold text-slate-50 sm:text-xl">{courseTitle}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <PlayerProgressCircle progress={progress} />

          {!hasReview ? (
            <button
              type="button"
              onClick={openReview}
              disabled={reviewLoading}
              className="hidden rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden sm:block"
            >
              {reviewLoading ? "Loading…" : "Leave a Review"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden rounded-md p-2 transition-colors hover:bg-gray-700 lg:flex"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="hidden h-1 bg-gray-700 sm:block">
        <div
          className="bg-player-success h-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
