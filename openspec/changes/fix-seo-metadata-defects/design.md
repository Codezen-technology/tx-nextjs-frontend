## Context

See `proposal.md` — Why, and `SEO_AUDIT.md` for the live evidence behind each defect.

Constraints that shape the approach:

- **Rank Math's `getHead` has no error channel for unknown URLs.** Verified against production: `?url=.../unknown-path` returns HTTP 200 with `{"success": true, "head": "<homepage head>"}`. `?url=.../course-category/first-aid-courses` returns 200 with a generic 404 head (`<title>Training Excellence</title>`, no canonical, no description). There is nothing in the response envelope that distinguishes a hit from a miss — only the content does.
- **`buildPageMetadata` is fallback-last by design** (`src/lib/seo/server.ts:78-108`): every field prefers the Rank Math value. That is correct behaviour and should stay; it is precisely what makes an unvalidated payload dangerous.
- **The transport layer is already correct.** `serverApi.rankmath.getHead` (`src/lib/api/server.ts:578`) uses `getServerWpJsonBase()`, caches with `revalidate: 3600` and tag `rankmath:head`, and returns `null` on non-OK or `success: false`. Only the caller's path construction and result trust are wrong.
- **WordPress permalinks are trailing-slash; Next.js runs `trailingSlash: false`** (default, not set in `next.config.mjs`). The two URL forms must be reconciled in exactly one place or they will drift again.
- **`src/lib/utils/url.ts` is shared.** `toFrontendUrl` / `replaceWpOrigin` are used by services for content links, where preserving the path verbatim is correct. Slash normalisation is an SEO concern and must not leak into them.
- **All affected layouts are Server Components**, so `export const metadata` is available for per-route-group robots directives. `(shop)/layout.tsx` is a shared passthrough covering `product` (indexable) as well as `cart`/`checkout` (not) — noindex belongs on the leaf layouts, not the group.

## Goals / Non-Goals

**Goals:**

