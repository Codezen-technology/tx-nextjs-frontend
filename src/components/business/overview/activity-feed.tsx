"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/business/status-badge";
import { useBusinessActivity } from "@/lib/hooks/useBusinessDashboard";

const PER_PAGE = 10;

/** "Today" / "3 days ago" reads better than a date in a feed of recent events. */
function relativeTime(value: string): string {
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "—";

  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  return then.toLocaleDateString("en-GB");
}

export function ActivityFeed({ departmentId = 0 }: { departmentId?: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBusinessActivity({
    page,
    per_page: PER_PAGE,
    ...(departmentId ? { department_id: departmentId } : {}),
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="border-neutral-30 space-y-3 rounded-xl border bg-white p-5 shadow-xs">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-neutral-30 rounded-xl border bg-white p-8 text-center text-sm text-red-600 shadow-xs">
        Could not load recent activity.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="No activity yet"
        description="Progress and completions across your team will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="border-neutral-30 divide-neutral-30 divide-y rounded-xl border bg-white shadow-xs">
        {items.map((event) => (
          <li
            key={`${event.learner_id}-${event.course_id}-${event.event_time}`}
            className="flex items-center gap-3 px-5 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3F576F]/10 text-xs font-semibold text-[#3F576F]">
              {(event.learner_name || "?").charAt(0).toUpperCase()}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">{event.learner_name}</span>
              {event.type === "completed" ? " completed " : ` reached ${event.progress}% of `}
              <span className="font-medium text-neutral-900">{event.course_title}</span>
            </p>
            <StatusBadge status={event.type === "completed" ? "completed" : "in_progress"} />
            <span className="w-24 shrink-0 text-right text-xs text-neutral-300">
              {relativeTime(event.event_time)}
            </span>
          </li>
        ))}
      </ul>

      <Pagination page={page} totalPages={data?.pages ?? 1} onPageChange={setPage} />
    </div>
  );
}
