/**
 * WordPress path mappings for Rank Math SEO lookups.
 *
 * Rank Math's `getHead` endpoint answers HTTP 200 with `success: true` even when
 * it cannot resolve the URL — it returns the site homepage's `<head>`, or a bare
 * 404 head. There is no error channel. A wrong path here therefore does not fail
 * loudly; it produces confidently wrong metadata (another page's canonical).
 *
 * Two such mappings shipped undetected before the guard in `fetchRankMathSeo`
 * existed: blog posts requested `/{slug}` (WP serves `/blog/{slug}/`) and course
 * categories requested `/course-category/{slug}` (WP serves `/course-cat/{slug}/`).
 *
 * Every entry below was verified against production sitemaps and `getHead`
 * probes — see `SEO_AUDIT.md` (Method). Trailing slashes match what WordPress
 * actually serves; `fetchRankMathSeo` normalises before comparing, so either
 * form matches, but storing the true form keeps this table honest.
 *
 * ADDING A ROUTE: add its entry here and an MSW case to `seo-wp-paths.test.ts`.
 * Do not inline a path literal at the call site.
 */
export const wpPath = {
  home: () => "/",
  course: (slug: string) => `/course/${slug}/`,
  courseCategory: (slug: string) => `/course-cat/${slug}/`,
  blogPost: (slug: string) => `/blog/${slug}/`,
  blogCategory: (slug: string) => `/blog/category/${slug}/`,
  bundle: (slug: string) => `/bundles/${slug}/`,
  product: (slug: string) => `/product/${slug}/`,
  page: (slug: string) => `/${slug}/`,
} as const;

/**
 * Strip trailing slashes for comparison. The root path stays `/`.
 * WordPress serves `/course/x/`; Next.js serves `/course/x`. Neither form is
 * wrong — they just have to be compared on equal terms.
 */
export function normalizePath(pathname: string): string {
  const stripped = pathname.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}
