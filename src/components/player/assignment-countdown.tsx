"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AssignmentCountdownProps {
  remainingSeconds: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AssignmentCountdown({ remainingSeconds }: AssignmentCountdownProps) {
  const [remaining, setRemaining] = useState(remainingSeconds);

  useEffect(() => {
    setRemaining(remainingSeconds);
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  if (remaining <= 0) return null;

  return (
    <div
      className={cn(
        "mb-4 rounded-md px-4 py-2 text-center font-mono text-sm",
        remaining < 300 ? "bg-red-950 text-red-200" : "bg-gray-800 text-gray-200",
      )}
    >
      Time remaining: {formatTime(remaining)}
    </div>
  );
}
