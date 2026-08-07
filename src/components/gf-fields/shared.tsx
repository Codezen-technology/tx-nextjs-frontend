"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { MARKETING_FIELD_CLASS, MARKETING_LABEL_CLASS } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";
import type { GravityField } from "@/types/form";

/**
 * Shared props + primitives for the Gravity Forms field kit.
 *
 * Every field component is **controlled** and uniform: it reads its value(s) from
 * `values` (keyed by GF input name, e.g. `input_6`, `input_78_1`) and reports
 * changes via `onChange(name, value)`. This lets any consumer (the certificate
 * form, future headless forms) hold field state however it likes.
 */
export interface GfFieldProps {
  field: GravityField;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

/** Light-palette input styling (marketing pages pin light even under dark mode). */
export const FIELD_CLASS = MARKETING_FIELD_CLASS;
export const LABEL_CLASS = MARKETING_LABEL_CLASS;
export const SECTION_CLASS = "font-suse text-lg font-semibold text-neutral-900";
export const TEXTAREA_CLASS = cn(
  "w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-hidden",
  FIELD_CLASS,
);

/** Label + required marker + description wrapper. */
export function FieldShell({
  label,
  required,
  description,
  children,
}: {
  label?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <Label className={LABEL_CLASS}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
      ) : null}
      {children}
      {description ? (
        <p className="font-open-sans text-xs text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}

/** Base controlled `<input>` shared by the scalar field types. */
export function ScalarInput({ field, values, onChange, type }: GfFieldProps & { type: string }) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <input
        type={type}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={FIELD_CLASS}
        value={values[field.name] ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    </FieldShell>
  );
}
