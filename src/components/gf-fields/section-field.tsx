"use client";

import { SECTION_CLASS, type GfFieldProps } from "./shared";

/** GF `section` — heading + optional description separating groups of fields. */
export function SectionField({ field }: GfFieldProps) {
  return (
    <div className="border-b border-neutral-200 pt-2 pb-1">
      <h3 className={SECTION_CLASS}>{field.label}</h3>
      {field.description ? (
        <p className="font-open-sans mt-1 text-sm text-neutral-500">{field.description}</p>
      ) : null}
    </div>
  );
}
