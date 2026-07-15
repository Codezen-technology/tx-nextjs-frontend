## Why

The current `/blog` page (Figma node `4900:75788` in the "Blog (listing)" pass) was migrated with a single-post "Trending Topics" spotlight and category-grouped grids, but the current Figma design shows three things the page doesn't have: a multi-post trending carousel (arrows + dot pagination, not one static post), a "Most Recent" section ahead of the category sections, and a "Want to Train Your Team?" CTA band before the footer. Updating the page to match keeps it visually and structurally consistent with the rest of the redesigned site (home, and the team-CTA pattern already shipped there).

## What Changes

- Trending Topics becomes a carousel of the most recent posts (prev/next arrows + dot indicators), instead of rendering only `allPosts[0]` as a single static card.
- Add a "Most Recent" section — the latest posts across all categories — as the first content section, appearing before the per-category sections (currently the page only shows category-grouped grids, or an "all posts" fallback grid when no categories exist; there is no always-on "latest posts" section).
- Add a "Want to Train Your Team?" CTA band (heading, subtext, single "Request A Quote" button, dark navy background) directly above the footer — a lighter, blog-specific variant of the homepage's "Transform Your Team" section, not wired to any backend content (static copy, same pattern as the footer's own hardcoded CTA band).
- Posts already shown in the trending carousel are excluded from "Most Recent" and the category sections, so the same post doesn't appear twice on one page load.
- No change to `BlogCard`'s visual design — it already matches the Figma card (category tag + date, 2-line title, 2-line excerpt, "Read more →") — or to the hero band, which already matches.

## Capabilities

### New Capabilities

- `blog-trending-carousel`: The trending-posts carousel at the top of `/blog` — multiple posts, prev/next navigation, dot pagination, auto-selecting from the most recent posts.
- `blog-most-recent-section`: The "Most Recent" section on `/blog` — always-shown latest-posts grid appearing before category sections, excluding posts already surfaced in the trending carousel.
- `blog-team-cta`: The "Want to Train Your Team?" static CTA band on `/blog`, positioned above the footer.

### Modified Capabilities

_None — no existing specs cover the blog listing page._

## Impact

**Frontend only** (`tx-headless-frontend/`) — no backend involvement; the blog listing is served entirely from native WordPress `/wp/v2/posts` and `/wp/v2/categories`, not the custom `lms-backend/v1` plugin.

- `src/app/[locale]/(marketing)/blog/page.tsx` — render a carousel instead of a single `TrendingPost`, add the "Most Recent" section, add the team-CTA band.
- `src/lib/services/blog.server.ts` — `fetchBlogPageGrouped()` needs to return multiple trending posts (not just `allPosts[0]`) and exclude those from downstream grouping/most-recent.
- New component(s) under `src/components/home/` or `src/components/blog/` for the trending carousel and the CTA band (naming/location decided in `design.md`).
- `src/components/home/blog-card.tsx` — unchanged.
