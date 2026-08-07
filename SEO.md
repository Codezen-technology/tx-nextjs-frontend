# SEO — Rank Math Headless Pattern

This project uses Rank Math's headless CMS API for all server-rendered page metadata.

**Source of truth:** Rank Math on the WP backend (`trainingexcellence.org.uk`) holds all SEO configuration — meta titles, descriptions, robots rules, Open Graph, and JSON-LD structured data. The Next.js frontend fetches it at render time and injects it into the page.

---

## Required WP Setup

Rank Math → General Settings → Others → **Headless CMS Support: ON**

Without this, `fetchRankMathSeo` returns `null` for every page and falls back to manual metadata.

---

## The Pattern — every SSR/ISR page must follow this

### 1. `generateMetadata` (required on every public page)

```ts
import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/your-wp-path");
  return buildPageMetadata(seo, {
    title: "Fallback Title",
    description: "Fallback description (max 160 chars).",
    canonical: `${env.SITE_URL}/your-path`,
  });
}
```

### 2. Dynamic pages — fetch SEO in parallel with page data

Do NOT make a separate `await` for SEO. Use `Promise.allSettled` so a Rank Math failure never blocks the page:

```ts
export default async function MyPage({ params }) {
  const [dataResult, seoResult] = await Promise.allSettled([
    serverApi.something.get(params.slug),
    fetchRankMathSeo(`/your-wp-path/${params.slug}`),
  ]);

  if (dataResult.status === "rejected") notFound();

  const data = dataResult.value;
  const rmSeo = seoResult.status === "fulfilled" ? seoResult.value : null;

  // JSON-LD: prefer Rank Math's blocks, fall back to manual schema
  const jsonLd = rmSeo?.jsonLd?.length ? rmSeo.jsonLd : [buildMySchema(data)];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      {/* page content */}
    </>
  );
}
```

### 3. `generateStaticParams` (required on dynamic slug pages)

Pre-renders all known slugs at build time. ISR handles new entries at runtime.

```ts
export async function generateStaticParams() {
  try {
    const data = await serverApi.courses.list({ per_page: 500 });
    const items = Array.isArray(data)
      ? data
      : ((data as { items?: { slug: string }[] }).items ?? []);
    return (items as { slug: string }[]).flatMap(({ slug }) => (slug ? [{ slug }] : []));
  } catch {
    return [];
  }
}
```

---

## How `fetchRankMathSeo` works

```
Next.js page render
  → fetchRankMathSeo("/course/my-slug")
    → GET /wp-json/rankmath/v1/getHead?url=https://trainingexcellence.org.uk/course/my-slug
      → returns { success: true, head: "<html string of <head> tags>" }
    → parseRankMathHead(head)   ← regex-extracts all SEO fields
    → patches canonical: replaces WP origin with NEXT_PUBLIC_SITE_URL
    → patches JSON-LD: replaces WP origin in all @id / url fields
  → returns ParsedSeo | null
```

**Domain patching is automatic.** Rank Math's canonical and JSON-LD reference the WP domain. `fetchRankMathSeo` rewrites every occurrence to the headless frontend URL so Google indexes the right domain.

---

## Rank Math has no error channel — read this before adding a route

**`getHead` answers HTTP 200 with `success: true` for URLs it cannot resolve.** It returns the site homepage's `<head>`, or a bare 404 head. Nothing in the response envelope distinguishes a hit from a miss — only the content does.

A wrong path therefore does not fail loudly. It publishes another page's title, description, canonical and JSON-LD. Two such mappings shipped undetected:

| Wrong path passed          | What Rank Math returned | Live consequence                                  |
| -------------------------- | ----------------------- | ------------------------------------------------- |
| `/${slug}` for a blog post | **homepage head**       | every post canonicalised to `https://site/`       |
| `/course-category/${slug}` | **bare 404 head**       | all 8 category pages titled "Training Excellence" |

Verified against production — see `SEO_AUDIT.md` (Method) for the raw responses.

### The validation contract

`fetchRankMathSeo` compares the canonical Rank Math returns against the path that was requested, slash-normalised, paths only. On mismatch it `console.warn`s and returns `null`, so the page falls back to its own metadata instead of publishing another page's.

One hole, accepted deliberately: **a payload with no canonical is accepted, not rejected.** Rank Math legitimately omits the canonical on a `noindex` page, and rejecting it would discard a real noindex directive — declaring a page indexable that WordPress says is not. The bare 404 head also has no canonical, so the guard cannot catch it; the path table and its tests are what keep that head from being requested.

---

## WP path vs Next.js path

