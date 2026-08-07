import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { fetchBlogPage, fetchCategories } from "@/lib/services/blog.server";

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
 */
async function safely<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

async function getCourses(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const data = await serverApi.courses.list({ per_page: 500 });
    const items = Array.isArray(data)
      ? data
      : ((data as { items?: Record<string, unknown>[] }).items ?? []);
    return (items as Record<string, unknown>[])
      .filter((c) => typeof c.slug === "string" && c.slug)
      .map((c) => ({ slug: c.slug as string, lastModified: toDate(c.date_modified) }));
  });
}

async function getCourseCategories(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const data = await serverApi.taxonomy.categories({ per_page: 100 });
    return data.items
      .filter((c) => c.slug)
      .map((c) => ({ slug: c.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

async function getBlogPosts(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const { posts } = await fetchBlogPage(1, 500);
    return posts
      .filter((p) => p.slug)
      .map((p) => {
        const raw = p as unknown as { modified_gmt?: string; modified?: string };
        return { slug: p.slug, lastModified: toDate(raw.modified_gmt ?? raw.modified) };
      });
  });
}

async function getBlogCategories(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const cats = await fetchCategories();
    return cats
      .filter((c) => c.slug)
      .map((c) => ({ slug: c.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

async function getBundles(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const data = await serverApi.bundles.list({ per_page: 100 });
    return (data.items ?? [])
      .filter((b) => b.slug)
      .map((b) => ({
        slug: b.slug,
        // RawBundle carries no modification date; fall back to the constant.
        lastModified: toDate((b as { date_modified?: number }).date_modified),
      }));
  });
}

async function getProducts(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const rows = await serverApi.products.list({ per_page: 100 });
    return (rows ?? [])
      .filter((p) => p.slug)
      .map((p) => ({ slug: p.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

/**
 * WP page slugs that have a dedicated Next.js route, plus WP-only pages with no
 * frontend equivalent (`/student-portal/`, `/course-player/`, `/lostpassword/`).
 * The catch-all enumeration below must not emit either group.
 */
const EXPLICIT_ROUTES = new Set([
  "about-us",
  "all-courses",
  "blog",
  "bundles",
  "cancellations",
  "cart",
  "certificate",
  "checkout",
  "contact-us",
  "course-player",
  "course-selector-page",
  "help",
  "login",
  "lostpassword",
  "my-account",
  "pricing",
  "privacy-policy",
  "reviews",
  "sitemap",
  "student-portal",
  "support-request",
  "terms-and-conditions",
  "thank-you-for-ordering-certificate",
  "verify-certificate",
]);

/**
 * WordPress pages served by the `[slug]` catch-all route.
 *
 * Enumerated from the API rather than hardcoded, so a new WP page reaches the
 * sitemap without a code change — hardcoding is why `/training-teams`,
 * `/force-for-good` and `/resources` were missing.
 */
async function getCatchAllPages(): Promise<SitemapEntry[]> {
  return safely(async () => {
    const { items } = await serverApi.pages.list();
    return (items ?? [])
      .filter((p) => p.slug && !EXPLICIT_ROUTES.has(p.slug))
      .map((p) => ({ slug: p.slug, lastModified: STATIC_LAST_MODIFIED }));
  });
}

const staticRoutes: MetadataRoute.Sitemap = (
  [
    { url: base, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/all-courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/bundles`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/certificate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about-us`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact-us`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/cancellations`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/support-request`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/verify-certificate`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
  ] as const
).map((r) => ({ ...r, lastModified: STATIC_LAST_MODIFIED }));

// Excluded intentionally:
// /search                                       — noindex
// /cart, /checkout, /order-confirmation         — transactional, noindex
// /dashboard, /learn, /profile, /orders,
// /business-dashboard                           — protected (robots.txt disallow)
// /login, /register, /forgot-password,
// /reset-password                               — auth, noindex
// /design-system                                — 404 in production

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
