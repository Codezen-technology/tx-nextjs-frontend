"use client";

import { cn } from "@/lib/utils/cn";
import { FieldShell, FIELD_CLASS, type GfFieldProps } from "./shared";

/** GF `select` (dropdown) field. */
export function SelectField({ field, values, onChange }: GfFieldProps) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <select
        className={cn("h-10 w-full rounded-md border px-3 text-sm", FIELD_CLASS)}
        value={values[field.name] ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      >
        <option value="">Select…</option>
        {field.choices?.map((c) => (
          <option key={c.value} value={c.value}>
            {c.text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
