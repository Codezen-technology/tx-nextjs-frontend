"use client";

import type { GfFieldProps } from "./shared";

/**
 * GF `checkbox` / `consent` — single checkbox (value "1" when checked).
 * Multi-choice checkbox groups (separate inputs[]) are a later phase.
 */
export function CheckboxField({ field, values, onChange }: GfFieldProps) {
  return (
    <label className="flex items-center gap-2 font-open-sans text-sm text-neutral-700">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={(values[field.name] ?? "") === "1"}
        onChange={(e) => onChange(field.name, e.target.checked ? "1" : "")}
      />
      {field.choices?.[0]?.text ?? field.label}
      {field.isRequired && <span className="text-red-500">*</span>}
    </label>
  );
}
