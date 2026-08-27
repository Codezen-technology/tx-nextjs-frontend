## Why

The SEO audit (`SEO_AUDIT.md`, 2026-08-04) confirmed against the live WordPress backend that Rank Math's `getHead` endpoint answers `success: true` with the **wrong page's `<head>`** when it does not recognise a URL — it returns the homepage head, or a bare 404 head. `fetchRankMathSeo` trusts that response unconditionally, and `buildPageMetadata` prefers every Rank Math field over the hand-written fallback. Two wrong WP path mappings shipped behind this silence: blog posts emit `canonical = https://site/` (a de-indexing instruction pointing every post at the homepage) and all eight course category pages emit the identical title `"Training Excellence"` with no meta description.

Beyond the metadata layer, the audit found the same class of "silently wrong" output in crawl directives: every Rank Math canonical carries a trailing slash the frontend then 308-redirects away, the sitemap omits five live route families, paginated category pages canonicalise to page 1, and cart/checkout/business-dashboard/design-system pages are fully indexable.

## What Changes

**Rank Math integration integrity**

- `fetchRankMathSeo` validates that the canonical it received resolves to the path it requested, and discards the entire payload on mismatch so the hand-written fallbacks take over. This is the root-cause fix — it converts a silent wrong-metadata failure into a safe degrade.
- Correct the two wrong WP path mappings: blog posts `/{slug}` → `/blog/{slug}/`, course categories `/course-category/{slug}` → `/course-cat/{slug}/`.
- Normalise trailing slashes on canonicals and on JSON-LD `@id`/`url` values so canonical, `openGraph.url`, and `sitemap.xml` all agree on one URL form.
- `metadataBase` and the Rank Math fetch base read from `src/lib/env.ts` (`env.SITE_URL`, `getServerWpJsonBase()`) instead of `process.env` directly, so an unset var can no longer produce relative OG image URLs.

**Indexing and crawl directives**

- Sitemap gains `/bundles`, `/bundles/{slug}`, `/blog/category/{slug}`, `/product/{slug}`, `/pricing`, `/certificate`, and the catch-all WP pages that are live (`/training-teams`, `/force-for-good`, `/resources`).
- Sitemap `lastModified` uses real per-entity modification timestamps instead of `new Date()` at request time.
- Paginated course category pages emit a self-referencing canonical including `?page=N`.
- `robots.ts` disallows `/cart`, `/checkout`, `/order-confirmation`, `/business-dashboard`, `/reset-password`, `/design-system`; auth, cart, checkout, and business routes additionally export `robots: { index: false, follow: false }` (robots.txt blocks crawling, not indexing).
- `/product/[slug]` gains `generateStaticParams`.

**On-page corrections**

- `/all-courses` gains an `<h1>` (currently has none, at sitemap priority 0.9).
- Header `/courses` link retargeted to `/all-courses` (it currently resolves to a protected student route that redirects crawlers to `/login`); dead `/careers` and `/special-offers` nav links removed.
- The four raw `<img>` tags in `transform-team.tsx` and `cpd-certificate.tsx` become `next/image` with explicit dimensions.

**Out of scope** — tracked in `SEO_AUDIT.md`, not this change:

- WordPress-side fixes: the homepage Rank Math description is literally `"VK"`, and the site's single blog post is `noindex, nofollow`. Both are WP admin edits with no code component.
- Deciding whether the blog is a live channel (1 post exists).
- Missing `Organization`/`BreadcrumbList`/`AggregateRating` schema and currency-aware `Course` offers.
- hreflang / multi-locale metadata (single locale today).

## Capabilities

### New Capabilities

- `seo-metadata`: How page metadata is sourced from Rank Math, validated against the request, merged with fallbacks, and normalised into canonical/OpenGraph/JSON-LD output.
- `seo-indexing-controls`: Which URLs the site declares as indexable — sitemap membership and freshness, robots directives, per-route noindex, and pagination canonicals.

### Modified Capabilities

<!-- None. Existing specs (blog-single-page, blog-category-page, homepage-sections, etc.) describe page content and interaction; none state metadata or crawl-directive requirements, so none of their requirements change. -->

## Impact

**Code**

- `src/lib/seo/server.ts` — payload validation, trailing-slash normalisation, server WP base
- `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` — WP path (2 call sites)
- `src/app/[locale]/(marketing)/course-cat/[slug]/page.tsx` — WP path (2 call sites), paginated canonical
- `src/app/sitemap.ts` — route coverage, real `lastModified`
- `src/app/robots.ts` — disallow list
- `src/app/layout.tsx` — `metadataBase`
- `src/app/[locale]/(shop)/product/[slug]/page.tsx` — `generateStaticParams`
- `(auth)`, `(shop)`, `(business)` layouts — `robots: { index: false }`
- `src/components/courses/all-courses-hero.tsx` — `<h1>`
- `src/components/layout/header.tsx`, `footer.tsx` — nav targets
- `src/components/home/transform-team.tsx`, `cpd-certificate.tsx` — `next/image`
- `src/app/[locale]/design-system/page.tsx` — production gating

**External dependencies**

- Rank Math `getHead` response shape. The validation guard is deliberately defensive: it assumes the endpoint can return a 200 with unrelated content, because it demonstrably does.
- WP permalink structure. The path-mapping table in `SEO.md` becomes load-bearing and needs test coverage per route family.

**Risk**

- The validation guard will cause pages whose WP path mapping is wrong to fall back to hand-written metadata rather than surfacing an error. Mitigated by logging the mismatch and by unit tests asserting each route family's mapping resolves.
- Changing canonical URL form site-wide is a recrawl event. Expect Search Console churn ("Page with redirect", "Alternate page with proper canonical tag") for a few weeks after deploy.

**Docs**

- `SEO.md` — document the validation contract and the verified WP↔Next path mapping table.
