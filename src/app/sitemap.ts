import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { fetchBlogPage, fetchCategories } from "@/lib/services/blog.server";
import { staticIndexableRoutes } from "@/lib/seo/app-routes";
import { isCatchAllSlug, isIndexableWpPage, filterWithConcurrency } from "@/lib/seo/wp-pages";

const base = env.SITE_URL.replace(/\/$/, "");

/**
 * `lastmod` for entries whose source exposes no modification date — static
 * marketing routes and taxonomy terms.
 *
 * A checked-in constant, deliberately not `new Date()`: a per-request timestamp
 * claims every URL on the site changed today, on every fetch, and search engines
 * discount a `lastmod` they cannot corroborate. Bump this when the affected page
 * content actually changes.
 */
const STATIC_LAST_MODIFIED = new Date("2026-08-04T00:00:00Z");

/** WordPress dates arrive as Unix seconds, `modified_gmt`, or not at all. */
function toDate(value: unknown, fallback: Date = STATIC_LAST_MODIFIED): Date {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }
  if (typeof value === "string" && value) {
    // `modified_gmt` carries no timezone suffix but is always UTC.
    const parsed = new Date(/Z|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

interface SitemapEntry {
  slug: string;
  lastModified: Date;
}

/**
 * Every sitemap source degrades to an empty array. A single failing upstream
 * must shrink the document, never fail it — an erroring sitemap route is worse
 * for crawling than a partial one.
 *
 * An empty family is logged: silence is how zero blog posts looked identical to
 * a site with no blog for the life of the previous change.
 */
async function safely<T>(family: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    const items = await fn();
    if (!items.length) console.warn(`[sitemap] ${family} resolved to zero entries`);
    return items;
  } catch (error) {
    console.warn(`[sitemap] ${family} failed:`, error);
    return [];
  }
}

/**
 * Every source here caps a page at 100 items. The LMS endpoint clamps silently
 * (a `per_page=500` request answers 200 with 100 of 238 courses), WooCommerce
 * clamps the same way, and `wp/v2/posts` rejects the request outright — so
 * "ask for everything at once" reads as full coverage while dropping most of it.
 */
const MAX_PER_PAGE = 100;

/** Runaway guard: 50 pages × 100 = 5,000 URLs per route family. */
const MAX_PAGES = 50;

/**
 * Page through a source until it is exhausted.
 *
 * `fetchPage` returns the sitemap entries on that page, how many rows the API
 * actually sent (`received` — entries may be filtered, rows are what signals a
 * short page), and where reported, the total page count. Stops on a short page,
 * on the reported total, or at `MAX_PAGES`. A page that throws ends the walk
 * with whatever was collected — partial coverage beats no document.
 */
interface SourcePage<T> {
  items: T[];
  received: number;
  totalPages?: number;
}

async function collectAllPages<T>(
  family: string,
  fetchPage: (page: number, perPage: number) => Promise<SourcePage<T>>,
): Promise<T[]> {
  const collected: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    let result: SourcePage<T>;
    try {
      result = await fetchPage(page, MAX_PER_PAGE);
    } catch (error) {
      console.warn(
        `[sitemap] ${family} failed on page ${page}, keeping ${collected.length}:`,
        error,
      );
      return collected;
    }

    collected.push(...result.items);

    if (result.received < MAX_PER_PAGE) return collected;
    if (result.totalPages && page >= result.totalPages) return collected;
    if (page === MAX_PAGES) {
      console.warn(`[sitemap] ${family} hit the ${MAX_PAGES}-page cap — later entries are missing`);
    }
  }

  return collected;
}

async function getCourses(): Promise<SitemapEntry[]> {
  return safely("courses", () =>
    collectAllPages("courses", async (page, per_page) => {
      const data = await serverApi.courses.list({ page, per_page });
      const items = Array.isArray(data)
        ? data
        : ((data as { items?: Record<string, unknown>[] }).items ?? []);
      const rows = items as Record<string, unknown>[];
      const total = Array.isArray(data) ? undefined : (data as { total?: number }).total;
      return {
        items: rows
          .filter((c) => typeof c.slug === "string" && c.slug)
          .map((c) => ({ slug: c.slug as string, lastModified: toDate(c.date_modified) })),
        received: rows.length,
        totalPages: total ? Math.ceil(total / per_page) : undefined,
      };
    }),
  );
}

