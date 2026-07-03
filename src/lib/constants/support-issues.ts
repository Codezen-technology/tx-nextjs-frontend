import type { SupportIssueSlug } from "@/types/cancellations";

export type SupportIssueIcon = "lock" | "swap" | "card" | "alert" | "monitor" | "help";

export interface SupportIssue {
  slug: SupportIssueSlug;
  title: string;
  description: string;
  fixCopy: string;
  /** Step-2 form heading, tailored to the selected issue. */
  replyHeading: string;
  icon: SupportIssueIcon;
}

export const SUPPORT_ISSUES: SupportIssue[] = [
  {
    slug: "access",
    title: "I can't access my course",
    description: "Login problems, password reset, course not showing",
    icon: "lock",
    fixCopy:
      "Most access problems are sorted in minutes — we'll check your account and restore access, or resend your login details.",
    replyHeading: "Let's get you back in",
  },
  {
    slug: "wrong_course",
    title: "I bought the wrong course",
    description: "Enrolled in something by mistake",
    icon: "swap",
    fixCopy:
      "We can swap it for the correct course or process a refund — whichever you prefer. Tell us what you need below.",
    replyHeading: "Let's sort your enrolment",
  },
  {
    slug: "duplicate_charge",
    title: "I was charged twice",
    description: "Duplicate order or payment error",
    icon: "card",
    fixCopy:
      "We'll check your payment records straight away and refund any duplicate charge within 1–3 working days.",
    replyHeading: "Tell us about the duplicate charge",
  },
  {
    slug: "not_expected",
    title: "The course wasn't what I expected",
    description: "Content, quality, or relevance issue",
    icon: "alert",
    fixCopy:
      "Tell us what fell short — we'll find the best resolution, whether that's a swap, additional guidance, or a refund.",
    replyHeading: "Tell us what fell short",
  },
  {
    slug: "technical",
    title: "Technical problem",
    description: "Video not playing, certificate error, etc.",
    icon: "monitor",
    fixCopy:
      "We troubleshoot remotely and usually have technical issues resolved the same day. Describe what you're seeing below.",
    replyHeading: "Tell us about the technical issue",
  },
  {
    slug: "other",
    title: "Other",
    description: "Something else not listed above",
    icon: "help",
    fixCopy:
      "Tell us what's going on and we'll route your request to the right team member for a same-day response.",
    replyHeading: "Tell us what's going on",
  },
];

/** Issue gate on `/cancellations` — five shortcuts; “Other” is support-request only. */
export const CANCELLATIONS_ISSUE_GATE = SUPPORT_ISSUES.filter((issue) => issue.slug !== "other");

export const SUPPORT_ISSUE_BY_SLUG = Object.fromEntries(
  SUPPORT_ISSUES.map((issue) => [issue.slug, issue]),
) as Record<SupportIssueSlug, SupportIssue>;

export function isSupportIssueSlug(value: string | null | undefined): value is SupportIssueSlug {
  return !!value && value in SUPPORT_ISSUE_BY_SLUG;
}

/** Map frontend issue slug to the GF hidden `issue_type` parameter value. */
export const ISSUE_TYPE_PARAM = "issue_type";
