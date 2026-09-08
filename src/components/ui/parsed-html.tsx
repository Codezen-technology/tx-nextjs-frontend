import type { ElementType, Ref, ReactNode } from "react";
import parse, { type HTMLReactParserOptions, Element } from "html-react-parser";
import { decodeEntities } from "@/lib/api/parsers";
import { isExternalUrl, rewriteContentHref } from "@/lib/utils/url";

/** WP outputs lowercase HTML attrs (e.g. `fetchpriority`) that React expects camelCased. */
const ATTR_FIXES: Record<string, string> = {
  fetchpriority: "fetchPriority",
  crossorigin: "crossOrigin",
};

/** Merge `noopener`/`noreferrer` into an author-supplied `rel` without dropping its tokens. */
function withSafeRel(rel: string | undefined): string {
  const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
  tokens.add("noopener");
  tokens.add("noreferrer");
  return [...tokens].join(" ");
}

/**
 * Applies the in-content link rules to one anchor, in place.
 *
 * WordPress editors write absolute permalinks, so an untouched `href` sends the
 * reader off the headless frontend and onto the backend origin. Only `href` is
 * considered: media (`img`/`source`/`video`/`iframe`) and file downloads must
 * keep resolving against WordPress — see `rewriteContentHref`.
 */
function applyLinkRules(attribs: Record<string, string>): void {
  const href = attribs.href;
  if (!href) return;

  attribs.href = rewriteContentHref(href);

  if (isExternalUrl(attribs.href)) {
    attribs.target ??= "_blank";
    attribs.rel = withSafeRel(attribs.rel);
  }
}

const parseOptions: HTMLReactParserOptions = {
  replace(node) {
    if (node instanceof Element && node.attribs) {
      for (const [lower, camel] of Object.entries(ATTR_FIXES)) {
        if (lower !== camel && lower in node.attribs) {
          node.attribs[camel] = node.attribs[lower];
          delete node.attribs[lower];
        }
      }
      if (node.name === "a") applyLinkRules(node.attribs);
    }
    return undefined;
  },
};

export interface ParsedHtmlProps {
  /** Raw string from WordPress / WooCommerce (may include HTML entities or tags). */
  content: string;
  className?: string;
  as?: ElementType;
  /**
   * Forwarded to the wrapper element. The unit player needs a handle on the
   * rendered subtree to bind video-ended listeners without wrapping it in an
   * extra element the player CSS does not expect.
   */
  ref?: Ref<HTMLElement>;
}

/**
 * Renders WP/WC strings with decoded entities and safe HTML parsing.
 * Use for product titles, coupon errors, and other API copy.
 */
export function ParsedHtml({
  content,
  as: Tag = "span",
  className,
  ref,
}: ParsedHtmlProps): ReactNode {
  if (!content) return null;
  const decoded = decodeEntities(content);
  return (
    <Tag ref={ref} className={className}>
      {parse(decoded, parseOptions)}
    </Tag>
  );
}
