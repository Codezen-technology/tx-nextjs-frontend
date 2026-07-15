## Why

Category "View more" links on `/blog` (added in the recent blog redesign) point to `/blog/category/{slug}`, but that route doesn't exist — it 404s. The page needs to exist, styled like the main blog archive (hero, Trending Topics), but showing the full, paginated list of posts for that one category instead of a 4-post preview.

## What Changes

- Add `/blog/category/[slug]` — a new page showing: the same hero band as `/blog`, the same site-wide Trending Topics carousel, then a paginated grid of every post in that category (using `?page=` query params, matching the existing `/course-cat/[slug]` pagination convention).
- Unknown category slugs return a real 404 (`notFound()`), not a broken/empty page.
- Extract the hero band currently inlined in `blog/page.tsx` into a shared `BlogHero` component so both `/blog` and `/blog/category/[slug]` render an identical hero without duplicating markup.
- Add a category-scoped, paginated post fetcher to the blog data layer (`fetchPostsByCategory`), alongside a lightweight `fetchTrending()` so this page doesn't need the full `fetchBlogPageGrouped()` (category-bucketing, most-recent-exclusion) just to get the same 5 trending posts shown on `/blog`.
- The category page's `BlogTeamCta` band and footer match `/blog` for visual consistency.

## Capabilities

### New Capabilities

- `blog-category-page`: The `/blog/category/[slug]` route — hero, site-wide trending carousel, paginated category post grid, 404 handling, and SEO metadata.

### Modified Capabilities

_None — no existing spec covers blog pages yet (the prior blog-page-redesign change's specs cover `/blog` itself, not a category archive)._

## Impact

**Frontend only** (`tx-headless-frontend/`) — native WordPress REST (`/wp/v2/posts`, `/wp/v2/categories`), same as the rest of the blog feature; no backend plugin involvement.

- New: `src/app/[locale]/(marketing)/blog/category/[slug]/page.tsx`
- New: `src/components/home/blog-hero.tsx` (extracted from `blog/page.tsx`)
- `src/app/[locale]/(marketing)/blog/page.tsx` — swap its inline hero markup for `<BlogHero />`
- `src/lib/services/blog.server.ts` — add `fetchPostsByCategory(categorySlug, page, perPage)` and `fetchTrending(count)`
- Reuses existing `TrendingCarousel`, `BlogCard`, `BlogTeamCta` components unchanged
