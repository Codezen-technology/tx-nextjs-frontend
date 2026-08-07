"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IPlayerUnit } from "@/types/player";

interface PlayerHoverNavProps {
  prev: IPlayerUnit | null;
  next: IPlayerUnit | null;
  onNavigate: (id: number) => void;
  visible: boolean;
}

export function PlayerHoverNav({ prev, next, onNavigate, visible }: PlayerHoverNavProps) {
  return (
    <>
      {prev ? (
        <button
          type="button"
          onClick={() => onNavigate(prev.id)}
          className={cn(
            "absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80",
            visible ? "opacity-100" : "opacity-0",
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
            "absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80",
            visible ? "opacity-100" : "opacity-0",
          )}
          aria-label="Next unit"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}
    </>
  );
}
