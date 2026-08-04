/**
 * Rank Math Headless SEO — server-side utilities.
 *
 * Requires: Rank Math → General Settings → Others → "Headless CMS Support" enabled.
 *
 * Usage in any async Server Component page:
 *
 *   export async function generateMetadata({ params }) {
 *     const seo = await fetchRankMathSeo(`/course/${params.slug}`);
 *     return buildPageMetadata(seo, {
 *       title: "Fallback Title",
 *       description: "Fallback description",
 *       canonical: `${env.SITE_URL}/course/${params.slug}`,
 *     });
 *   }
 *
 * See SEO.md for the full pattern and rules.
 */

import type { Metadata } from "next";
import { serverApi } from "@/lib/api/server";
import { parseRankMathHead, stringifyJsonLd, type ParsedSeo } from "@/lib/utils/seo";
import { toFrontendUrl, replaceWpOrigin, SITE_ORIGIN } from "@/lib/utils/url";
import { normalizePath } from "@/lib/seo/wp-paths";
import { getServerWpOrigin } from "@/lib/env";

export type { ParsedSeo };
export { stringifyJsonLd };

/**
 * Strip a trailing slash from an absolute URL, preserving the root path.
 *
 * WordPress permalinks are trailing-slash; Next.js runs `trailingSlash: false`.
 * Left unreconciled, every Rank Math canonical points at a URL that 308-redirects
 * and disagrees with the matching `sitemap.xml` entry.
 *
 * Deliberately NOT in `src/lib/utils/url.ts` — `toFrontendUrl` is shared with the
 * service layer, where content permalinks must round-trip WordPress URLs verbatim.
 * Slash normalisation is an SEO concern and stays on this boundary.
 */
export function canonicalize(url: string): string {
  try {
    const u = new URL(url);
    u.pathname = normalizePath(u.pathname);
    // URL.toString() re-appends `/` for a root pathname — strip it back off,
    // but never past the origin.
    const out = u.toString();
    return u.pathname === "/" && !u.search && !u.hash ? out.replace(/\/$/, "") : out;
  } catch {
    return url;
  }
}

/**
 * Fetch + parse Rank Math SEO for a WP page path.
 *
 * Validates that the head Rank Math returned actually belongs to the page that
 * was requested. The endpoint answers 200 with the homepage's head (or a bare
 * 404 head) for any URL it cannot resolve, so an unvalidated payload silently
 * publishes another page's canonical, title and JSON-LD. Compare paths only —
 * the canonical is still on the backend origin at that point.
 *
 * Patches the canonical and all JSON-LD `@id` / `url` fields onto the headless
 * frontend domain, and normalises both onto the no-trailing-slash URL form the
 * app and its sitemap use.
 *
 * @param wpPath - Path as it exists on WP. Use `wpPath.*` from `@/lib/seo/wp-paths`.
 * @returns Parsed SEO data, or null if Rank Math is unreachable, disabled, or
 *          returned a head for a different page.
 */
export async function fetchRankMathSeo(wpPath: string): Promise<ParsedSeo | null> {
  try {
    // Ask the backend about its own origin. The transport resolves its request
    // base via getServerWpJsonBase(); building the `url=` param from the
    // browser-public value would ask an overridden host about a different host.
    const wpBase = getServerWpOrigin();
    const head = await serverApi.rankmath.getHead(`${wpBase}${wpPath}`);
    if (!head) return null;

    const seo = parseRankMathHead(head);

    if (seo.canonical) {
      const returned = normalizePath(new URL(seo.canonical).pathname);
      const requested = normalizePath(wpPath);
      if (returned !== requested) {
        console.warn(`[seo] Rank Math path mismatch: requested ${requested}, got ${returned}`);
        return null;
      }
      // Rewrite the backend origin to the frontend origin, then reconcile the
      // slash form. See src/lib/utils/url.ts for the shared rewriting rules.
      seo.canonical = canonicalize(toFrontendUrl(seo.canonical));
    }
    // A canonical-less payload is accepted, not rejected: Rank Math legitimately
    // omits the canonical on a `noindex` page, and discarding that payload would
    // drop a real noindex directive — declaring a page indexable that WordPress
    // says is not. Wrong mappings are caught by the mapping tests instead.

    // Patch WP domain in JSON-LD (affects @id, url, mainEntityOfPage, etc.),
    // then reconcile the slash form so a schema @id matches the page canonical
    // it identifies. Requires at least one path segment, so a bare
    // `https://site/` @id for the homepage is left intact.
    if (seo.jsonLd?.length) {
      const patched = replaceWpOrigin(JSON.stringify(seo.jsonLd));
      const trailingSlash = new RegExp(`"(${escapeRegExp(SITE_ORIGIN)}/[^"]+)/"`, "g");
      seo.jsonLd = JSON.parse(patched.replace(trailingSlash, '"$1"')) as typeof seo.jsonLd;
    }

    return seo;
  } catch {
    return null;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface MetadataFallback {
  /** Used when Rank Math returns no title */
  title: string;
  /** Used when Rank Math returns no description */
  description?: string;
  /** Used when Rank Math returns no OG image */
  image?: string;
  /** Always set — the headless frontend URL for this page */
  canonical: string;
}

/**
 * Build a complete Next.js Metadata object from parsed Rank Math SEO data.
 * Every field prefers the Rank Math value; falls back to the provided values.
 *
 * @param seo      - Result of fetchRankMathSeo(), or null/undefined
 * @param fallback - Required fallback values for title, canonical, and optionally description/image
 */
export function buildPageMetadata(
  seo: ParsedSeo | null | undefined,
  fallback: MetadataFallback,
): Metadata {
  const title = seo?.title ?? fallback.title;
  const description = seo?.description ?? fallback.description;
  const canonical = seo?.canonical ?? fallback.canonical;
  const ogImage = seo?.ogImage ?? fallback.image;

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    ...(seo?.robots ? { robots: seo.robots } : {}),
    openGraph: {
      title: seo?.ogTitle ?? title,
      ...(description ? { description: seo?.ogDescription ?? description } : {}),
      url: canonical,
      // Use Rank Math's og:type (e.g. "article" for WP posts/courses) — fall back to "website"
      type: (seo?.ogType ?? "website") as "website",
      ...(seo?.ogLocale ? { locale: seo.ogLocale } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle ?? title,
      ...(description ? { description: seo?.twitterDescription ?? description } : {}),
      ...((seo?.twitterImage ?? ogImage) ? { images: [seo?.twitterImage ?? ogImage!] } : {}),
    },
  };
}
