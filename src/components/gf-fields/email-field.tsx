"use client";

import { ScalarInput, type GfFieldProps } from "./shared";

/** GF `email` field. */
export function EmailField(props: GfFieldProps) {
  return <ScalarInput {...props} type="email" />;
}