- Make a wrong WP path mapping a _safe degrade_ (fallback metadata) rather than _confidently wrong output_ (another page's canonical).
- Reconcile canonical, `og:url`, JSON-LD `@id`, and `sitemap.xml` on one URL form, enforced in one function.
- Make the WP↔Next path mapping table executable — a test, not a comment in `SEO.md`.

**Non-Goals:**

- Changing `buildPageMetadata`'s fallback-last precedence.
- Reworking `toFrontendUrl` / `toFrontendPath` semantics for content links.
- Introducing a runtime SEO-validation service, crawler, or CI link checker. Nav-link correctness is fixed by hand here; automating it is a separate change.
- Any WordPress-side content edit (see proposal — Out of scope).

## Decisions

### D1 — Validate by comparing canonical path to requested path, in `fetchRankMathSeo`

Reject the payload when the canonical Rank Math returns resolves to a different path than the one requested. Compare **paths only**, slash-normalised — never full URLs, since the canonical is on the backend origin at that point and query/hash may legitimately differ.

```ts
const seo = parseRankMathHead(head);

if (seo.canonical) {
  const returned = normalizePath(new URL(seo.canonical).pathname);
  const requested = normalizePath(wpPath);
  if (returned !== requested) {
    console.warn(`[seo] Rank Math path mismatch: requested ${requested}, got ${returned}`);
    return null;
  }
}
```

Placed in `fetchRankMathSeo` rather than in `parseRankMathHead`, because the parser is a pure HTML→object function with no knowledge of what was requested.

_Alternatives considered._ Comparing titles against page data — fuzzy and locale-dependent. Checking `og:url` instead — same information, less reliably present. Passing an expected-title assertion from each call site — pushes the burden onto every page and will be forgotten on the next route added.

### D2 — A missing canonical is not a mismatch

The generic 404 head Rank Math returns for `/course-category/x` has **no canonical at all**, so D1 cannot reject it — there is nothing to compare. Accepting it means the page inherits `<title>Training Excellence</title>` (the current category-page bug) instead of its own fallback.

But a missing canonical is also the legitimate shape for a `noindex` page: the live blog post returns `robots: nofollow, noindex, ...` and Rank Math correctly omits the canonical there. Rejecting on absence would discard a real noindex directive and cause the frontend to declare a page indexable that WordPress says is not — strictly worse than a bad title.

Decision: **accept a canonical-less payload, and rely on D3 to make it moot.** Once the category path mapping is fixed, the 404 head is never requested. The `robots` passthrough stays intact for genuinely noindexed pages.

_Trade-off accepted:_ a future wrong path mapping that happens to hit a noindexed WP URL will still slip through the guard. D4's tests are the backstop for that case.

### D3 — Fix the path mappings and pin them in a single exported table

Both wrong mappings (`/{slug}` for blog posts, `/course-category/{slug}` for categories) are literal template strings inline at four call sites. Replace with one exported mapping module so the contract has a single home and can be unit-tested directly:

```ts
// src/lib/seo/wp-paths.ts
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
```

Every mapping in the table was verified against production sitemaps and `getHead` probes (see `SEO_AUDIT.md` — Method). Trailing slashes are included because that is what WordPress serves; D1 normalises before comparing, so either form matches, but storing the true form keeps the table honest as documentation.

_Alternative considered:_ deriving the WP path from the `link` field WordPress returns per entity. More robust in principle, but it requires the entity fetch to complete before the SEO fetch, serialising two requests that `Promise.all` currently runs in parallel — a real TTFB cost on every page. Rejected.

### D4 — Test the mapping contract, not the network

Two test layers, both offline:

1. **Unit** — `wpPath` table snapshot, and `fetchRankMathSeo` against fixture heads captured from production: a real course head, the homepage head, the bare 404 head, a noindex head with no canonical. Asserts: match → Rank Math values used; homepage-head-for-a-course-request → `null`; noindex-no-canonical → robots preserved, fallback canonical used.
2. **Integration (MSW)** — the existing MSW setup intercepts `getHead` and returns the correct fixture keyed by the `url` query param, so a page requesting the wrong path receives the homepage fixture and the test asserts the fallback canonical. This is the layer that would have caught both shipped bugs.

### D5 — Normalise trailing slashes on the SEO boundary, not in `url.ts`

Strip the trailing slash inside `fetchRankMathSeo` after `toFrontendUrl`, and in the JSON-LD patch, guarding the root case (`https://site/` must not become `https://site`-as-empty-path):

```ts
function canonicalize(url: string): string {
  const u = new URL(url);
  u.pathname = u.pathname === "/" ? "/" : u.pathname.replace(/\/+$/, "");
  return u.toString().replace(/\/$/, "") || SITE_ORIGIN;
}
```

`src/lib/utils/url.ts` keeps its current verbatim-path behaviour: content links must round-trip WordPress URLs unchanged, and rewriting slashes there would silently alter every service-normalised permalink.

_Alternative considered:_ setting `trailingSlash: true` in `next.config.mjs` to match WordPress. This makes canonicals correct with no code change, but rewrites every internal `<Link>` target, every sitemap entry, and every existing indexed URL on the frontend — a far larger recrawl event for the same outcome. Rejected.

### D6 — Sitemap freshness from data already fetched

The sitemap's three data sources already return modification timestamps: courses expose `date_modified` (Unix seconds — confirmed in the live API response), WP posts expose `modified_gmt`. Taxonomy terms expose none; those and the static routes use a build-stamped constant rather than a per-request `new Date()`.

_Alternative considered:_ proxying WordPress's own `course-sitemap*.xml` `<lastmod>` values. Accurate, but adds N sitemap fetches to a request that already makes three API calls, for a signal search engines treat as advisory. Rejected.

### D7 — Noindex on leaf layouts; disallow in `robots.ts`

Both signals, per the spec — `robots.txt` blocks crawling, `noindex` blocks indexing, and a disallowed-but-linked URL still surfaces without the latter.

Placement: `(auth)/layout.tsx`, `(student)/layout.tsx`, `(business)/layout.tsx` take group-level `metadata`. `(shop)` does **not** — it is a passthrough shared with the indexable `/product/{slug}`; noindex goes on `cart/layout.tsx`, `checkout/layout.tsx`, and `order-confirmation/layout.tsx` individually.

`/design-system` is gated with `notFound()` when `process.env.NODE_ENV === "production"` rather than deleted — it is actively useful in development, and a 404 is a stronger signal than noindex.

### D8 — Paginated canonicals via `searchParams` in `generateMetadata`

`course-cat/[slug]/page.tsx` already reads `searchParams.page` in the page component. Extend `generateMetadata` to read it too and append `?page=N` when `N > 1`.

This does not change the route's rendering mode: reading `searchParams` in the page body already opts the route into per-request rendering for paginated views, and `revalidate = 300` continues to apply to the unparameterised first page.

The page's Rank Math request stays on the unparameterised path — WordPress has no metadata for `?page=2`, so title and description are inherited from page 1 while only the canonical differs. That is the intended shape for paginated series.

### D9 — `metadataBase` and the SEO fetch origin read from `env`

`src/app/layout.tsx:34,45` reads `process.env.NEXT_PUBLIC_SITE_URL` directly, so an unset var yields `metadataBase: undefined` and relative social image URLs, while `env.SITE_URL` would have supplied the localhost default. Switch to `getMetadataBase(env.SITE_URL)`.

Separately, `fetchRankMathSeo:39` builds the `url=` query parameter from `env.WP_API_URL` (the browser-public value) while the transport already resolves its request base via `getServerWpJsonBase()`. If a server-only `WP_API_URL` override is configured, the request goes to the override host but asks it about the public host's URL. Align the query parameter on the same server-side origin.

## Risks / Trade-offs

- **Canonical form changes site-wide → recrawl churn.** Expect "Page with redirect" and "Alternate page with proper canonical tag" in Search Console for a few weeks. → Deploy the metadata fixes and the sitemap coverage together so the corrected sitemap is what gets recrawled; resubmit `sitemap.xml` in Search Console on deploy day.
- **The validation guard fails silently by design** — a wrong mapping now yields fallback metadata rather than an error. Fallback metadata is decent but generic, so the bug is quieter than it was loud. → `console.warn` on every mismatch (surfaces in Sentry via the existing server integration), plus D4's MSW test asserting each route family resolves.
- **D2 leaves one hole:** a wrong mapping that lands on a noindexed WP URL passes the guard and imports its `noindex`, hiding a live page. → Only the mapping tests catch this. Accepted as strictly better than the alternative, which breaks legitimate noindex passthrough on every page.
- **Blog fixes are unverifiable in production today** — WordPress has exactly one post and it is `noindex`. The fix cannot be confirmed by inspecting the live blog. → Verify against MSW fixtures and a staging post; treat the production check as blocked on the WP-side content decision.
- **Removing `/careers` and `/special-offers` from nav is a product decision, not a technical one.** → Removing a link to a 404 is unambiguously correct; if those pages are planned, the links return when the pages exist.
- **Real `lastmod` shifts sitemap output between deploys** in ways diffs will show. Expected, not a regression.

## Migration Plan

Sequenced so the highest-severity fix ships first and the recrawl sees a coherent site.

1. **Guard + mappings + tests** (D1–D4). Shippable alone; ends the wrong-canonical bleeding. Verify blog and category metadata against MSW fixtures before deploy.
2. **Canonical normalisation + `metadataBase` + fetch origin** (D5, D9). Site-wide URL form change.
3. **Sitemap coverage and freshness, `robots.ts`, per-route noindex, pagination canonicals, product `generateStaticParams`** (D6–D8). Ships together so the recrawl triggered by step 2 lands on the corrected sitemap.
4. **On-page corrections** — `/all-courses` H1, nav link targets, `next/image` conversion. Independent of 1–3; can ship in any of the above.
5. **Post-deploy** — resubmit `sitemap.xml`; spot-check canonicals on `/`, `/course/{slug}`, `/course-cat/{slug}`, `/blog/{slug}` with `curl`; run Google's Rich Results Test on a course and a product page (JSON-LD `@id` values change in step 2); watch Coverage for two weeks.

**Rollback.** Every step is a self-contained revert with no data migration and no persisted state. Step 2 is the only one with a lingering effect — search engines will have seen the new canonical form — but reverting restores the previous form, which is still a valid (if redirect-hopping) canonical. No rollback window pressure.

## Open Questions

- Whether `/careers` and `/special-offers` are planned pages or dead links to delete outright. Does not affect the approach — the nav link is removed either way, and the page can be added later.
- Which stable date to use for static-route `lastmod` (build timestamp vs. a checked-in constant). Both satisfy the spec; decide at implementation.
