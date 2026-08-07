## Context

See `proposal.md` — Why. What follows is the state each fix has to work against, verified against the production backend (`https://trainingexcellence.org.uk`) on 2026-08-07.

**Open Graph.** Next's `OpenGraphType` union is closed: `article | book | music.* | profile | website | video.*` (`node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts:2`). `buildPageMetadata` writes `(seo?.ogType ?? "website") as "website"` — the cast satisfies `tsc` for any string. Rank Math returns `og:type=product` for WooCommerce products; Next throws `Invalid OpenGraph type: product` while resolving metadata and emits **no head metadata at all** for that page. Confirmed live: `/product/health-and-safety-officer-training` renders zero `<title>`, `<link rel=canonical>`, and `<meta name=robots>` elements, for both a browser and a Googlebot user agent.

**Page-size caps.** `lms-backend/v1/courses` clamps `per_page` to 100 silently — a `per_page=500` request returns `{items: 100, total: 238}` with HTTP 200. The WooCommerce Store API returns 100 of 280 products (`X-WP-Total: 280`). `wp/v2/posts` is stricter: `per_page=500` is HTTP 400 `rest_invalid_param`, so `fetchBlogPage(1, 500)` returns `{posts: [], total: 0}` and `safely()` turns that into zero blog URLs. The live sitemap is 254 URLs: 100 courses, 100 products, 0 blog posts.

