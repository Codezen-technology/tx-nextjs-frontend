import type { SupportIssueSlug } from "@/types/cancellations";

export interface SupportIssue {
  slug: SupportIssueSlug;
  title: string;
  description: string;
  fixCopy: string;
}

export const SUPPORT_ISSUES: SupportIssue[] = [
  {
    slug: "access",
    title: "I can't access my course",
    description: "Login problems, password reset, course not showing",
    fixCopy:
      "Most access problems are sorted in minutes — we'll check your account and restore access, or resend your login details.",
  },
  {
    slug: "wrong_course",
    title: "I bought the wrong course",
    description: "Enrolled in something by mistake",
    fixCopy:
      "We can swap it for the correct course or process a refund — whichever you prefer. Tell us what you need below.",
  },
  {
    slug: "duplicate_charge",
    title: "I was charged twice",
    description: "Duplicate order or payment error",
    fixCopy:
      "We'll check your payment records straight away and refund any duplicate charge within 1–3 working days.",
  },
  {
    slug: "not_expected",
    title: "The course wasn't what I expected",
    description: "Content, quality, or relevance issue",
    fixCopy:
      "Tell us what fell short — we'll find the best resolution, whether that's a swap, additional guidance, or a refund.",
  },
  {
    slug: "technical",
    title: "Technical problem",
    description: "Video not playing, certificate error, etc.",
    fixCopy:
      "We troubleshoot remotely and usually have technical issues resolved the same day. Describe what you're seeing below.",
  },
  {
    slug: "other",
    title: "Other",
    description: "Something else not listed above",
    fixCopy:
      "Tell us what's going on and we'll route your request to the right team member for a same-day response.",
  },
];

export const SUPPORT_ISSUE_BY_SLUG = Object.fromEntries(
  SUPPORT_ISSUES.map((issue) => [issue.slug, issue]),
) as Record<SupportIssueSlug, SupportIssue>;

export function isSupportIssueSlug(value: string | null | undefined): value is SupportIssueSlug {
  return !!value && value in SUPPORT_ISSUE_BY_SLUG;
}

/** Map frontend issue slug to the GF hidden `issue_type` parameter value. */
export const ISSUE_TYPE_PARAM = "issue_type";
