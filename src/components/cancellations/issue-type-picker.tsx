"use client";

import { cn } from "@/lib/utils/cn";
import { IssueTypeCard } from "@/components/cancellations/issue-type-card";
import { SUPPORT_ISSUES } from "@/lib/constants/support-issues";
import type { SupportIssue } from "@/lib/constants/support-issues";
import type { SupportIssueSlug } from "@/types/cancellations";

interface IssueTypePickerProps {
  onSelect?: (slug: SupportIssueSlug) => void;
  selected?: SupportIssueSlug | null;
  linkMode?: boolean;
  issues?: SupportIssue[];
  className?: string;
}

export function IssueTypePicker({
  onSelect,
  selected,
  linkMode = false,
  issues = SUPPORT_ISSUES,
  className,
}: IssueTypePickerProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {issues.map((issue) => (
        <li key={issue.slug}>
          <IssueTypeCard
            issue={issue}
            selected={selected === issue.slug}
            href={linkMode ? `/support-request?issue=${issue.slug}` : undefined}
            onClick={linkMode ? undefined : () => onSelect?.(issue.slug)}
          />
        </li>
      ))}
    </ul>
  );
}
