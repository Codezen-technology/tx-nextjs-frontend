"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SUPPORT_ISSUES } from "@/lib/constants/support-issues";
import type { SupportIssueSlug } from "@/types/cancellations";

interface IssueTypePickerProps {
  /** Called when the user picks an issue (wizard mode). */
  onSelect?: (slug: SupportIssueSlug) => void;
  /** Highlight the currently selected issue. */
  selected?: SupportIssueSlug | null;
  /** Link each card to /support-request?issue=… instead of onSelect. */
  linkMode?: boolean;
  className?: string;
}

export function IssueTypePicker({
  onSelect,
  selected,
  linkMode = false,
  className,
}: IssueTypePickerProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {SUPPORT_ISSUES.map((issue) => {
        const isSelected = selected === issue.slug;
        const inner = (
          <>
            <span className="font-open-sans text-base font-semibold text-neutral-900">
              {issue.title}
            </span>
            <span className="mt-1 block font-open-sans text-sm text-neutral-500">
              {issue.description}
            </span>
          </>
        );

        if (linkMode) {
          return (
            <li key={issue.slug}>
              <Link
                href={`/support-request?issue=${issue.slug}`}
                className="block rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
              >
                {inner}
              </Link>
            </li>
          );
        }

        return (
          <li key={issue.slug}>
            <button
              type="button"
              onClick={() => onSelect?.(issue.slug)}
              className={cn(
                "w-full rounded-xl border bg-white p-5 text-left transition-colors",
                isSelected
                  ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200"
                  : "border-neutral-200 hover:border-primary-300 hover:bg-primary-50/40",
              )}
            >
              {inner}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
