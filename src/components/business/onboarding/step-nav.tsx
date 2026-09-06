"use client";

import { Award, Building2, Check, CheckCircle2, Mail, Target, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV_STEPS, type StepId } from "./steps";

const ICONS: Record<StepId, typeof User> = {
  welcome: User,
  manager: User,
  organisation: Building2,
  passing: Target,
  certificates: Award,
  preferences: Mail,
  summary: CheckCircle2,
};

/**
 * The wizard's left rail.
 *
 * It replaces the progress bar the wizard used to carry: that said how far
 * along you were, this says what is left and what each part is.
 *
 * "Completed" is not "before the current step" — pressing Back does not
 * un-answer the steps ahead, so `furthest` (the high-water mark) is what
 * decides, and a reached row is clickable in both directions. What it will not
 * do is carry someone over a step whose answers have since been emptied, which
 * is what `canVisit` re-checks.
 *
 * `navPosition` is the position within the six navigable steps: 1 is the
 * first row, and 0 means the welcome, which has no row. It coincides with the
 * STEPS index only because the welcome happens to be STEPS[0].
 */
export function StepNav({
  navPosition,
  furthest,
  canVisit,
  onSelect,
}: {
  navPosition: number;
  furthest: number;
  canVisit: (index: number) => boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col justify-center" aria-label="Setup steps">
      <p className="mb-4 text-xs font-semibold tracking-[0.06em] text-white/60 uppercase">
        Step {navPosition} of {NAV_STEPS.length}
      </p>

      <ol className="space-y-1">
        {NAV_STEPS.map((step, position) => {
          const index = position + 1;
          const isCurrent = index === navPosition;
          const isDone = !isCurrent && index <= furthest;
          const isReachable = isDone && canVisit(index);
          const Icon = ICONS[step.id];

          let state = "not yet reached";
          if (isDone) state = "completed";
          else if (isCurrent) state = "current step";

          return (
            <li key={step.id}>
              <button
                type="button"
                // A step not yet reached is not a control: it does nothing, so
                // it should not take focus or announce itself as pressable.
                disabled={!isReachable}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-[#F9A31A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3F576F] focus-visible:outline-none",
                  isCurrent && "bg-white/15 text-white shadow-lg",
                  isDone && "text-white/90",
                  isReachable && "cursor-pointer hover:bg-white/10",
                  !isCurrent && !isDone && "cursor-default text-white/45",
                )}
              >
                <span
                  className={cn(
                    "flex h-[22px] w-[22px] shrink-0 items-center justify-center",
                    isDone && "text-[#F9A31A]",
                    !isCurrent && !isDone && "text-white/35",
                  )}
                >
                  {isDone ? (
                    <Check className="h-[19px] w-[19px]" aria-hidden="true" />
                  ) : (
                    <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                  )}
                </span>
                {step.navLabel}
                {/*
                  The visual state is colour and a tick; this says the same
                  thing in words, because a rail read aloud is otherwise six
                  identical-sounding rows.
                */}
                <span className="sr-only">{` (${state})`}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
