"use client";

import { SECTION_CLASS, type GfFieldProps } from "./shared";

/** GF `section` — heading + optional description separating groups of fields. */
export function SectionField({ field }: GfFieldProps) {
  return (
    <div className="border-b border-neutral-200 pb-1 pt-2">
      <h3 className={SECTION_CLASS}>{field.label}</h3>
      {field.description ? (
        <p className="mt-1 font-open-sans text-sm text-neutral-500">{field.description}</p>
      ) : null}
    </div>
  );
}
