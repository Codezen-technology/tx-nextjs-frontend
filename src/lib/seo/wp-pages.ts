import "server-only";
import { fetchRankMathSeo } from "@/lib/seo/server";
import { wpPath } from "@/lib/seo/wp-paths";
import { claimedTopLevelSlugs, wordpressOnlySlugs } from "@/lib/seo/app-routes";

/**
 * Deciding what the WordPress catch-all route actually serves.
 *
 * The `pages` endpoint cannot tell a real page from a dead one: `/shop` and
 * `/training-teams` both report `content: ""` and `blocks: []`, because real
 * content lives in Elementor and this endpoint does not expose it. Rank Math
 * can — it answers with a canonical only for a path WordPress publishes at that
 * path:
 *
 *   /shop                    404 head, no canonical            → not servable
 *   /activity, /activate     noindex, no canonical             → not servable
 *   /home                    canonical is the site root        → rejected by
 *                                                                the path guard
 *   /training-teams          self-referencing canonical        → servable
 *
 * The sitemap and the catch-all page both read this module, so "servable" means
 * the same thing in both by construction.
 */

/** Minimum shape both the sitemap and the page can supply. */
interface PageContentLike {
  content?: string;
  blocks?: unknown[];
}

/**
 * Does this WordPress page have anything to serve?
 *
 * Not servable requires all three: no content, no blocks, and no Rank Math
 * canonical. Content alone is not enough — Elementor pages report none — and a
 * canonical alone is not enough either, since Rank Math answers for paths the
 * frontend has no data for.
 */
export function isServableWpPage(page: PageContentLike, canonical: string | undefined): boolean {
  if (canonical) return true;
  const hasContent = Boolean(page.content && page.content.trim());
  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0;
  return hasContent || hasBlocks;
}

/**
 * Gate B — does WordPress publish this slug, at this path, as an indexable page?
 *
 * `fetchRankMathSeo` already returns null when the head belongs to a different
 * path, so a canonical here means "WordPress serves this exact path and declares
 * it indexable".
 */
export async function isIndexableWpPage(slug: string): Promise<boolean> {
  const seo = await fetchRankMathSeo(wpPath.page(slug));
  return Boolean(seo?.canonical);
}

/**
 * Gate A — is this slug served by the catch-all at all?
 *
 * False for a slug this app claims with its own route file, and for the
 * WordPress-only pages the frontend has no route for.
 */
export function isCatchAllSlug(slug: string): boolean {
  return !claimedTopLevelSlugs.has(slug) && !wordpressOnlySlugs.has(slug);
}

/**
 * Run an async predicate over items, at most `limit` in flight.
 *
 * The sitemap probes Rank Math once per candidate page (~40 today). Unbounded,
 * that is a burst of 40 concurrent requests at every regeneration.
 */
export async function filterWithConcurrency<T>(
  items: readonly T[],
  predicate: (item: T) => Promise<boolean>,
  limit = 6,
): Promise<T[]> {
  const keep: boolean[] = new Array(items.length).fill(false);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        keep[index] = await predicate(items[index]);
      } catch {
        keep[index] = false;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return items.filter((_, i) => keep[i]);
}
