"use client";

import { FieldShell, TEXTAREA_CLASS, type GfFieldProps } from "./shared";
import { growToFit } from "@/lib/utils/auto-grow-textarea";

/**
 * GF `textarea` field.
 *
 * Grows with its content — `QA-SUPPORT-A2`. `rows={3}` remains the starting
 * height, so a short answer looks unchanged. This kit renders the certificate
 * form; `/support-request` and `/cancellations` go through `gravity-form.tsx`,
 * which shares the same helper.
 */
export function TextareaField({ field, values, onChange }: GfFieldProps) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <textarea
        rows={3}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={TEXTAREA_CLASS}
        value={values[field.name] ?? ""}
        onInput={(e) => growToFit(e.currentTarget)}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    </FieldShell>
  );
}
