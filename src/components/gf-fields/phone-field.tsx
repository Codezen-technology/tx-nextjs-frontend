"use client";

import { ScalarInput, type GfFieldProps } from "./shared";

/** GF `phone` field. */
export function PhoneField(props: GfFieldProps) {
  return <ScalarInput {...props} type="tel" />;
}
