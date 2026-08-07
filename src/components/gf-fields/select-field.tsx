"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FieldShell, FIELD_CLASS, type GfFieldProps } from "./shared";

/** GF `select` (dropdown) field. */
export function SelectField({ field, values, onChange }: GfFieldProps) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <div className="relative">
        <select
          className={cn(FIELD_CLASS, "appearance-none pr-10")}
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
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </FieldShell>
  );
}
