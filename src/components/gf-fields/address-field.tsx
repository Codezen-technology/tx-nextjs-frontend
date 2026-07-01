"use client";

import { Input } from "@/components/ui/input";
import { FieldShell, FIELD_CLASS, type GfFieldProps } from "./shared";

/**
 * GF composite fields (`address` / `name`) — one labeled input per sub-input.
 * Each sub-input carries its own POST name (e.g. `input_78_1`).
 */
export function AddressField({ field, values, onChange }: GfFieldProps) {
  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field.inputs?.map((input) => (
          <Input
            key={input.id}
            placeholder={input.placeholder || input.label}
            aria-label={input.label}
            className={FIELD_CLASS}
            value={values[input.name] ?? ""}
            onChange={(e) => onChange(input.name, e.target.value)}
          />
        ))}
      </div>
    </FieldShell>
  );
}
