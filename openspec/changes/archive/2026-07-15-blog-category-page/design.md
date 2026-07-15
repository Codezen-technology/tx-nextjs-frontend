## Context

`/blog` (just redesigned) links "View more" on each category section to `/blog/category/{category.slug}` — a route that was never built, so it 404s (confirmed live). The sibling course-catalog feature already has an equivalent, working pattern at `/course-cat/[slug]/page.tsx`: `generateStaticParams` from the full category list, `notFound()` for unresolved slugs, a `?page=` search param (`Math.max(1, Number(page) || 1)`), `Promise.allSettled` for parallel category/posts/SEO fetches, and inline `Link`-based prev/next + numbered page links (not the client-state `src/components/ui/pagination.tsx`, which is built for `onPageChange` callbacks and used elsewhere for client-driven tables). The blog category page should follow this exact shape for consistency, swapping courses for posts.

`fetchBlogPageGrouped()` (`src/lib/services/blog.server.ts`) already computes trending posts, but bundled together with category-bucketing and most-recent-exclusion logic this page doesn't need — calling it here would do wasted work (grouping into buckets never rendered) just to get the same 5 trending posts already shown on `/blog`.

## Goals / Non-Goals

**Goals:**

- `/blog/category/{slug}` renders for every real category, 404s for unknown ones.
- Visually matches `/blog`: same hero, same Trending Topics carousel (site-wide, not category-filtered — matches user intent: "Trending Topics ... happen" as its own section, not scoped to the category).
- Full paginated listing of the category's posts (not capped at 4 like the preview on `/blog`).
- No duplicated hero markup between `/blog` and this new page.

**Non-Goals:**

- No category-specific trending (Trending Topics stays site-wide on this page too).
- No changes to `/blog` itself beyond extracting its hero into a shared component (behavior identical).
- No backend changes — still native WP REST.

## Decisions

**1. New `fetchPostsByCategory(categorySlug, page, perPage)` resolves slug → category ID via the existing `fetchCategories()`, then queries `/wp/v2/posts?categories={id}&page={page}&per_page={perPage}&_embed=wp:featuredmedia,author`, returning `{ category, posts, total, totalPages } | null`** (null when the slug doesn't resolve to a category — the page calls `notFound()` in that case). Reuses `fetchCategories()` rather than adding a second categories fetch — same function `/blog` already calls.

**2. New `fetchTrending(count = 5)` extracts just the trending slice** (`allPosts.slice(0, count)` from a plain `/wp/v2/posts?per_page={count}&_embed=...` call) — no category-bucketing. `fetchBlogPageGrouped()` is left as-is for `/blog`; this is a separate, cheaper function for pages that only need the trending carousel.

**3. Extract `blog/page.tsx`'s inline hero JSX into `src/components/home/blog-hero.tsx`** (no props — it's static markup, search form posts to `/search`). Both `/blog` and the new category page render `<BlogHero />`. Rejected alternative: duplicate the JSX — rejected to avoid the two pages drifting out of sync on the next hero tweak.

**4. Pagination follows `/course-cat/[slug]`'s inline Link-based pattern exactly** (`?page=N` search param, prev/next + numbered links, `basePath` = `/blog/category/{slug}`), not the client-state `ui/pagination.tsx` component — keeps this page consistent with its closest sibling and server-rendered/no-JS-required.

**5. Category description, if WP has one (`category.description`), renders under the category heading; otherwise the heading renders alone** — same fallback pattern `/course-cat/[slug]` uses for its category description.

## Risks / Trade-offs

- **[Trade-off] Trending Topics is identical on every category page and `/blog`.** Acceptable per Goals — matches the explicit ask, and avoids the complexity/cost of category-scoped trending logic that isn't part of this request.
- **[Risk] `generateStaticParams` pre-builds one page per category at build time** — same approach `/course-cat/[slug]` already uses at the same scale (category counts are small); no new concern introduced.

## Migration Plan

Purely additive (new route + new service functions + one component extraction with behavior-preserving output). No rollback complexity — `git revert` is sufficient if needed. `revalidate = 300`, matching every other blog/category page on the site.