**Catch-all membership.** `getCatchAllPages()` lists all 41 WordPress pages and subtracts the hand-written `EXPLICIT_ROUTES` set. What survives includes `/register` (`noindex, nofollow` on the frontend), `/business-dashboard` (307 to login), `/shop` (HTTP 200, "Page Not Found", `index, follow` — a soft 404), `/home` (the homepage's content at a second URL), plus `/activate`, `/activate-2`, `/activity`, `/members-directory`, `/registration`, `/pwa`.

**What distinguishes those slugs.** The LMS `pages` endpoint cannot tell them apart: `/shop` and `/training-teams` both return `content: ""`, `blocks: []` (real content lives in Elementor, which this endpoint does not expose). Rank Math can. Probing `getHead` per slug:

| slug                                                                               | WP frontend        | Rank Math canonical                       |
| ---------------------------------------------------------------------------------- | ------------------ | ----------------------------------------- |
| `shop`                                                                             | connection refused | none (404 head, title "Page Not Found")   |
| `activity`, `activate`, `pwa`                                                      | 200                | none (noindex on WordPress)               |
| `home`                                                                             | 200                | `https://…/` — the site root, not `/home` |
| `training-teams`, `resources`, `write-for-us`, `members-directory`, `registration` | 200                | self-referencing                          |

So "WordPress declares this path indexable at this path" is exactly `fetchRankMathSeo(wpPath.page(slug))` returning a payload **with** a canonical — the guard already written in the previous change. `/home` is rejected by that guard's path comparison for free.

**Titles.** `src/app/layout.tsx` sets `title.template = "%s | ${siteName}"`. Rank Math titles already end in `- Training Excellence`, and several page fallbacks append `| Training Excellence` by hand, so the template lands on top of an already-branded string. Live: `Training Excellence - Get Skilled, Get Certified | Training Excellence` on `/`, three repetitions on `/home`.

## Goals / Non-Goals

**Goals:**

- Product pages emit complete metadata again, and no future upstream enum value can blank a page's head.
- `sitemap.xml` contains every course, product, blog post and indexable WordPress page, and nothing that redirects, 404s, or is noindexed.
- A missing route family is visible in logs at generation time instead of looking like an empty site.
- One brand suffix per title.

**Non-Goals:**

- Fixing WordPress-side content: the homepage description literally reads `"VK"`, and blog posts are `noindex, nofollow` at source. Both are Rank Math field values; the frontend renders them faithfully. Recorded in tasks as verification items only.
- Adding hreflang or multi-locale handling. `routing.locales` is `["en"]`.
- Changing the previous change's canonical, JSON-LD, robots.txt or noindex-layout behaviour, all of which verified correct live.
- Reworking `/bundles`. The production `bundles` endpoint returns zero items; there is nothing to enumerate and no defect to fix here.

## Decisions

### D1 — Map unsupported Open Graph types to `website`; delete the cast

`buildPageMetadata` gets an explicit allowlist of Next's twelve accepted values. Anything outside it becomes `"website"` and logs a warning naming the rejected value and the page. The `as "website"` cast is removed so the allowlist is what makes the types line up.

_Alternative rejected:_ declaring `openGraph.type` as `article` for products (WooCommerce pages are not articles), or dropping `openGraph` entirely when the type is unknown (loses the OG title, description and image, which are the fields that actually matter to social crawlers). `product` is not part of the OG types Next models; the closest honest value is `website`, and the `Product` JSON-LD block already on the page carries the commerce semantics for search engines.

_Why a log line:_ this failure was invisible for the life of the previous change. A warning turns the next unmodelled type into a grep, not another audit.

### D2 — Brand the title once, in one place

`buildPageMetadata` returns `title: { absolute: brandOnce(title) }`. `absolute` opts the page out of the root layout's template; `brandOnce` appends ` | ${siteName}` only when the title does not already contain the site name (case-insensitive, after entity decoding).

The site name is not available synchronously in `buildPageMetadata` — it comes from `fetchSettings()`. `buildPageMetadata` will read it from the same cached settings fetch the root layout uses, so no extra request is made.

_Alternative rejected:_ removing `title.template` from the root layout. The template is correct for pages that build their own short title and never see Rank Math; deleting it would push the brand suffix into every page file by hand — the same duplication problem, spread wider. Keeping the template and opting out at the one place that receives already-branded upstream titles is the smaller surface.

_Consequence:_ the hand-written `… | Training Excellence` suffixes in page-level fallback titles become redundant. They are stripped as part of this change so `brandOnce` has a single, predictable input.

### D3 — One pagination helper, used by every sitemap source

A `collectAllPages(fetchPage, { perPage, maxPages })` helper in `src/app/sitemap.ts` loops from page 1 until a page returns fewer than `perPage` items, a reported `totalPages` is reached, or `maxPages` is hit. Each source adapts to it:

- courses — `serverApi.courses.list({ page, per_page: 100 })`, envelope carries `total`
- products — `serverApi.products.list({ page, per_page: 100 })`, plain array, stop on a short page
- blog posts — `fetchBlogPage(page, 100)`, which already returns `totalPages` from `X-WP-TotalPages`

`perPage` is 100 everywhere — the documented maximum for all three (`API_REFERENCE.md:404`, WordPress core, WooCommerce Store API). `maxPages` is 50 (5,000 URLs per family), a runaway guard, and hitting it logs.

_Alternative rejected:_ asking for one oversized page and trusting the backend to clamp. That is the current behaviour and it is exactly what failed — silently for the LMS endpoint, loudly for `wp/v2/posts`.

_Trade-off:_ a cold sitemap generation now issues roughly 3 + 3 + 1 requests instead of 3. All are `revalidate`-cached and the route is regenerated at most every few minutes.

### D4 — `fetchBlogPage` refuses to exceed the API's limit

`fetchBlogPage` clamps `perPage` to the range 1–100 rather than forwarding whatever it is given. Callers that pass a larger number get 100 items and a `totalPages` they can page through, instead of a 400 that silently becomes an empty list.

_Alternative rejected:_ leaving the clamp to callers. The 500 in `sitemap.ts` was written by someone who reasonably assumed "ask for everything" works; the bound belongs at the boundary that knows the API.

### D5 — Sitemap membership: served-by-this-app, then indexable-on-WordPress

Two gates replace `EXPLICIT_ROUTES`:

**Gate A — the slug is served by the catch-all.** A new `src/lib/seo/app-routes.ts` exports the set of paths the Next.js application serves with its own route file, each flagged `indexable`. `sitemap.ts` builds its static-route list from that module and excludes any WordPress slug appearing in it. A test walks `src/app/[locale]/**/page.tsx` and fails when a route file has no registry entry, so the registry cannot drift from the filesystem the way a denylist drifts from the CMS.

**Gate B — WordPress declares the path indexable at that path.** For each surviving slug, `fetchRankMathSeo(wpPath.page(slug))` must return a payload with a canonical. That single call rejects, with no new heuristics: 404 heads (`/shop`), noindex pages (`/activity`, `/activate`, `/pwa`), and pages whose canonical points elsewhere (`/home` → the site root, caught by the existing path-mismatch guard).

_Alternative rejected:_ HTTP-probing each candidate against the app's own origin. It is the most direct reading of "what the app serves", but it makes sitemap generation depend on the running server and risks recursion during build.

_Alternative rejected:_ filtering on empty `content`/`blocks` from the pages endpoint. Verified unusable — Elementor pages report empty content, so it would drop `/training-teams` and keep nothing useful.

_Trade-off:_ Gate B adds one `getHead` request per candidate page (~41 today, `revalidate: 300`, issued with a concurrency cap). Slower sitemap generation buys a membership rule that cannot rot.

_Accepted consequence:_ `/members-directory` and `/registration` stay in the sitemap — WordPress declares both indexable and self-canonical. Whether they should exist at all is a content decision, not a sitemap bug.

### D6 — Catch-all 404 test: no renderable content **and** no Rank Math canonical

`(marketing)/[slug]/page.tsx` calls `notFound()` when the WordPress page has empty `content` **and** empty `blocks` **and** Rank Math supplies no canonical for that path. Both halves are required: `/shop` fails all three, while `/training-teams` has empty content but a self-canonical and must keep rendering.

The predicate lives beside the Gate B helper so the page and the sitemap agree on what "servable" means by construction, not by two similar-looking conditions.

_Consequence:_ `/pwa` — empty content, noindex, no canonical — starts returning 404. It is a WordPress-only page with nothing for the frontend to render; a 404 is the honest answer.

_Alternative rejected:_ keying only on the Rank Math 404 head (matching its title). Title-matching a themed 404 page is brittle across WordPress theme changes.

### D7 — Fixtures sized like production

The sitemap test gains a multi-page source (a 238-item course source served 100 at a time), a page list containing `shop`, `home`, `activity` and `register`, and a `getHead` handler that returns a 404 head, a noindex head and self-canonical heads per slug. The metadata test gains a `product` OG-type fixture asserting the head survives intact.

_Why it belongs in the design:_ every defect in this change passed the previous change's tests. The fixtures were single-page and hand-picked, so truncation and membership drift were unobservable. The test data shape is the fix.

## Risks / Trade-offs

- **Gate B makes the sitemap depend on Rank Math availability** → If `getHead` is down, catch-all pages drop out of the sitemap while courses, products and posts remain. The document still renders, and D-level logging (D3/Gate B) records the empty family. Rank Math is already a hard dependency of every page's metadata; the sitemap sharing that dependency does not add a new failure mode.
- **Sitemap generation gets slower** → ~48 upstream requests instead of ~7, all `revalidate`-cached, bounded by `maxPages` and a concurrency cap. `sitemap.xml` is not on a user's critical path.
- **`brandOnce` misfires on a title that legitimately repeats the brand** → Only when a page title contains the site name as a substring for an unrelated reason. The site name is "Training Excellence"; a course titled with that phrase would keep one instance either way.
- **`/pwa` and `/shop` start returning 404** → Both currently render as thin or not-found pages; `/shop` is already advertised as a soft 404. If either is later given real content, it returns as soon as WordPress supplies a canonical.
- **`app-routes.ts` is still hand-maintained** → Mitigated by the filesystem-walking test in D5, which fails the build when a route file has no entry. The registry can be stale for the length of one commit, not one release.