**Never inline a path literal at the call site.** Use the mapping table — it is the single home for this contract and it is unit-tested:

```ts
import { wpPath } from "@/lib/seo/wp-paths";

const seo = await fetchRankMathSeo(wpPath.blogPost(slug));
```

| Next.js route              | `wpPath` entry         | WP path                   |
| -------------------------- | ---------------------- | ------------------------- |
| `/`                        | `home()`               | `/`                       |
| `/course/[slug]`           | `course(slug)`         | `/course/${slug}/`        |
| `/course-cat/[slug]`       | `courseCategory(slug)` | `/course-cat/${slug}/`    |
| `/blog/[slug]`             | `blogPost(slug)`       | `/blog/${slug}/`          |
| `/blog/category/[slug]`    | `blogCategory(slug)`   | `/blog/category/${slug}/` |
| `/bundles/[slug]`          | `bundle(slug)`         | `/bundles/${slug}/`       |
| `/product/[slug]`          | `product(slug)`        | `/product/${slug}/`       |
| `/[slug]` and static pages | `page(slug)`           | `/${slug}/`               |

Every row was verified against production sitemaps and `getHead` probes.

**Adding a route:** add its entry to `src/lib/seo/wp-paths.ts` AND a case to `src/__tests__/seo-wp-paths.test.ts`. That test serves the homepage head for any unmapped URL — exactly what production does — so a wrong mapping fails the suite instead of shipping.

To confirm a WP path by hand:

```bash
curl -s "https://trainingexcellence.org.uk/wp-json/rankmath/v1/getHead?url=https://trainingexcellence.org.uk/YOUR/PATH/" | head -c 400
```

If the title comes back as the homepage's, the path is wrong.

---

## Canonical URL form

WordPress permalinks are trailing-slash; Next.js runs `trailingSlash: false`. `fetchRankMathSeo` strips the trailing slash from the canonical and from JSON-LD `@id` / `url` values via `canonicalize()`, so canonical, `og:url`, JSON-LD and `sitemap.xml` all agree on one form.

This lives on the SEO boundary, **not** in `src/lib/utils/url.ts` — `toFrontendUrl` is shared with the service layer, where content permalinks must round-trip WordPress URLs verbatim.

Hand-written `canonical:` fallbacks must be slashless and match their `sitemap.ts` `<loc>` byte-for-byte.

---

## Open Graph types — Next's set is closed

`Metadata.openGraph.type` accepts twelve values and **throws on anything else**, and a throw during metadata resolution discards the page's entire head — no title, no description, no canonical, no robots.

Rank Math returns `og:type=product` for every WooCommerce product. Passed straight through behind a cast, it blanked the head of every `/product/{slug}` page while the build stayed green and `tsc` stayed quiet.

`buildPageMetadata` narrows the upstream value against `OG_TYPES` and falls back to `"website"`, logging what it rejected. The accepted set:

`article` · `book` · `music.song` · `music.album` · `music.playlist` · `music.radio_station` · `profile` · `website` · `video.tv_show` · `video.other` · `video.movie` · `video.episode`

**Never restore a cast here.** `as "website"` on an upstream string is what moved this failure from build time to request time.

---

## Titles carry the brand once

Rank Math titles already end in the site name, and `src/app/layout.tsx` sets a `title.template` of `%s | {siteName}`. Applied to an already-branded title, that produced `Training Excellence - Get Skilled, Get Certified | Training Excellence`.

`buildPageMetadata` returns `title: { absolute: brandOnce(title, siteName) }` — `absolute` opts out of the template, and `brandOnce` appends the site name only when the title does not already contain it.

Page-level fallback titles must therefore **not** hand-write `| Training Excellence`. A fallback returned outside `buildPageMetadata` (a `catch` block, say) still goes through the root template, so it should be a bare title too.

---

## Sitemap sources page at 100

Every upstream caps one page at 100 items, and two of the three do it silently:

| Source                   | `per_page: 500` behaviour                    |
| ------------------------ | -------------------------------------------- |
| `lms-backend/v1/courses` | HTTP 200 with 100 of 238 items               |
| `wc/store/v1/products`   | HTTP 200 with 100 of 280 items               |
| `wp/v2/posts`            | HTTP 400 `rest_invalid_param` — empty result |

`sitemap.ts` pages every source through `collectAllPages`, capped at `MAX_PAGES` (50). `fetchBlogPage` clamps its own `perPage` to 1–100 so a caller cannot ask for a 400.

A source resolving to zero entries is logged. Silence is why zero blog posts looked identical to a site without a blog.

---

## Sitemap membership is derived, not listed

A URL enters `sitemap.xml` only if it passes both gates:

