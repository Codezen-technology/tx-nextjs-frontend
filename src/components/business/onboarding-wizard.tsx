"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompleteOnboarding, useSectors } from "@/lib/hooks/useBusinessDashboard";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/utils/cn";
import { initialAnswers, toCompletionPayload, type Answers } from "./onboarding/answers";
import { LAST_STEP, NAV_STEPS, STEPS } from "./onboarding/steps";
import { StepNav } from "./onboarding/step-nav";
import {
  CertificatesStep,
  ManagerStep,
  OrganisationStep,
  PassingStep,
  PreferencesStep,
  SummaryStep,
  WelcomeBody,
  type StepProps,
} from "./onboarding/step-bodies";
import type { BusinessSettings } from "@/types/business-dashboard";

const BODIES: Record<string, (props: StepProps) => React.ReactElement> = {
  manager: ManagerStep,
  organisation: OrganisationStep,
  passing: PassingStep,
  certificates: CertificatesStep,
  preferences: PreferencesStep,
  summary: SummaryStep,
};

/**
 * First-run setup.
 *
 * Seven steps, one write: every answer is held here until the final action,
 * which submits them in a single `POST /settings/onboarding`. That is what
 * makes abandoning the wizard harmless.
 *
 * The certificate download control is freely editable in both directions here.
 * The lock is keyed on the *value*, not on completing onboarding: it engages
 * once the setting is `false`, whenever that happens. Finishing setup with
 * downloads still enabled leaves the tenant free to disable it later — once.
 *
 * The step list, the rail and the advance gate all read one declaration
 * (`onboarding/steps.ts`), so a step cannot acquire a rail row without also
 * acquiring a gate.
 */
export function OnboardingWizard({ settings }: { settings: BusinessSettings }) {
  const user = useAuthStore((s) => s.user);
  const complete = useCompleteOnboarding();
  const { data: sectors, isLoading: sectorsLoading } = useSectors();

  const [step, setStep] = useState(0);
  // The high-water mark, not the current step: pressing Back does not
  // un-answer the steps ahead, so they stay reachable in the rail.
  const [furthest, setFurthest] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(settings, user));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<StepProps["fieldErrors"]>({});

  const vocabulary = sectors ?? [];

  const setAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    if (key === "email") {
      // The server's verdict was about the address that has just been edited.
      setFieldErrors((current) => ({ ...current, email: undefined }));
    }
  };

  const current = STEPS[step];
  const canAdvance = current.isValid(answers, vocabulary);
  const isWelcome = Boolean(current.standalone);
  const isLast = step === LAST_STEP;

  /*
   * A reached step is revisitable only while every gate before it still
   * passes — going back and emptying a required field must not leave the rail
   * offering a shortcut over the step that field belongs to.
   */
  const canVisit = (index: number) =>
    STEPS.slice(0, index).every((candidate) => candidate.isValid(answers, vocabulary));

  const finish = async () => {
    setError("");
    try {
      await complete.mutateAsync(toCompletionPayload(answers));
    } catch (err) {
      // A rejected email is a fixable answer on a step the manager can go back
      // to, so it is reported there rather than only at the footer.
      if (
        err instanceof ApiError &&
        (err.code === "b2b_email_taken" || err.code === "b2b_invalid_email")
      ) {
        setFieldErrors({ email: err.message || "That email address cannot be used." });
        setStep(1);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not finish setup. Please try again.");
    }
  };

  const next = () => {
    if (!canAdvance) return;
    setError("");

    if (isLast) {
      void finish();
      return;
    }

    const target = Math.min(step + 1, LAST_STEP);
    setStep(target);
    setFurthest((mark) => Math.max(mark, target));
  };

  const back = () => {
    setError("");
    setStep((index) => Math.max(index - 1, 0));
  };

  let nextLabel = "Continue";
  if (isWelcome) nextLabel = "Get started";
  else if (isLast) nextLabel = "Go to dashboard";

  // ── Welcome: its own card, so setup opens on the product, not a form ───────

  if (isWelcome) {
    return (
      <div className="bg-neutral-20 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative flex w-full max-w-[1000px] flex-col items-center overflow-hidden rounded-[22px] bg-[#3F576F] shadow-xl">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#33485d] to-[#F9A31A]"
          />

          <div className="flex flex-1 flex-col items-center px-6 pt-16 pb-10 text-center sm:pt-24">
            <h1 className="mb-3.5 text-3xl font-bold tracking-tight text-white">{current.title}</h1>
            <p className="mb-10 text-base leading-relaxed text-white/70">{current.subtitle}</p>
            <WelcomeBody />
          </div>

          <div className="flex w-full items-center justify-center px-8 pb-10">
            <Button
              onClick={next}
              className="gap-2.5 rounded-full bg-[#F9A31A] px-7 py-3.5 font-bold text-[#1c1002] hover:bg-[#e89410]"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Every other step: rail plus form panel ────────────────────────────────

  const Body = BODIES[current.id];

  return (
    <div className="bg-neutral-20 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-2xl shadow-xl md:min-h-[540px] md:flex-row">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-[#33485d] to-[#F9A31A]"
        />

        <div className="flex w-full shrink-0 flex-col bg-[#3F576F] px-6 pt-7 pb-5 md:w-[280px] md:pt-8 md:pb-6">
          <StepNav stepIndex={step} furthest={furthest} canVisit={canVisit} onSelect={setStep} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-white px-6 pt-8 pb-6 md:px-11 md:pt-10 md:pb-7">
          {/* aria-live so moving between steps is announced, not just repainted. */}
          <div className="flex-1" aria-live="polite">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-neutral-900">
              {current.title}
            </h1>
            {current.subtitle ? (
              <p className="mb-6 text-sm leading-relaxed text-neutral-300">{current.subtitle}</p>
            ) : (
              <div className="mb-5" />
            )}

            {/*
              Said in text as well as shown in the rail: the rail is a list of
              coloured rows, and "how much is left" should not depend on
              reading colour.
            */}
            <p className="sr-only">
              Step {step} of {NAV_STEPS.length}
            </p>

            <Body
              answers={answers}
              setAnswer={setAnswer}
              onSubmit={next}
              fieldErrors={fieldErrors}
              sectors={vocabulary}
              sectorsLoading={sectorsLoading}
            />
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3.5 pt-5">
            <Button variant="ghost" disabled={complete.isPending} onClick={back}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={next}
              // Gated on the step's own predicate rather than erroring after
              // the fact: the manager can see what is still missing.
              disabled={!canAdvance || complete.isPending}
              className={cn("gap-2 rounded-full bg-[#3F576F] px-6 font-bold hover:bg-[#33485d]")}
            >
              {complete.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
