"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IPlayerUnit } from "@/types/player";

interface PlayerContentOverlaysProps {
  prev: IPlayerUnit | null;
  next: IPlayerUnit | null;
  onNavigate: (unitId: number) => void;
}

/** Prev/next hover controls only — completion is via sidebar circle (WP parity). */
export const PlayerContentOverlays = memo(function PlayerContentOverlays({
  prev,
  next,
  onNavigate,
}: PlayerContentOverlaysProps) {
  return (
    <>
      {prev ? (
        <button
          type="button"
          onClick={() => onNavigate(prev.id)}
          className={cn(
            "absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100",
          )}
          aria-label="Previous unit"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}
      {next ? (
        <button
          type="button"
          onClick={() => onNavigate(next.id)}
          className={cn(
            "absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100",
          )}
          aria-label="Next unit"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}
    </>
  );
});
