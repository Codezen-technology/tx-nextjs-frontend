import { looksLikeEmail, PASSING_MARK_MAX, PASSING_MARK_MIN, type Answers } from "./answers";

export type StepId =
  | "welcome"
  | "manager"
  | "organisation"
  | "passing"
  | "certificates"
  | "preferences"
  | "summary";

/**
 * What a gate needs to know beyond the answers themselves.
 *
 * The sector vocabulary is served by the backend, so "is this sector valid"
 * has a third state besides yes and no: we could not ask. A gate that treated
 * that as "no" would leave the manager on a step they cannot complete and
 * cannot explain.
 */
export interface StepContext {
  sectors: readonly string[];
  /** The vocabulary request failed — the field cannot be answered at all. */
  sectorsUnavailable: boolean;
}

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
  isValid: (answers: Answers, context: StepContext) => boolean;
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
    /*
     * The sector must be one the backend recognises — anything else comes
     * back as a 400, so the gate holds while the vocabulary is still loading.
     *
     * If that request *failed*, the field cannot be answered at all, and the
     * sector stops being required: an empty sector is a value the API accepts,
     * and the Settings page can set it properly once the endpoint is reachable.
     * Blocking setup on a list we could not fetch would strand the tenant on
     * this step with nothing they could do about it.
     */
    isValid: (a, { sectors, sectorsUnavailable }) =>
      a.companyName.trim().length > 0 &&
      a.companySize !== null &&
      (sectorsUnavailable || sectors.includes(a.companySector.trim())),
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
