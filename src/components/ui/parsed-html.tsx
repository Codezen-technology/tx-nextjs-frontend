import type { ElementType, ReactNode } from "react";
import parse, { type HTMLReactParserOptions, Element } from "html-react-parser";
import { decodeEntities } from "@/lib/api/parsers";

/** WP outputs lowercase HTML attrs (e.g. `fetchpriority`) that React expects camelCased. */
const ATTR_FIXES: Record<string, string> = {
  fetchpriority: "fetchPriority",
  crossorigin: "crossOrigin",
};

const parseOptions: HTMLReactParserOptions = {
  replace(node) {
    if (node instanceof Element && node.attribs) {
      for (const [lower, camel] of Object.entries(ATTR_FIXES)) {
        if (lower !== camel && lower in node.attribs) {
          node.attribs[camel] = node.attribs[lower];
          delete node.attribs[lower];
        }
      }
    }
    return undefined;
  },
};

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
  return <Tag className={className}>{parse(decoded, parseOptions)}</Tag>;
}
