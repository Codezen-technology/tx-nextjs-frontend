import { looksLikeEmail, PASSING_MARK_MAX, PASSING_MARK_MIN, type Answers } from "./answers";

export type StepId =
  | "welcome"
  | "manager"
  | "organisation"
  | "passing"
  | "certificates"
  | "preferences"
  | "summary";

export interface StepDefinition {
  id: StepId;
  /** Label in the step navigation. Absent on the welcome, which has no row. */
  navLabel?: string;
  title: string;
  subtitle?: string;
  /**
   * The welcome renders as its own card — no rail, no form panel — so setup
   * opens on the product rather than on a form.
   */
  standalone?: boolean;
  /** Whether the manager may leave this step. */
  isValid: (answers: Answers, sectors: readonly string[]) => boolean;
}

/**
 * The seven steps, in order.
 *
 * This list is the single declaration the rail, the advance gate and the
 * "step N of M" count all read. Keeping validation here rather than in a
 * `step === 2` ladder is what stops a new step shipping with a rail row and
 * no gate.
 */
export const STEPS: StepDefinition[] = [
  {
    id: "welcome",
    standalone: true,
    title: "Welcome to your training dashboard",
    subtitle: "Let's get you set up.",
    isValid: () => true,
  },
  {
    id: "manager",
    navLabel: "Your details",
    title: "Enter your details",
    isValid: (a) =>
      a.fullName.trim().length > 0 && a.jobTitle.trim().length > 0 && looksLikeEmail(a.email),
  },
  {
    id: "organisation",
    navLabel: "Organisation",
    title: "Enter your organisation details",
    // The sector must be one the backend recognises. While the vocabulary is
    // still loading there is nothing to match against, so the gate holds
    // rather than letting through a value the API would reject.
    isValid: (a, sectors) =>
      a.companyName.trim().length > 0 &&
      sectors.includes(a.companySector.trim()) &&
      a.companySize !== null,
  },
  {
    id: "passing",
    navLabel: "Pass mark",
    title: "Set a passing mark",
    subtitle: "Learners must reach this score to pass a course and receive their certificate.",
    isValid: (a) => a.passingMark >= PASSING_MARK_MIN && a.passingMark <= PASSING_MARK_MAX,
  },
  {
    id: "certificates",
    navLabel: "Certificates",
    title: "Set your preferences",
    subtitle: "Who can download certificates?",
    isValid: () => true,
  },
  {
    id: "preferences",
    navLabel: "Preferences",
    title: "Set your communication preferences",
    subtitle: "These choices can be changed later.",
    isValid: () => true,
  },
  {
    id: "summary",
    navLabel: "Complete",
    title: "You're all set!",
    subtitle: "Your dashboard is ready. Here's a summary of your setup.",
    isValid: () => true,
  },
];

/** The steps that appear in the navigation — everything but the welcome. */
export const NAV_STEPS = STEPS.filter((step) => !step.standalone);

export const LAST_STEP = STEPS.length - 1;
