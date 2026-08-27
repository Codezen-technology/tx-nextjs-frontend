"use client";

import { useCallback, useRef } from "react";
import { FieldShell, TEXTAREA_CLASS, type GfFieldProps } from "./shared";

/**
 * The tallest a field may grow before it scrolls instead, so a long answer
 * cannot push the rest of the form off the screen.
 */
const MAX_HEIGHT_PX = 320;

/**
 * GF `textarea` field.
 *
 * Grows with its content — `QA-SUPPORT-A2`, "the height of the text box in
 * Additional Details is not enough … it will cover all the text in it". The
 * report names a behaviour, not a height, and a taller fixed `rows` would still
 * be a guess that is wrong for some answer.
 *
 * `rows={3}` remains the starting height, so a short answer looks unchanged.
 */
export function TextareaField({ field, values, onChange }: GfFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback((el: HTMLTextAreaElement) => {
    // Reset first: `scrollHeight` never shrinks below the current height, so
    // without this the field grows but never shrinks back.
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  return (
    <FieldShell label={field.label} required={field.isRequired} description={field.description}>
      <textarea
        ref={ref}
        rows={3}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className={TEXTAREA_CLASS}
        value={values[field.name] ?? ""}
        onInput={(e) => resize(e.currentTarget)}
        onChange={(e) => {
          resize(e.currentTarget);
          onChange(field.name, e.target.value);
        }}
      />
    </FieldShell>
  );
}
