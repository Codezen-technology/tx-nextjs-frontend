import {
  ArrowLeftRight,
  CircleAlert,
  CreditCard,
  HelpCircle,
  Lock,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import type { SupportIssueIcon } from "@/lib/constants/support-issues";
import type { SupportIssueSlug } from "@/types/cancellations";

export const SUPPORT_ISSUE_ICON_MAP: Record<SupportIssueIcon, LucideIcon> = {
  lock: Lock,
  swap: ArrowLeftRight,
  card: CreditCard,
  alert: CircleAlert,
  monitor: Monitor,
  help: HelpCircle,
};

export const SUPPORT_ISSUE_SLUG_ICON: Record<SupportIssueSlug, SupportIssueIcon> = {
  access: "lock",
  wrong_course: "swap",
  duplicate_charge: "card",
  not_expected: "alert",
  technical: "monitor",
  other: "help",
};
