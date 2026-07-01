"use client";

import { FieldShell, type GfFieldProps } from "./shared";

/** GF `radio` field. */
export function RadioField({ field, values, onChange }: GfFieldProps) {
  const value = values[field.name] ?? "";
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <div className="space-y-2">
        {field.choices?.map((c) => (
          <label
            key={c.value}
            className="flex items-center gap-2 font-open-sans text-sm text-neutral-700"
          >
            <input
              type="radio"
              name={field.name}
              value={c.value}
              className="h-4 w-4"
              checked={value === c.value}
              onChange={() => onChange(field.name, c.value)}
            />
            {c.text}
          </label>
        ))}
      </div>
    </FieldShell>
  );
}
