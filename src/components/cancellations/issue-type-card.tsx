"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  SUPPORT_ISSUE_ICON_MAP,
  SUPPORT_ISSUE_SLUG_ICON,
} from "@/lib/constants/support-issue-icons";
import type { SupportIssue } from "@/lib/constants/support-issues";

interface IssueTypeCardProps {
  issue: SupportIssue;
  selected?: boolean;
  href?: string;
  onClick?: () => void;
}

export function IssueTypeCard({ issue, selected = false, href, onClick }: IssueTypeCardProps) {
  const Icon = SUPPORT_ISSUE_ICON_MAP[SUPPORT_ISSUE_SLUG_ICON[issue.slug]];

  const inner = (
    <>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-600",
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-open-sans text-base font-semibold text-neutral-900">
          {issue.title}
        </span>
        <span className="mt-1 block font-open-sans text-sm text-neutral-500">
          {issue.description}
        </span>
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
    selected
      ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200"
      : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/40",
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${issue.title}: ${issue.description}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-pressed={selected}
      aria-label={`${issue.title}: ${issue.description}`}
    >
      {inner}
    </button>
  );
}
