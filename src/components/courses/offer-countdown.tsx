"use client";

import { useEffect, useState } from "react";

interface OfferCountdownProps {
  className?: string;
}

/** Fixed recurring period — resets to 06:00:00 every 6 hours, in sync across every card. */
const PERIOD_MS = 6 * 60 * 60 * 1000;

function remainingInPeriod(): number {
  return PERIOD_MS - (Date.now() % PERIOD_MS);
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

/**
 * Synthetic "OFFER ENDS IN" countdown — a static 6-hour period computed purely from
 * wall-clock time (not tied to the course's real sale end date), so it resets and
 * recurs automatically and stays identical across every card at any given moment.
 */
export function OfferCountdown({ className }: OfferCountdownProps) {
  // Start `null` so the server-rendered markup and the client's first render match
  // exactly (Date.now() differs between the two, which would otherwise cause a
  // hydration mismatch). The real value is set client-side only, after mount.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(remainingInPeriod());
    const id = setInterval(() => setRemaining(remainingInPeriod()), 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  return (
    <div className={className ?? "flex flex-col items-end"}>
      <span className="font-open-sans text-xs tracking-[0.24px] text-neutral-400">
        OFFER ENDS IN
      </span>
      <span className="font-suse text-lg leading-tight font-extrabold text-[#db0302]">
        {formatRemaining(remaining)}
      </span>
    </div>
  );
}