async function getCourseCategories(): Promise<SitemapEntry[]> {
  return safely("course categories", async () => {
    const data = await serverApi.taxonomy.categories({ per_page: MAX_PER_PAGE });
    return data.items
      .filter((c) => c.slug)
      .map((c) => ({ slug: c.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

async function getBlogPosts(): Promise<SitemapEntry[]> {
  return safely("blog posts", () =>
    collectAllPages("blog posts", async (page, perPage) => {
      const { posts, totalPages } = await fetchBlogPage(page, perPage);
      return {
        items: posts
          .filter((p) => p.slug)
          .map((p) => {
            const raw = p as unknown as { modified_gmt?: string; modified?: string };
            return { slug: p.slug, lastModified: toDate(raw.modified_gmt ?? raw.modified) };
          }),
        received: posts.length,
        totalPages: totalPages || undefined,
      };
    }),
  );
}

async function getBlogCategories(): Promise<SitemapEntry[]> {
  return safely("blog categories", async () => {
    const cats = await fetchCategories();
    return cats
      .filter((c) => c.slug)
      .map((c) => ({ slug: c.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

async function getBundles(): Promise<SitemapEntry[]> {
  return safely("bundles", () =>
    collectAllPages("bundles", async (page, per_page) => {
      const data = await serverApi.bundles.list({ page, per_page });
      const rows = data.items ?? [];
      return {
        items: rows
          .filter((b) => b.slug)
          .map((b) => ({
            slug: b.slug,
            // RawBundle carries no modification date; fall back to the constant.
            lastModified: toDate((b as { date_modified?: number }).date_modified),
          })),
        received: rows.length,
      };
    }),
  );
}

async function getProducts(): Promise<SitemapEntry[]> {
  return safely("products", () =>
    collectAllPages("products", async (page, per_page) => {
      const rows = (await serverApi.products.list({ page, per_page })) ?? [];
      return {
        items: rows
          .filter((p) => p.slug)
          .map((p) => ({ slug: p.slug, lastModified: STATIC_LAST_MODIFIED })),
        received: rows.length,
      };
    }),
  );
}

/**
 * WordPress pages served by the `[slug]` catch-all route.
 *
 * Two gates, both derived rather than remembered:
 *
 *  A. the slug is not claimed by one of this app's own route files, and is not
 *     a WordPress-only page the frontend has no route for (`app-routes.ts`);
 *  B. WordPress publishes that exact path as indexable — Rank Math answers with
 *     a self-referencing canonical (`wp-pages.ts`).
 *
 * The denylist this replaced advertised `/register`, `/business-dashboard`,
 * `/shop`, `/home`, `/activate`, `/activity` and `/pwa` on the live site.
 */
async function getCatchAllPages(): Promise<SitemapEntry[]> {
  return safely("catch-all pages", async () => {
    const { items } = await serverApi.pages.list();
    const candidates = (items ?? []).filter((p) => p.slug && isCatchAllSlug(p.slug));
    const servable = await filterWithConcurrency(candidates, (p) => isIndexableWpPage(p.slug));
    return servable.map((p) => ({ slug: p.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

/**
 * Static entries come from the route registry, so a route the app stops serving
 * cannot linger here, and a new indexable route cannot be forgotten.
 *
 * Non-indexable routes — search, auth, cart, checkout, order confirmation, the
 * student and business dashboards, the learn player and the design system — are
 * flagged in `app-routes.ts` and excluded there.
 */
const staticRoutes: MetadataRoute.Sitemap = staticIndexableRoutes.map((route) => ({
  url: route.path === "/" ? base : `${base}${route.path}`,
  lastModified: STATIC_LAST_MODIFIED,
  changeFrequency: route.changeFrequency,
  priority: route.priority,
}));

function toEntries(
  entries: SitemapEntry[],
  path: (slug: string) => string,
  changeFrequency: "weekly" | "monthly",
  priority: number,
): MetadataRoute.Sitemap {
  return entries.map(({ slug, lastModified }) => ({
    url: `${base}${path(slug)}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, courseCategories, posts, blogCategories, bundles, products, pages] =
    await Promise.all([
      getCourses(),
      getCourseCategories(),
      getBlogPosts(),
      getBlogCategories(),
      getBundles(),
      getProducts(),
      getCatchAllPages(),
    ]);

  return [
    ...staticRoutes,
    ...toEntries(courses, (s) => `/course/${s}`, "weekly", 0.8),
    ...toEntries(courseCategories, (s) => `/course-cat/${s}`, "weekly", 0.7),
    ...toEntries(bundles, (s) => `/bundles/${s}`, "weekly", 0.7),
    ...toEntries(products, (s) => `/product/${s}`, "weekly", 0.6),
    ...toEntries(posts, (s) => `/blog/${s}`, "monthly", 0.6),
    ...toEntries(blogCategories, (s) => `/blog/category/${s}`, "weekly", 0.5),
    ...toEntries(pages, (s) => `/${s}`, "monthly", 0.5),
  ];
}
