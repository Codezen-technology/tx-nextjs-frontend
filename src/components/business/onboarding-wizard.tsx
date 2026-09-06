"use client";

import { useState } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompleteOnboarding } from "@/lib/hooks/useBusinessDashboard";
import { cn } from "@/lib/utils/cn";
import type { BusinessSettings } from "@/types/business-dashboard";

const TEAM_SIZE_BANDS = [
  { value: 10, label: "1–10 people" },
  { value: 49, label: "11–49 people" },
  { value: 199, label: "50–199 people" },
  { value: 200, label: "200+ people" },
];

const STEPS = ["Welcome", "Your name", "Organisation", "Passing mark", "Certificates", "Summary"];

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-300">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * First-run setup.
 *
 * Nothing is written until "Launch dashboard" fires a single
 * `POST /settings/onboarding`, so abandoning the wizard leaves the tenant
 * exactly as it was.
 *
 * The certificate download control is freely editable in both directions here.
 * The lock is keyed on the *value*, not on completing onboarding: it engages
 * once the setting is `false`, whenever that happens. Finishing setup with
 * downloads still enabled leaves the tenant free to disable it later — once.
 */
export function OnboardingWizard({ settings }: { settings: BusinessSettings }) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState(settings.company_name ?? "");
  const [companySize, setCompanySize] = useState<number>(TEAM_SIZE_BANDS[0].value);
  const [passMark, setPassMark] = useState(settings.passing_mark ?? 80);
  const [selfDownload, setSelfDownload] = useState(settings.certificate_self_download ?? true);
  const [error, setError] = useState("");

  const complete = useCompleteOnboarding();

  const canAdvance = step !== 2 || companyName.trim().length > 0;

  const launch = async () => {
    setError("");
    try {
      await complete.mutateAsync({
        display_name: displayName.trim() || undefined,
        company_name: companyName.trim(),
        company_size: companySize,
        passing_mark: passMark,
        certificate_self_download: selfDownload,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish setup. Please try again.");
    }
  };

  return (
    <div className="bg-neutral-20 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="border-neutral-30 w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-2 flex gap-1.5" role="presentation">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-[#3F576F]" : "bg-neutral-100",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-300" aria-live="polite">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>

        {step === 0 ? (
          <StepShell
            title="Welcome to your training dashboard"
            description="A few questions so the reports mean what you expect. It takes about a minute, and nothing is saved until the end."
          />
        ) : null}

        {step === 1 ? (
          <StepShell title="What should we call you?" description="Optional — used to greet you.">
            <div>
              <Label htmlFor="display_name">Your name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="mt-1"
              />
            </div>
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell title="About your organisation">
            <div>
              <Label htmlFor="company_name">Organisation name</Label>
              <Input
                id="company_name"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-neutral-700">How many people?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TEAM_SIZE_BANDS.map((band) => (
                  <button
                    key={band.value}
                    type="button"
                    onClick={() => setCompanySize(band.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      companySize === band.value
                        ? "border-[#3F576F] bg-[#3F576F]/5 font-medium text-[#3F576F]"
                        : "border-neutral-30 hover:bg-neutral-10 text-neutral-700",
                    )}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            title="Set your passing mark"
            description="A completed course scoring below this counts as failed in every report. You can change it later."
          >
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={50}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="flex-1 accent-[#3F576F]"
                aria-label="Passing mark"
              />
              <span className="w-16 text-right text-2xl font-bold text-neutral-900">
                {passMark}%
              </span>
            </div>
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            title="Certificate downloads"
            description="Turning this off is a one-way door — it can never be turned back on. Leaving it on now keeps the choice open."
          >
            <div role="radiogroup" aria-label="Certificate downloads" className="space-y-2">
              {[
                {
                  value: true,
                  title: "Learners download their own certificates",
                  body: "Anyone who passes can save their certificate themselves.",
                },
                {
                  value: false,
                  title: "Only managers issue certificates",
                  body: "Learners cannot download; a manager releases each one.",
                },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  role="radio"
                  aria-checked={selfDownload === option.value}
                  onClick={() => setSelfDownload(option.value)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                    selfDownload === option.value
                      ? "border-[#3F576F] bg-[#3F576F]/5"
                      : "border-neutral-30 hover:bg-neutral-10",
                  )}
                >
                  <span className="block text-sm font-medium text-neutral-900">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-neutral-300">{option.body}</span>
                </button>
              ))}
            </div>
          </StepShell>
        ) : null}

        {step === 5 ? (
          <StepShell title="Ready to go" description="Everything below is saved when you launch.">
            <dl className="divide-neutral-30 divide-y text-sm">
              {[
                ["Organisation", companyName],
                ["Team size", TEAM_SIZE_BANDS.find((b) => b.value === companySize)?.label ?? "—"],
                ["Passing mark", `${passMark}%`],
                [
                  "Certificate downloads",
                  selfDownload ? "Learners can download" : "Managers issue only",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2">
                  <dt className="text-neutral-300">{label}</dt>
                  <dd className="text-right font-medium text-neutral-900">{value}</dd>
                </div>
              ))}
            </dl>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </StepShell>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 0 || complete.isPending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              className="bg-[#3F576F] hover:bg-[#33485d]"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="bg-[#3F576F] hover:bg-[#33485d]"
              disabled={complete.isPending}
              onClick={launch}
            >
              {complete.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Launch dashboard
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
