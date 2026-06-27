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
import { toFrontendUrl, replaceWpOrigin } from "@/lib/utils/url";
import { env } from "@/lib/env";

export type { ParsedSeo };
export { stringifyJsonLd };

/**
 * Fetch + parse Rank Math SEO for a WP page path.
 * Automatically patches canonical URL and all JSON-LD @id/url fields to use
 * the headless frontend domain instead of the WP backend domain.
 *
 * @param wpPath  - Path as it exists on WP, e.g. `/course/my-course` or `/`
 * @returns Parsed SEO data, or null if Rank Math is unreachable or disabled
 */
export async function fetchRankMathSeo(wpPath: string): Promise<ParsedSeo | null> {
  try {
    const wpBase = env.WP_API_URL.replace(/\/$/, "");
    console.log({ wpBase, wpPath });
    const head = await serverApi.rankmath.getHead(`${wpBase}${wpPath}`);
    if (!head) return null;

    const seo = parseRankMathHead(head);

    // Rewrite all backend-origin URLs to the headless frontend origin.
    // See src/lib/utils/url.ts for the shared rewriting rules.
    if (seo.canonical) {
      seo.canonical = toFrontendUrl(seo.canonical);
    }

    // Patch WP domain in JSON-LD (affects @id, url, mainEntityOfPage, etc.)
    if (seo.jsonLd?.length) {
      seo.jsonLd = JSON.parse(replaceWpOrigin(JSON.stringify(seo.jsonLd))) as typeof seo.jsonLd;
    }

    return seo;
  } catch (error) {
    console.error("Error fetching Rank Math SEO:", error);
    return null;
  }
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
