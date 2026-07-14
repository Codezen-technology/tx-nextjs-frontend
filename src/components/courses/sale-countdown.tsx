"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SaleCountdownProps {
  /** ISO 8601 datetime the sale ends. */
  endsAt: string;
  className?: string;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Live "Offer expires in HH:MM:SS" countdown. Renders nothing once expired. */
export function SaleCountdown({ endsAt, className }: SaleCountdownProps) {
  const target = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!Number.isFinite(target) || remaining <= 0) return null;

  return (
    <span className={className ?? "inline-flex items-center gap-1 text-xs text-[#dc3545]"}>
      <Clock className="h-3 w-3" />
      Offer expires in {formatRemaining(remaining)}
    </span>
  );
}
