"use client";

import { FieldShell, TEXTAREA_CLASS, type GfFieldProps } from "./shared";

/** GF `textarea` field. */
export function TextareaField({ field, values, onChange }: GfFieldProps) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <textarea
        rows={3}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={TEXTAREA_CLASS}
        value={values[field.name] ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    </FieldShell>
  );
}
