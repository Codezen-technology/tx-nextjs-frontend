## Why

A live audit run against the production WordPress backend, after `fix-seo-metadata-defects` shipped, found three route families that are effectively invisible or misrepresented to search engines: every `/product/{slug}` page renders with **no `<head>` metadata at all**, the sitemap silently truncates courses and products at 100 entries (100 of 238 courses, 100 of 280 products), and it contains **zero** blog post URLs. Alongside those, the sitemap advertises URLs that redirect, 404 softly, or are explicitly `noindex`, and every page title carries the brand name twice.

These are not regressions of the previous change's stated goals — they are the defects that change's unit tests could not see, because each one only appears against real backend data volumes and real Rank Math payloads.

## What Changes

- **Product page metadata restored.** `buildPageMetadata` passes Rank Math's `og:type` straight into Next's `Metadata.openGraph.type` behind an `as "website"` cast. WooCommerce products return `og:type=product`, which Next rejects at metadata-resolution time (`Error: Invalid OpenGraph type: product`), discarding the entire head — title, description, canonical, robots, OG and Twitter tags. Unsupported values will be mapped to a supported one instead of thrown at Next, and the lying cast removed.
- **Sitemap pagination.** Course and product sources request `per_page: 500` / `100` and take whatever one page returns. Both backends cap a page at 100. The sitemap will page through each source until exhausted, rather than emitting the first page and stopping.
- **Blog posts in the sitemap.** The blog source calls `fetchBlogPage(1, 500)`; WordPress rejects `per_page > 100` with HTTP 400, the helper returns an empty result, and the sitemap's error-tolerance swallows it into zero URLs. Requests will stay within the API's documented bounds, and a source that returns nothing will be visible rather than silent.
- **Sitemap membership becomes an allowlist decision.** The catch-all WordPress page enumeration is filtered by a hand-maintained denylist (`EXPLICIT_ROUTES`), which has already fallen behind: `/register`, `/business-dashboard`, `/shop`, `/home`, `/activate`, `/activate-2`, `/activity`, `/members-directory`, `/registration` and `/pwa` are all currently advertised. Membership will be decided by what the Next.js application actually serves as an indexable page, not by a list someone has to remember to update.
- **Catch-all soft 404s become real 404s.** `/shop` returns HTTP 200 with the title "Page Not Found" and an indexable robots directive. A catch-all page whose WordPress source has no renderable content will return a genuine 404.
- **Single brand suffix in titles.** Rank Math titles already end in the site name; the root layout's `title.template` appends it again, producing `… - Training Excellence | Training Excellence` (and three times on `/home`). Resolved page titles will carry the brand exactly once.
- **Verification against real data.** The regression tests for the above will exercise volumes and payload shapes that mirror production (multi-page sources, a `product` OG type, a WordPress page list containing non-indexable slugs), so a fixture that fits on one page cannot pass for coverage again.

Out of scope, recorded for the WordPress side: the homepage meta description is literally `"VK"`, and blog posts emit `noindex, nofollow` at source. Both are Rank Math field values on WordPress; the frontend renders them faithfully and correcting them is a content task, not a code one.

## Capabilities

### New Capabilities

<!-- None. This change corrects behaviour already specified by the two SEO capabilities below. -->

### Modified Capabilities

- `seo-metadata`: adds the requirement that a Rank Math value the framework cannot represent degrades to a supported one rather than discarding the page's metadata, and that a page's resolved title carries the site brand exactly once.
- `seo-indexing-controls`: strengthens sitemap coverage from "the route family appears" to "every entry of the family appears, across paginated sources", makes sitemap membership a property of what the app serves rather than a maintained denylist, and requires a catch-all page with no content to 404 rather than render an indexable not-found page.

## Impact

- `src/lib/seo/server.ts` — `buildPageMetadata` OG-type handling and title shape.
- `src/app/sitemap.ts` — pagination across course, product, blog-post and page sources; membership filter replacing `EXPLICIT_ROUTES`.
- `src/lib/services/blog.server.ts` — per-page bounds on `fetchBlogPage`.
- `src/app/[locale]/(marketing)/[slug]/page.tsx` — 404 for a WordPress page with no renderable content.
- `src/app/layout.tsx` — title template interaction with page-level titles.
- `src/__tests__/seo-*.test.ts`, `src/__tests__/sitemap.test.ts` — fixtures sized and shaped like production.
- No API contract, dependency, or database change. `sitemap.xml` grows by roughly 320 URLs and loses about 10.
