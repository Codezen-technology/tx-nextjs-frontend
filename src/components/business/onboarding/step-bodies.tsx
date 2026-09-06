"use client";

import { AlertTriangle, BarChart3, BookOpen, Info, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { SectorCombobox } from "../sector-combobox";
import {
  NOTIFICATION_LABELS,
  PASSING_MARK_DEFAULT,
  PASSING_MARK_MAX,
  PASSING_MARK_MIN,
  PASSING_MARK_PRESETS,
  SIZE_BANDS,
  sizeBandLabel,
  type Answers,
} from "./answers";
import type { NotificationPrefs } from "@/types/business-dashboard";

/**
 * The wizard's step bodies.
 *
 * They share one shape — the answers, and a way to change them — so the shell
 * can render any of them without knowing which. Titles live in the step
 * declaration, which is also what the rail reads.
 */
export interface StepProps {
  answers: Answers;
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  /** Advance, when the current step permits it. Wired to Enter in text fields. */
  onSubmit: () => void;
  /** Field-level errors from the server, keyed by field name. */
  fieldErrors: Partial<Record<"email", string>>;
  sectors: readonly string[];
  sectorsLoading: boolean;
}

const enterSubmits = (onSubmit: () => void) => (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") {
    event.preventDefault();
    onSubmit();
  }
};

const Required = () => (
  <span className="text-red-600" aria-hidden="true">
    {" "}
    *
  </span>
);

// ─── 1. Welcome ──────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Users,
    title: "Add your team",
    body: "Invite learners and organise them into departments.",
  },
  { icon: BookOpen, title: "Assign courses", body: "Give each learner the training they need." },
  {
    icon: BarChart3,
    title: "Track progress",
    body: "Follow completions, scores and certificates in one place.",
  },
];

/**
 * What the dashboard is for, in three lines. The welcome is the one screen
 * that is not a form, so it is the one chance to say why the next six steps
 * are worth the minute they take.
 */
