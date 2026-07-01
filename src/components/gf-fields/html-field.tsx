"use client";

import type { GfFieldProps } from "./shared";

/** GF `html` block — display-only content authored in GF admin (trusted). */
export function HtmlField({ field }: GfFieldProps) {
  if (!field.content) return null;
  return <div dangerouslySetInnerHTML={{ __html: field.content }} />;
}
