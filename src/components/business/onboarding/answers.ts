import type {
  BusinessSettings,
  NotificationPrefs,
  OnboardingPayload,
} from "@/types/business-dashboard";
import type { AuthUser } from "@/types/user";

/**
 * Everything the wizard has been told, in one place.
 *
 * Nine fields across seven steps is more than a `useState` per field can hold
 * legibly — and the step predicates, the summary and the submit payload all
 * need to read the same "what do we know so far". One object gives them one
 * answer.
 */
export interface Answers {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  companySector: string;
  /** Top of the chosen band; null until the manager picks one. */
  companySize: number | null;
  passingMark: number;
  selfDownload: boolean;
  notifications: NotificationPrefs;
}

export const PASSING_MARK_MIN = 50;
export const PASSING_MARK_MAX = 100;
export const PASSING_MARK_DEFAULT = 80;
export const PASSING_MARK_PRESETS = [60, 70, 75, 80, 85, 90, 100];

/**
 * Team-size bands, each carrying the integer stored on the business row.
 *
 * Read back by range rather than exact match, so the four bands this list
 * replaces (tops 10, 49, 199, 200) still resolve and nothing needs migrating.
 */
export const SIZE_BANDS = [
  { value: 10, label: "1 – 10 employees" },
  { value: 49, label: "11 – 49 employees" },
  { value: 99, label: "50 – 99 employees" },
  { value: 249, label: "100 – 249 employees" },
  { value: 250, label: "250+ employees" },
] as const;

export function sizeBandLabel(value: number | null | undefined): string | null {
  if (!value || value < 1) return null;
  const band = SIZE_BANDS.find((b) => value <= b.value) ?? SIZE_BANDS[SIZE_BANDS.length - 1];
  return band.label;
}

export const NOTIFICATION_DEFAULTS: NotificationPrefs = {
  notify_course_completed: true,
  notify_certificate_issued: true,
  notify_course_not_started: true,
  notify_course_not_completed: true,
  notify_new_user: false,
  notify_course_assigned: false,
};

const NOTIFICATION_KEYS = Object.keys(NOTIFICATION_DEFAULTS) as (keyof NotificationPrefs)[];

export const NOTIFICATION_LABELS: Record<keyof NotificationPrefs, string> = {
  notify_course_completed: "A learner completes a course",
  notify_certificate_issued: "A certificate is issued",
  notify_course_not_started: "A learner hasn't started an assigned course",
  notify_course_not_completed: "A learner hasn't completed a course in time",
  notify_new_user: "A new user is added to your team",
  notify_course_assigned: "A course is assigned to a learner",
};

/**
 * Seed from what is already known: the settings record for the business, the
 * signed-in account for the person. Nobody should retype their own email
 * address to get into their dashboard.
 */
export function initialAnswers(settings: BusinessSettings, user: AuthUser | null): Answers {
  const stored = settings.company_size;

  return {
    fullName: user?.displayName ?? "",
    email: user?.email ?? "",
    phone: settings.phone ?? "",
    jobTitle: settings.job_title ?? "",
    companyName: settings.company_name ?? "",
    companySector: settings.company_sector ?? "",
    companySize:
      stored && stored > 0 ? (SIZE_BANDS.find((b) => stored <= b.value)?.value ?? 250) : null,
    passingMark: settings.passing_mark ?? PASSING_MARK_DEFAULT,
    selfDownload: settings.certificate_self_download ?? true,
    notifications: NOTIFICATION_KEYS.reduce((prefs, key) => {
      prefs[key] = settings[key] ?? NOTIFICATION_DEFAULTS[key];
      return prefs;
    }, {} as NotificationPrefs),
  };
}

/*
 * Deliberately loose: it separates "looks like an address" from "left blank or
 * obviously not one", which is all a form can honestly check. Whether the
 * address is free is the server's question, answered on completion.
 */
export const looksLikeEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

export function toCompletionPayload(answers: Answers): OnboardingPayload {
  return {
    display_name: answers.fullName.trim() || undefined,
    email: answers.email.trim() || undefined,
    phone: answers.phone.trim(),
    job_title: answers.jobTitle.trim(),
    company_name: answers.companyName.trim(),
    company_size: answers.companySize ?? undefined,
    company_sector: answers.companySector.trim(),
    passing_mark: answers.passingMark,
    certificate_self_download: answers.selfDownload,
    ...answers.notifications,
  };
}
