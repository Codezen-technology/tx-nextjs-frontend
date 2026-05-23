import type { ElementType, ReactNode } from "react";
import parse from "html-react-parser";
import { decodeEntities } from "@/lib/api/parsers";

export interface ParsedHtmlProps {
  /** Raw string from WordPress / WooCommerce (may include HTML entities or tags). */
  content: string;
  className?: string;
  as?: ElementType;
}

/**
 * Renders WP/WC strings with decoded entities and safe HTML parsing.
 * Use for product titles, coupon errors, and other API copy.
 */
export function ParsedHtml({ content, as: Tag = "span", className }: ParsedHtmlProps): ReactNode {
  if (!content) return null;
  const decoded = decodeEntities(content);
  return <Tag className={className}>{parse(decoded)}</Tag>;
}
