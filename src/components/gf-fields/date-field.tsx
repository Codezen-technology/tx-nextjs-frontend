"use client";

import { ScalarInput, type GfFieldProps } from "./shared";

/** GF `date` field. */
export function DateField(props: GfFieldProps) {
  return <ScalarInput {...props} type="date" />;
}
