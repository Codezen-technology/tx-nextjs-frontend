"use client";

import { CheckCircle2 } from "lucide-react";
import type { AggregatedActiveSubscription } from "@/types/business-pricing";

interface ActiveSubBannerProps {
  activeSub: AggregatedActiveSubscription;
}

export function ActiveSubBanner({ activeSub }: ActiveSubBannerProps) {
  const pct =
    activeSub.total_seats > 0
      ? Math.min(100, Math.round((activeSub.assigned_seats / activeSub.total_seats) * 100))
      : 0;

  return (
    <div className="mb-4 rounded-lg border border-[#3F576F]/20 bg-[#3F576F]/5 px-4 py-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-[#3F576F]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your plan is active — all courses unlocked for your team
        </div>
        {activeSub.next_payment && (
          <span className="ml-3 shrink-0 text-xs text-[#3F576F]/70">
            Renews{" "}
            {new Date(activeSub.next_payment).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <div className="mb-1 flex justify-between text-xs text-[#3F576F]">
        <span>
          <strong>{activeSub.assigned_seats}</strong> of <strong>{activeSub.total_seats}</strong>{" "}
          seats assigned
        </span>
        <span className="font-medium text-green-700">{activeSub.available_seats} available</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#3F576F]/20">
        <div
          className="h-1.5 rounded-full bg-[#3F576F] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {activeSub.available_seats === 0 && (
        <p className="mt-2 text-xs text-amber-700">
          All seats are assigned. Add more seats below to onboard more team members.
        </p>
      )}
    </div>
  );
}
