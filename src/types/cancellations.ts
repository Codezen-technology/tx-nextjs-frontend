export type SupportIssueSlug =
  | "access"
  | "wrong_course"
  | "duplicate_charge"
  | "not_expected"
  | "technical"
  | "other";

export interface CancellationsHero {
  eyebrow: string;
  heading: string;
  text: string;
}

export interface CancellationsCta {
  supportLabel: string;
  refundLabel: string;
}

export interface CancellationsPageSection {
  hero: CancellationsHero;
  cta: CancellationsCta;
  refundFormId: number | null;
}

export interface SupportRequestPageSection {
  hero: CancellationsHero;
  supportFormId: number | null;
}

export interface CancellationsPageContent {
  cancellations: CancellationsPageSection;
  supportRequest: SupportRequestPageSection;
  /** WordPress Administration Email Address — used for GF notifications and fallbacks. */
  notificationEmail?: string | null;
}
