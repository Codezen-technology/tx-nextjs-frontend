## 1. Data layer

- [x] 1.1 In `src/lib/services/blog.server.ts`, add `fetchTrending(count = 5): Promise<BlogPost[]>` — plain `/wp/v2/posts?per_page={count}&_embed=wp:featuredmedia,author` call, returning the raw list (no category-bucketing).
- [x] 1.2 Add `fetchPostsByCategory(categorySlug: string, page = 1, perPage = 12)` — resolve the slug to a category via `fetchCategories()`, return `null` if no match; otherwise query `/wp/v2/posts?categories={id}&page={page}&per_page={perPage}&_embed=wp:featuredmedia,author` and return `{ category, posts, total, totalPages }` using the `X-WP-Total` / `X-WP-TotalPages` headers (same pattern as `fetchBlogPage`). Also added `description?: string` to the `WPCategory` type (native WP field, needed for the category description sub-goal in task 3).

## 2. Shared hero extraction

- [x] 2.1 Create `src/components/home/blog-hero.tsx` — extract the hero `<section>` (dark band, dotted background, "Training Excellence's / Blogs & Updates" heading, search form) currently inlined in `blog/page.tsx`, verbatim, as a no-props component.
- [x] 2.2 Update `blog/page.tsx` to render `<BlogHero />` instead of the inline hero JSX; visually unchanged (verified).

## 3. Category page

- [x] 3.1 Create `src/app/[locale]/(marketing)/blog/category/[slug]/page.tsx`: `generateStaticParams` from `fetchCategories()`; `generateMetadata` via `fetchRankMathSeo('/blog/category/{slug}')` with a fallback title `"{Category Name} | Training Excellence Blog"`; `revalidate = 300`.
- [x] 3.2 Parse `?page=` the same way `/course-cat/[slug]/page.tsx` does (`Math.max(1, Number(page) || 1)`); fetch `fetchTrending(5)` and `fetchPostsByCategory(slug, page, 12)` in parallel; call `notFound()` when `fetchPostsByCategory` returns `null`.
- [x] 3.3 Rendered `<BlogHero />` → Trending Topics heading + `<TrendingCarousel posts={trending} categorySections={[]} />` → category heading (decoded, + description if present) → `BlogCard` grid of the category's posts → prev/next + numbered pagination links (`?page=N`, `basePath = /blog/category/{slug}`, mirroring `category-courses.tsx`'s inline pattern) → `<BlogTeamCta />`.
- [x] 3.4 Empty category (0 posts, valid slug) renders `EmptyState` in place of the grid; `BlogTeamCta` renders unconditionally after regardless of branch.

## 4. Verification

- [x] 4.1 `pnpm typecheck` and `pnpm lint` pass (0 errors; same 46 pre-existing warnings in unrelated files).
- [x] 4.2 Verified live: `/blog/category/health-social-care` renders hero + trending + 7 real category posts (200); `/blog/category/does-not-exist` returns a real 404. Temporarily seeded 6 more posts into the real "Health & Social Care" category (via `wp post term set --by=slug`, correctly this time) to push it past the 12-post page size and confirm pagination — page 1 showed 12 posts with working "Blog pages" nav, page 2 showed the 13th; deleted all 6 temp posts afterward (category back to its real count of 7). A brief false alarm mid-verification (stale-looking `total: 7` in a debug log) turned out to be Turbopack recompilation lag from testing immediately after a file edit, not a real bug — resolved once the dev server settled.
- [x] 4.3 Confirmed `/blog`'s hero renders identically after the `BlogHero` extraction (title, subtitle, search form all present).
