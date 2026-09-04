"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SettingsSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-300">{description}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
      {footer ? <div className="border-neutral-30 mt-5 border-t pt-4">{footer}</div> : null}
    </section>
  );
}

/**
 * A labelled toggle.
 *
 * `locked` renders a chip instead of the control — used for the certificate
 * download setting, which the backend makes permanent once onboarding
 * completes. `comingSoon` marks settings that are stored but inert, so the UI
 * is honest about what they do rather than implying an effect.
 */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  locked,
  comingSoon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
}) {
  const inert = disabled || locked || comingSoon;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          {label}
          {comingSoon ? (
            <span className="bg-neutral-10 rounded-full px-2 py-0.5 text-xs font-normal text-neutral-300">
              Coming soon
            </span>
          ) : null}
          {locked ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-normal text-amber-700">
              Locked
            </span>
          ) : null}
        </p>
        {description ? <p className="mt-0.5 text-sm text-neutral-300">{description}</p> : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={inert}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#3F576F]" : "bg-neutral-200",
          inert && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