1. **Gate A — this app serves it.** `src/lib/seo/app-routes.ts` lists every path with its own route file, flagged `indexable`. Static entries are built from it, and any WordPress slug it claims is excluded from the catch-all enumeration. `seo-app-routes.test.ts` walks `src/app/[locale]/**` and fails when a route file has no entry.
2. **Gate B — WordPress publishes it at that path.** `isIndexableWpPage(slug)` keeps a slug only when Rank Math answers with a canonical, which the path guard has already matched to the request. That single call rejects 404 heads (`/shop`), noindex pages (`/activity`, `/pwa`) and pages that canonicalise elsewhere (`/home` → the site root).

This replaced a hand-maintained denylist of WordPress slugs, which drifted every time a page was published: `/register`, `/business-dashboard`, `/shop`, `/home`, `/activate`, `/activity` and `/pwa` were all live in the sitemap.

**Soft 404s.** The catch-all route calls `notFound()` when a page has no content, no blocks **and** no Rank Math canonical. All three are needed — Elementor pages report empty content, so emptiness alone would 404 real pages like `/training-teams`.

---

## Fallback behavior

`fetchRankMathSeo` never throws. It returns `null` when:

- Rank Math headless mode is disabled
- The `rankmath/v1/getHead` endpoint returns an error
- Network failure reaching WP
- **The head returned belongs to a different page than the one requested**

`buildPageMetadata` uses the `fallback` values for any `null` or missing Rank Math fields. **Every public page must have non-empty fallback title, description, and canonical.** Google will use these on the first crawl before Rank Math is configured for a page.

---

## `buildPageMetadata` output

Given Rank Math SEO data, it produces:

```ts
{
  title: "...",             // from RM or fallback
  description: "...",       // from RM or fallback
  robots: "...",            // from RM only (omitted if absent)
  alternates: {
    canonical: "https://trainingexcellence.com/...",  // always headless domain
  },
  openGraph: {
    title, description, url, type: "website", images: [...]
  },
  twitter: {
    card: "summary_large_image", title, description, images: [...]
  }
}
```

---

## Key files

| File                                   | Purpose                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/seo/server.ts`                | `fetchRankMathSeo` + `buildPageMetadata` + `canonicalize` + `brandOnce` |
| `src/lib/seo/wp-paths.ts`              | `wpPath` — the WP↔Next mapping table                                    |
| `src/lib/seo/app-routes.ts`            | Every path this app serves, flagged `indexable`                         |
| `src/lib/seo/wp-pages.ts`              | Catch-all gates — `isCatchAllSlug`, `isIndexableWpPage`, servability    |
| `src/lib/seo/__fixtures__/`            | Production `getHead` responses used by the tests                        |
| `src/lib/utils/seo.ts`                 | `parseRankMathHead` — HTML parser (used internally)                     |
| `src/lib/api/server.ts`                | `serverApi.rankmath.getHead` — raw fetch with ISR cache                 |
| `src/__tests__/seo-wp-paths.test.ts`   | Mapping contract — add a case for every new route                       |
| `src/__tests__/seo-app-routes.test.ts` | Registry vs filesystem — fails on a route with no entry                 |
| `src/__tests__/seo-wp-pages.test.ts`   | Catch-all gates and the soft-404 predicate                              |
| `src/__tests__/seo-rankmath.test.ts`   | Guard behaviour against real production heads                           |
| `src/__tests__/sitemap.test.ts`        | Coverage, pagination, membership, URL form, `lastmod`                   |

---

## Checklist for every new public page

- [ ] `generateMetadata` calls `fetchRankMathSeo` + `buildPageMetadata`
- [ ] WP path comes from `wpPath.*` — no inline literal
- [ ] New route family added to `wpPath` AND to `seo-wp-paths.test.ts`
- [ ] Route added to `src/lib/seo/app-routes.ts` with an `indexable` flag —
      indexable static routes also need `changeFrequency` and `priority`
- [ ] Fallback title is bare — no hand-written `| Training Excellence`
- [ ] `generateStaticParams` on dynamic `[slug]` pages
- [ ] Fallback `title`, `description`, `canonical` provided to `buildPageMetadata`
- [ ] Canonical is slashless and matches the `sitemap.ts` entry byte-for-byte
- [ ] Route added to `sitemap.ts` (or explicitly excluded, with the reason noted)
- [ ] JSON-LD: use `rmSeo?.jsonLd` or fall back to manual schema.org block
- [ ] Non-public route? Add `robots: { index: false }` to its layout AND a
      `robots.ts` disallow — `robots.txt` blocks crawling, not indexing
