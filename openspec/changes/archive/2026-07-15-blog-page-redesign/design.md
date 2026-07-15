## Context

`/blog` (`src/app/[locale]/(marketing)/blog/page.tsx`) fetches its data via `fetchBlogPageGrouped()` (`src/lib/services/blog.server.ts`), which pulls up to 40 recent posts + all categories from native WP REST (`/wp/v2/posts`, `/wp/v2/categories` — no custom backend involved). Today it returns `{ trending: BlogPost | null, categorySections: CategorySection[], allPosts: BlogPost[] }`, where `trending` is just `allPosts[0]` and `categorySections` buckets up to 4 posts per category (first category ID per post, deduped via a `seen` set). The Figma redesign (node `4900:75788`) shows the same hero band and category-grid pattern (both already implemented and matching), plus three additions: a multi-post trending carousel, an always-on "Most Recent" section, and a team-CTA band before the footer.

## Goals / Non-Goals

**Goals:**

- Trending Topics shows several recent posts in a carousel (arrows + dots), not one static post.
- A "Most Recent" section always renders (not just as a no-categories fallback), positioned before category sections.
- Add the "Want to Train Your Team?" CTA band, matching the visual language of the homepage's dark-navy team section but as a simpler, static, single-CTA block.
- No post appears twice on the page (trending carousel posts excluded from Most Recent / category buckets).

**Non-Goals:**

- No redesign of `BlogCard`, the hero band, or category sections — all already match Figma.
- No backend/CMS wiring for the new CTA band — static copy, same pattern as the footer's own hardcoded CTA band and `CategoriesGrid`'s hardcoded heading elsewhere in the codebase.
- No pagination/infinite-scroll changes to category sections or "View more" links.
- No changes to the single blog post page (`/blog/[slug]`).

## Decisions

**1. `fetchBlogPageGrouped()` returns `trending: BlogPost[]` (plural) instead of a single post.** Take the first N (5, matching the Figma mock's 5 dots) posts by recency as the trending set. Rename the return field's meaning but keep the key `trending` (frontend consumers updated in the same change) — no separate WP query needed, it's still sourced from the same already-fetched `allPosts` list, just sliced differently.

**2. Exclude trending post IDs from category-bucket grouping and from "Most Recent".** Add trending post IDs to the existing `seen` dedupe set before grouping runs, and filter them out of the "Most Recent" slice too. Rejected alternative: leaving duplicates in — rejected because Figma's own mock (same 4 identical placeholder cards in every section) is clearly unfinished/placeholder content, not a deliberate "repeat posts across sections" design intent.

**3. "Most Recent" is a `CategorySection`-shaped list, not a new type.** It's rendered with the exact same grid/heading/"View more" pattern as a category section (title="Most Recent", posts=first 4 non-trending posts by recency), so no new card or section component is needed — just a new entry prepended to the sections the page already maps over. "View more" for Most Recent links to `/blog` itself (already the "all posts" context) rather than a category archive.

**4. New `TrendingCarousel` client component (`src/components/home/trending-carousel.tsx`), separate from `HeroCarousel`.** `HeroCarousel` is a stacked 3-card-peek carousel built specifically for course cards (`src/components/courses/course-card.tsx`); the Figma trending carousel is a single large focal card (image + text side-by-side, matching the existing `TrendingPost` sub-component already defined inline in `blog/page.tsx`) with simple prev/next + dot navigation — a different visual pattern, not a re-skin of `HeroCarousel`. Extract the existing `TrendingPost` presentational JSX out of `page.tsx` into this new component and add the carousel state/controls around it.

**5. New `BlogTeamCta` component (`src/components/home/blog-team-cta.tsx`) with hardcoded copy**, styled with the same navy gradient (`linear-gradient(113.58deg, #00204a 0%, #004f65 100%)`) established for the homepage's `TransformTeam` section, for visual consistency across the two dark-band CTAs on the site. Content: heading "Want to Train Your Team?", subtext "Invest in your people. Get a bespoke training plan today.", single "Request A Quote" button → `/contact-us` (same default destination used for the homepage's equivalent CTA).

## Risks / Trade-offs

- **[Risk] Slicing `allPosts` for both "trending" and "Most Recent" means both sections draw from the same 40-post fetch** — fine at current post volumes; if the blog grows significantly, `perPage` may need raising or a dedicated recent-posts query added → Mitigation: not a concern at present volume; flagged for a future change if post count grows.
- **[Trade-off] The CTA band's copy/destination isn't CMS-editable.** Consistent with the existing pattern for other hardcoded section headings on this site (e.g. `CategoriesGrid`'s "Explore courses by category"); revisit only if content editors ask for it specifically.

## Migration Plan

Frontend-only, additive/reshaped read-side change (no schema/data migration). Ship `blog.server.ts` and the two new components together with the updated `page.tsx` in one deploy; `revalidate = 300` on `/blog` means the previous page serves for up to 5 minutes post-deploy, same as any other content change on this route.
