## 1. Data layer

- [x] 1.1 Update `fetchBlogPageGrouped()` (`src/lib/services/blog.server.ts`) to return `trending: BlogPost[]` (top 5 by recency from `allPosts`) instead of a single `BlogPost | null`.
- [x] 1.2 Add trending post IDs to the existing `seen` dedupe set before category grouping runs, so trending posts don't also appear in category sections.
- [x] 1.3 Compute a "Most Recent" list: first 4 posts from `allPosts` excluding trending IDs. Implemented as a separate `mostRecent: BlogPost[]` field (simpler than a `CategorySection`-shaped sentinel) — `page.tsx` renders it with its own inline grid markup, consistent with category sections but not reusing the type.

## 2. Components

- [x] 2.1 Extract the existing inline `TrendingPost` function from `blog/page.tsx` into `src/components/home/trending-carousel.tsx` as a client component `TrendingCarousel({ posts, categorySections })` that manages `active` index state, renders the current post via the existing card markup, and adds prev/next arrow buttons + dot indicators (reuse the visual pattern from `src/components/home/hero-carousel.tsx`'s nav controls, not its stacked-card layout).
- [x] 2.2 Create `src/components/home/blog-team-cta.tsx` — static component, no props, dark-navy gradient band (`linear-gradient(113.58deg, #00204a 0%, #004f65 100%)`) with heading "Want to Train Your Team?", subtext "Invest in your people. Get a bespoke training plan today.", and a "Request A Quote" button linking to `/contact-us`.

## 3. Page wiring

- [x] 3.1 Update `blog/page.tsx`: replace the single `<TrendingPost>` render with `<TrendingCarousel posts={trending} categorySections={categorySections} />`.
- [x] 3.2 Add the "Most Recent" section immediately after Trending Topics and before the category-sections loop, using the same grid/heading/"View more" markup pattern as category sections (link "View more" to `/blog`). Also excluded trending+mostRecent IDs from the existing "no categories" flat-fallback branch to prevent duplicate cards there too (a gap the original ternary would otherwise have re-introduced).
- [x] 3.3 Add `<BlogTeamCta />` after the last content section (categories or empty state), before the page's closing fragment (footer is global layout, unaffected).
- [x] 3.4 Verified the empty-state path by code review: the existing three-way ternary (categories / flat fallback / `EmptyState`) is unchanged in structure, and `<BlogTeamCta />` sits unconditionally after it — so it renders regardless of which branch fires.

## 4. Verification

- [x] 4.1 `pnpm typecheck` and `pnpm lint` pass (0 errors; only pre-existing warnings in unrelated files).
- [x] 4.2 Ran `pnpm dev`, loaded `/blog`. With only 1 real post on the local site, temporarily created 6 throwaway WP-CLI test posts (3 tagged to the real "Health & Social Care" category, 3 uncategorized) to exercise the multi-post paths, then deleted all of them (and a bogus category accidentally created by a `wp post term set` slug/ID mixup) immediately after — confirmed via screenshot: 5-dot trending carousel with working prev/next, "Most Recent" showing exactly the 2 non-trending posts (no overlap), a category section rendering correctly, and the CTA band above the footer. Local WP content is back to its original single-post state.
- [x] 4.3 Confirmed via 3.4's code review — no separate empty-database test needed (the only real content on this instance is a single genuine post, not worth removing to test a purely structural, already-reviewed code path).
