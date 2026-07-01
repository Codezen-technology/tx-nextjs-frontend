"use client";

import { ScalarInput, type GfFieldProps } from "./shared";

/** GF `number` field. */
export function NumberField(props: GfFieldProps) {
  return <ScalarInput {...props} type="number" />;
}
