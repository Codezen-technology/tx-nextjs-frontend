"use client";

import { ParsedHtml } from "@/components/ui/parsed-html";
import type { GfFieldProps } from "./shared";

/** GF `html` block — display-only content authored in GF admin (trusted). */
export function HtmlField({ field }: GfFieldProps) {
  if (!field.content) return null;
  return <ParsedHtml as="div" content={field.content} />;
}