export function WelcomeBody() {
  return (
    <ul className="mx-auto flex max-w-md flex-col gap-4 text-left">
      {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#F9A31A]/15 text-[#F9A31A]">
            <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold text-white">{title}</span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/70">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── 2. Manager details ──────────────────────────────────────────────────────

export function ManagerStep({ answers, setAnswer, onSubmit, fieldErrors }: StepProps) {
  const onEnter = enterSubmits(onSubmit);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="ob-name">
          Full name
          <Required />
        </Label>
        <Input
          id="ob-name"
          className="mt-1"
          placeholder="e.g. Shafin Ahmed"
          value={answers.fullName}
          onChange={(e) => setAnswer("fullName", e.target.value)}
          onKeyDown={onEnter}
        />
      </div>

      <div>
        <Label htmlFor="ob-email">
          Email address
          <Required />
        </Label>
        <Input
          id="ob-email"
          type="email"
          className="mt-1"
          placeholder="you@company.co.uk"
          value={answers.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "ob-email-error" : undefined}
          onChange={(e) => setAnswer("email", e.target.value)}
          onKeyDown={onEnter}
        />
        {/*
          The server owns the question this field cannot answer — whether the
          address is already someone else's — so its answer belongs here, not
          only in the shell's error line.
        */}
        {fieldErrors.email ? (
          <p id="ob-email-error" role="alert" className="mt-1.5 text-xs text-red-600">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="ob-phone">Phone number</Label>
        <Input
          id="ob-phone"
          type="tel"
          className="mt-1"
          placeholder="Enter your phone number"
          value={answers.phone}
          onChange={(e) => setAnswer("phone", e.target.value)}
          onKeyDown={onEnter}
        />
        <p className="mt-1.5 flex items-center gap-2 text-xs text-neutral-300">
          <Info className="h-[15px] w-[15px] shrink-0 text-[#3F576F]" aria-hidden="true" />
          We&rsquo;ll only use this to contact you about your account when needed.
        </p>
      </div>

      <div>
        <Label htmlFor="ob-job">
          Job title
          <Required />
        </Label>
        <Input
          id="ob-job"
          className="mt-1"
          placeholder="e.g. Training Manager"
          value={answers.jobTitle}
          onChange={(e) => setAnswer("jobTitle", e.target.value)}
          onKeyDown={onEnter}
        />
      </div>
    </div>
  );
}

// ─── 3. Organisation ─────────────────────────────────────────────────────────

export function OrganisationStep({
  answers,
  setAnswer,
  onSubmit,
  sectors,
  sectorsLoading,
}: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="ob-org">
          Organisation name
          <Required />
        </Label>
        <Input
          id="ob-org"
          className="mt-1"
          placeholder="e.g. Sunrise Care Ltd"
          value={answers.companyName}
          onChange={(e) => setAnswer("companyName", e.target.value)}
          onKeyDown={enterSubmits(onSubmit)}
        />
      </div>

      <div>
        <Label htmlFor="company-sector">
          Organisation sector
          <Required />
        </Label>
        <div className="mt-1">
          <SectorCombobox
            value={answers.companySector}
            onChange={(sector) => setAnswer("companySector", sector)}
            sectors={sectors}
            isLoading={sectorsLoading}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-700">
          Number of employees
          <Required />
        </legend>
        {/*
          Nothing is preselected for a business that has never recorded a size:
          an unseen default would be an answer nobody gave.
        */}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SIZE_BANDS.map((band) => (
            <button
              key={band.value}
              type="button"
              aria-pressed={answers.companySize === band.value}
              onClick={() => setAnswer("companySize", band.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                answers.companySize === band.value
                  ? "border-[#3F576F] bg-[#3F576F]/5 font-medium text-[#3F576F]"
                  : "border-neutral-30 hover:bg-neutral-10 text-neutral-700",
              )}
            >
              {band.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// ─── 4. Passing mark ─────────────────────────────────────────────────────────

export function PassingStep({ answers, setAnswer }: StepProps) {
  const mark = answers.passingMark;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl font-bold text-[#3F576F]">{mark}%</div>
        <div className="mt-1 text-xs font-semibold tracking-[0.05em] text-neutral-300 uppercase">
          Passing score
        </div>
      </div>

      <div>
        <input
          type="range"
          min={PASSING_MARK_MIN}
          max={PASSING_MARK_MAX}
          value={mark}
          aria-label="Passing mark"
          onChange={(e) => setAnswer("passingMark", Number(e.target.value))}
          className="w-full accent-[#3F576F]"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-300">
          {[50, 60, 70, 80, 90, 100].map((tick) => (
            <span key={tick}>{tick}%</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PASSING_MARK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={preset === mark}
            onClick={() => setAnswer("passingMark", preset)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              preset === mark
                ? "border-[#3F576F] bg-[#3F576F]/10 text-[#3F576F]"
                : "border-neutral-30 text-neutral-300 hover:border-neutral-100",
            )}
          >
            {preset}%{preset === PASSING_MARK_DEFAULT ? " (default)" : ""}
          </button>
        ))}
      </div>

      <p className="bg-neutral-10 border-neutral-30 rounded-lg border p-3 text-xs leading-relaxed text-neutral-300">
        Learners scoring below <strong className="text-neutral-900">{mark}%</strong> will be marked
        as failed and must retake the assessment to receive a certificate. You can change this later
        in Settings.
      </p>
    </div>
  );
}

// ─── 5. Certificate download control ─────────────────────────────────────────

const CERT_OPTIONS = [
  {
    value: true,
    title: "Allow learners to download their certificates",
    body: "Anyone who passes can save their certificate themselves.",
  },
  {
    value: false,
    title: "Only managers can download certificates",
    body: "Learners cannot download; a manager releases each one.",
  },
];

export function CertificatesStep({ answers, setAnswer }: StepProps) {
  return (
    <div>
      {/*
        The backend locks this on the *value*, not on finishing setup: turning
        it off is the one-way door, and leaving it on keeps the choice open.
        Saying "this decision is permanent" here would be false — a tenant that
        completes setup with downloads enabled can still disable it later, once.
      */}
      <p className="mb-5 flex items-start gap-2 text-sm leading-relaxed text-neutral-300">
        <AlertTriangle
          className="mt-0.5 h-[17px] w-[17px] shrink-0 text-[#F9A31A]"
          aria-hidden="true"
        />
        <span>
          <strong className="text-neutral-900">Turning downloads off is one-way.</strong> It can
          never be turned back on. Leaving them on now keeps the choice open.
        </span>
      </p>

      {/*
        Radios, not buttons: they carry the roles explicitly so they are not
        announced as buttons with no checked state.
      */}
      <div role="radiogroup" aria-label="Certificate download control" className="space-y-2">
        {CERT_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={answers.selfDownload === option.value}
            onClick={() => setAnswer("selfDownload", option.value)}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-left transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[#3F576F] focus-visible:ring-offset-2 focus-visible:outline-none",
              answers.selfDownload === option.value
                ? "border-[#3F576F] bg-[#3F576F]/5"
                : "border-neutral-30 hover:bg-neutral-10",
            )}
          >
            <span className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
                  answers.selfDownload === option.value
                    ? "border-[#3F576F] bg-[#3F576F]"
                    : "border-neutral-100",
                )}
              >
                {answers.selfDownload === option.value ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span>
                <span className="block text-sm font-medium text-neutral-900">{option.title}</span>
                <span className="mt-0.5 block text-sm text-neutral-300">{option.body}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Communication preferences ────────────────────────────────────────────

const PREFERENCE_KEYS = Object.keys(NOTIFICATION_LABELS) as (keyof NotificationPrefs)[];

export function PreferencesStep({ answers, setAnswer }: StepProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold tracking-[0.05em] text-neutral-300 uppercase">
        Email me when…
      </p>

      <div className="flex flex-col gap-3">
        {PREFERENCE_KEYS.map((key) => (
          <label
            key={key}
            htmlFor={key}
            className="flex cursor-pointer items-center gap-3 text-sm text-neutral-900"
          >
            <input
              id={key}
              type="checkbox"
              className="border-neutral-30 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-[#3F576F]"
              checked={answers.notifications[key]}
              onChange={(e) =>
                setAnswer("notifications", {
                  ...answers.notifications,
                  [key]: e.target.checked,
                })
              }
            />
            {NOTIFICATION_LABELS[key]}
          </label>
        ))}
      </div>

      {/*
        Said plainly because the alternative reading — that turning everything
        off silences the account entirely — would be wrong and would matter.
      */}
      <p className="border-neutral-30 mt-5 flex items-center gap-2 border-t pt-4 text-xs text-neutral-300">
        <Info className="h-[14px] w-[14px] shrink-0 text-[#3F576F]" aria-hidden="true" />
        Account and billing emails are always sent.
      </p>
    </div>
  );
}

// ─── 7. Summary ──────────────────────────────────────────────────────────────

const UNSET = "—";

export function SummaryStep({ answers }: StepProps) {
  const on = Object.values(answers.notifications).filter(Boolean).length;

  const rows: [string, string][] = [
    ["Name", answers.fullName.trim() || UNSET],
    ["Email", answers.email.trim() || UNSET],
    ["Phone", answers.phone.trim() || UNSET],
    ["Job title", answers.jobTitle.trim() || UNSET],
    ["Organisation", answers.companyName.trim() || UNSET],
    ["Sector", answers.companySector || UNSET],
    ["Team size", sizeBandLabel(answers.companySize) ?? UNSET],
    ["Passing mark", `${answers.passingMark}%`],
    ["Certificates", answers.selfDownload ? "Learner self-download" : "Manager only"],
    ["Email alerts", `${on} of ${PREFERENCE_KEYS.length} on`],
  ];

  return (
    <div>
      <dl className="border-neutral-30 overflow-hidden rounded-xl border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="border-neutral-30 flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm last:border-b-0"
          >
            <dt className="text-neutral-300">{label}</dt>
            <dd className="text-right font-semibold text-neutral-900">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-neutral-300">
        Everything above is saved when you finish. Certificate downloads can still be turned off
        later — but only once.
      </p>
    </div>
  );
}
