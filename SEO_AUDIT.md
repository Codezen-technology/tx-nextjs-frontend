# SEO Audit — tx-headless-frontend

**Date:** 2026-08-04
**Scope:** Codebase audit of the Next.js headless frontend + live probes of the WordPress backend (`trainingexcellence.org.uk`) Rank Math headless API and sitemaps.
**Branch:** `montgomery`
**Not covered:** Search Console data, live Core Web Vitals, backlink profile, rank tracking — no access in this session. Lab-based CWV checks are listed as follow-ups.

---

## Executive Summary

The SEO architecture is sound: Rank Math headless integration, per-page `generateMetadata`, JSON-LD on most public pages, `generateStaticParams` on dynamic routes, ISR, and a generated `sitemap.xml` / `robots.txt`.

Three defects undercut it, and all three come from the same root cause: **`fetchRankMathSeo` trusts whatever Rank Math returns, and Rank Math returns `success: true` with the wrong page's `<head>` when it doesn't recognise the URL.**

### Top 5 priority issues

| #   | Issue                                                                                                                                                                                                                   | Impact   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Blog posts request the wrong WP path → Rank Math returns the **homepage** head → every blog post gets `canonical = https://site/`, the homepage title, and description `"VK"`                                           | Critical |
| 2   | Course category pages request `/course-category/{slug}` (WP uses `/course-cat/{slug}`) → Rank Math returns a generic 404 head → all 8 category pages share the title "Training Excellence" and have no meta description | Critical |
| 3   | Homepage meta description in Rank Math is literally `"VK"` — shipped verbatim to the live frontend                                                                                                                      | Critical |
| 4   | Rank Math canonicals carry a trailing slash (`/course/x/`); Next serves `/course/x` and the sitemap lists `/course/x` → every canonical on the site points at a 308-redirecting URL that disagrees with the sitemap     | High     |
| 5   | Header/footer link to `/careers`, `/special-offers` (404) and `/courses` (protected → redirects to `/login`)                                                                                                            | High     |

### Quick wins (< 1 hour each)

- Fix the two wrong WP paths (2 one-line changes).
- Fix the `"VK"` description in Rank Math on WP.
- Add a canonical-mismatch guard in `fetchRankMathSeo` so this class of bug can never ship silently again.
- Normalise trailing slashes on Rank Math canonicals.
- Add `<h1>` to `/all-courses`.

---

## Technical SEO Findings

### T1 — Blog posts canonicalise to the homepage · Critical

**Issue.** `src/app/[locale]/(marketing)/blog/[slug]/page.tsx:65` and `:82` call `fetchRankMathSeo(\`/${slug}\`)`. The real WP permalink is `/blog/{slug}/`.

**Evidence.** Live probe:

```
GET /wp-json/rankmath/v1/getHead?url=https://trainingexcellence.org.uk/how-to-get-a-nursing-assistant-certification
→ {"success":true,"head":"<title>Training Excellence - Get Skilled, Get Certified</title>
   <meta name="description" content="VK"/>
   <link rel="canonical" href="https://trainingexcellence.org.uk/"/> ...

GET .../getHead?url=https://trainingexcellence.org.uk/blog/how-to-get-a-nursing-assistant-certification/
→ {"success":true,"head":"<title>How to Get a Nursing Assistant Certification?</title>
   <meta name="description" content="Learn how to get a Nursing Assistant Certification in the UK..."/>
```

Rank Math does not 404 on an unknown URL — it returns the **homepage** head. `buildPageMetadata` prefers every Rank Math field over the fallback, so the correct fallback title/description/canonical in the code is never used. Result per blog post: title = homepage title, description = `"VK"`, `<link rel=canonical>` = site root, plus homepage JSON-LD (`WebSite`/`Organization`) instead of `Article`.

A canonical pointing to a different URL is a de-indexing instruction. With more than one post published, the entire blog collapses into the homepage in Google's index.

**Fix.**

```ts
// blog/[slug]/page.tsx — both call sites (metadata + page body)
fetchRankMathSeo(`/blog/${slug}/`);
```

**Priority.** 1 — fix before publishing any new blog content.

---

### T2 — Course category pages get a 404 head · Critical

**Issue.** `src/app/[locale]/(marketing)/course-cat/[slug]/page.tsx:40` and `:108` call `fetchRankMathSeo(\`/course-category/${slug}\`)`. WP's actual taxonomy permalink is `/course-cat/{slug}/`, confirmed by `course-cat-sitemap.xml`.

**Evidence.**

```
GET .../getHead?url=.../course-category/first-aid-courses
→ {"success":true,"head":"<title>Training Excellence</title>
   <meta name=\"robots\" content=\"follow, index\"/> ...   ← generic 404 head, no canonical, no description

GET .../getHead?url=.../course-cat/first-aid-courses/
→ <title>First Aid Courses - Training Excellence</title> + canonical
```

Consequence: all 8 category pages ship the identical title `Training Excellence` (Rank Math's value beats the good `"{name} Courses | Training Excellence"` fallback) and no meta description. Canonical falls back correctly, so this is a duplicate-title / lost-CTR problem, not de-indexing. `course-cat/[slug]/page.tsx:133` also feeds `rmSeo?.canonical` into the `CollectionPage` JSON-LD `url`, which is `undefined` here and falls back — fine, but fragile.

**Fix.** `fetchRankMathSeo(\`/course-cat/${slug}/\`)`.

**Priority.** 1.

---

### T3 — No guard against Rank Math returning the wrong page · Critical (root cause)

**Issue.** `src/lib/seo/server.ts:38-58` returns whatever comes back as long as `head` is truthy. Rank Math answers `success: true` for URLs it cannot resolve, serving the homepage or a bare 404 head. T1 and T2 both shipped undetected because of this.

**Fix.** Validate that the returned canonical resolves to the path that was requested; discard the whole payload on mismatch so the hand-written fallbacks take over.

```ts
const seo = parseRankMathHead(head);

// Rank Math answers 200 with the homepage/404 head for unknown URLs.
// If it hands back a canonical for a different path, the payload is not ours.
if (seo.canonical) {
  const returned = new URL(seo.canonical).pathname.replace(/\/$/, "");
  const requested = wpPath.replace(/\/$/, "");
  if (returned !== requested) return null;
  seo.canonical = toFrontendUrl(seo.canonical);
}
```

Pair it with a unit test per WP path mapping (`/`, `/course/x`, `/course-cat/x`, `/blog/x`, `/bundles/x`, `/product/x`, `/{page}`) asserting the returned canonical path matches the request.

**Priority.** 1.

---

### T4 — Trailing-slash mismatch on every canonical · High

**Issue.** WP permalinks end in `/`; Next.js runs with the default `trailingSlash: false` and 308-redirects `/x/` → `/x`. `toFrontendUrl` (`src/lib/utils/url.ts:71`) preserves the pathname verbatim, so every Rank Math-sourced canonical ships as `https://site/course/x/` while the page is served at `/course/x` and `sitemap.xml` lists `/course/x`.

**Evidence.** `<link rel="canonical" href="https://trainingexcellence.org.uk/course/health-and-safety-officer-training/"/>` from the live getHead response; `src/app/sitemap.ts:117` emits `${base}/course/${slug}` with no slash.

**Impact.** Canonical target is a redirect, and canonical disagrees with sitemap and with `openGraph.url`. Google generally follows it, but it wastes crawl budget and produces "Alternate page with proper canonical tag" / "Page with redirect" noise in Search Console.

**Fix.** Strip the trailing slash inside `fetchRankMathSeo` after the domain patch (or set `trailingSlash: true` in `next.config.mjs` and add the slash to the sitemap — pick one and enforce it everywhere).

```ts
seo.canonical = toFrontendUrl(seo.canonical).replace(/\/$/, "") || SITE_ORIGIN;
```

Also apply to the JSON-LD `@id` / `url` patch, which inherits the same slashes.

**Priority.** 2.

---

### T5 — Broken and protected links in site navigation · High

| Link                            | Where            | What happens                                                                                                  |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `/careers`                      | footer nav       | WP 404 → catch-all `[slug]` → `notFound()` → 404                                                              |
| `/special-offers`               | nav/profile menu | WP 404 → 404                                                                                                  |
| `/courses`                      | header           | resolves to `(student)/courses`, a PROTECTED route → `src/proxy.ts` redirects logged-out crawlers to `/login` |
| `/training-teams`               | header           | WP 200, renders via catch-all, but absent from `sitemap.ts`                                                   |
| `/force-for-good`, `/resources` | nav              | WP 200, render via catch-all, absent from `sitemap.ts`                                                        |

**Evidence.** `curl -o /dev/null -w %{http_code}` against each WP path; route existence checked against `src/app/[locale]/`.

**Impact.** Site-wide 404s from header/footer are a quality signal Google weighs. `/courses` in the header sends every crawler into a login redirect.

**Fix.** Point `/courses` at `/all-courses`. Remove or create `/careers` and `/special-offers`. Add the three live catch-all pages to `sitemap.ts`.

**Priority.** 2.

---

### T6 — Sitemap gaps · High

`src/app/sitemap.ts` covers static marketing routes, `/course/{slug}`, `/course-cat/{slug}`, `/blog/{slug}`. Missing:

- `/bundles` and `/bundles/{slug}` — full route with metadata + JSON-LD
- `/blog/category/{slug}` — full route with metadata + JSON-LD
- `/product/{slug}` — full route with `Product` schema (also has **no `generateStaticParams`**, so every product renders on-demand)
- `/pricing`, `/certificate` — indexable pages with metadata
- catch-all WP pages: `/training-teams`, `/force-for-good`, `/resources`, and any other non-`landing-blocks` page

**Priority.** 2.

---

### T7 — Sitemap `lastModified` is always "now" · Medium

Every entry uses `new Date()` at request time (`src/app/sitemap.ts:44-140`), so all ~220 URLs claim to have changed today, on every fetch. Google discounts `lastmod` it can't corroborate, and the signal is lost for pages that genuinely did change.

**Fix.** Use real timestamps — courses expose `date_modified` (confirmed in the API response), WP posts expose `modified_gmt`, and the WP `course-sitemap*.xml` files carry per-URL `<lastmod>`.

**Priority.** 3.

---

### T8 — Paginated category pages all canonicalise to page 1 · Medium

`course-cat/[slug]/page.tsx` paginates via `?page=N` (`PER_PAGE = 30`) but `generateMetadata` always emits `canonical: /course-cat/{slug}` with no page param. Google's current guidance is a **self-referencing canonical on every paginated page**; canonicalising 2+ to page 1 tells Google the deeper pages are duplicates.

With 201 courses across 8 categories, several categories exceed one page.

**Fix.** Read `searchParams.page` in `generateMetadata` and append `?page=N` to the canonical when `N > 1`.

**Priority.** 3.

---

### T9 — Private/utility routes are crawlable · Medium

`src/app/robots.ts` disallows `/dashboard/`, `/learn/`, `/profile/`, `/orders/`, `/api/`, `/login`, `/register`, `/forgot-password`, `/search`. Not disallowed and not `noindex`:

- `/business-dashboard/*` — protected by proxy but crawlable as a login redirect
- `/cart`, `/checkout`, `/checkout/pay`, `/order-confirmation/*`
- `/reset-password`
- `/design-system` — internal Figma colour-palette page, has a `metadata` title, fully indexable

Note also: `robots.txt` `Disallow` prevents crawling, not indexing. Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) export no metadata at all — no `robots: { index: false }`. A URL that is disallowed but externally linked can still surface in results with no snippet.

**Fix.** Add the missing paths to `robots.ts`, and export `metadata = { robots: { index: false, follow: false } }` from each auth/private page (or from the `(auth)`, `(shop)`, `(business)` layouts). Delete or gate `/design-system` behind `NODE_ENV !== "production"`.

**Priority.** 3.

---

### T10 — `metadataBase` reads `process.env` directly · Medium

`src/app/layout.tsx:34,45` uses `process.env.NEXT_PUBLIC_SITE_URL` rather than `env.SITE_URL`. When the var is unset, `env.SITE_URL` falls back to `http://localhost:3000` but `metadataBase` becomes `undefined` — Next then emits **relative** OG/Twitter image URLs, which no social crawler can resolve.

**Fix.** `metadataBase: getMetadataBase(env.SITE_URL)`.

Related: `fetchRankMathSeo` (`src/lib/seo/server.ts:39`) uses `env.WP_API_URL` (the browser-public value) rather than `getServerWpJsonBase()`, so a server-only `WP_API_URL` override is ignored for SEO fetches only. Inconsistent with the rest of the server layer.

**Priority.** 3.

---

### T11 — No hreflang / `alternates.languages`; `<html lang>` hardcoded · Low

`routing.locales = ["en"]` with `localePrefix: "as-needed"`, and `src/app/layout.tsx` hardcodes `<html lang="en">`. Correct today. The moment a second locale is added this breaks: the root layout sits above `[locale]`, so `lang` cannot be set per-locale from there, and `buildPageMetadata` emits no `alternates.languages`.

**Fix when adding locale 2.** Move the `<html>` element into `[locale]/layout.tsx`, and extend `buildPageMetadata` to emit `alternates.languages` including a self-referencing entry plus `x-default`. Next.js does **not** auto-add a self-referencing `<xhtml:link>` in `sitemap.ts` — it must be listed explicitly.

**Priority.** 5 (blocking for i18n rollout, not now).

---

## On-Page SEO Findings

### O1 — Homepage meta description is `"VK"` · Critical

Live Rank Math response for `/`:

```
<meta name="description" content="VK"/>
```

This is a placeholder someone typed into Rank Math. It renders on the live headless homepage, is the fallback used for every blog post via T1, and is what Google shows in the SERP for the site's most important page.

**Fix.** WP admin → Rank Math → homepage → write a real 150-160 char description. No code change.

**Priority.** 1.

---

### O2 — Only blog post on the site is `noindex, nofollow` · High

```
GET .../getHead?url=.../blog/how-to-get-a-nursing-assistant-certification/
→ <meta name="robots" content="nofollow, noindex, noimageindex, nosnippet, noarchive"/>
```

`buildPageMetadata` passes `seo.robots` straight through, so the frontend honours it correctly. But `x-wp-total: 1` on `/wp/v2/posts` — the site has exactly **one** blog post, and it is noindexed. There is no `post-sitemap.xml` in the WP sitemap index.

Meanwhile the frontend ships a full blog architecture: `/blog`, `/blog/{slug}`, `/blog/category/{slug}`, trending carousels, related posts, `Blog` and `Article` schema. All of it renders against one hidden post.

**Fix.** Decide whether the blog is a channel. If yes: publish, and remove the noindex. If no: drop `/blog` from `sitemap.ts` and the header nav until content exists — an empty section linked from every page is a thin-content signal.

**Priority.** 2.

---

### O3 — `/all-courses` has no `<h1>` · High

`src/components/courses/all-courses-hero.tsx` contains no heading element. The page carries `priority: 0.9` in the sitemap and is the primary catalogue landing page — the second most important URL on the site, with no H1.

Checked across all marketing routes; every other public page has exactly one H1. `/search` has two, but it is `noindex` so it does not matter.

**Fix.** Add `<h1>All Online Courses</h1>` (or the keyword-led variant) to `AllCoursesHero`.

**Priority.** 2.

---

### O4 — Four raw `<img>` tags in homepage components · Medium

```
src/components/home/transform-team.tsx:60,63
src/components/home/cpd-certificate.tsx:40,43
```

All use `alt=""` and carry no `width`/`height`, no `loading`, no format negotiation. Both components are homepage sections.

**Impact.** Missing intrinsic dimensions → layout shift as they load (CLS). No responsive `srcset` and no WebP/AVIF → oversized transfers on mobile. These bypass the `next/image` remote-pattern config entirely.

`alt=""` is defensible if the images are genuinely decorative (team photos, certificate mockups) — but a CPD certificate image is meaningful content and should describe itself.

**Fix.** Convert to `next/image` with explicit dimensions; give `cpd-certificate` real alt text.

**Priority.** 3.

---

### O5 — Only 6 courses per category surfaced on `/all-courses` · Medium

`all-courses/page.tsx:43` fetches `per_page: 6` per category. With 201 courses in `course-sitemap1.xml` across 8 categories, roughly 150 course pages are not linked from the main catalogue page. They are reachable via `/course-cat/{slug}` pagination and the sitemap, but sit 3+ clicks deep with weak internal PageRank.

**Fix.** Fine as a UX pattern given the "View all" links per category — but verify the category pages are crawled (Search Console → Crawl Stats) once T2's title problem is fixed, since those pages currently have no distinguishing title.

**Priority.** 4.

---

### O6 — `[slug]` catch-all `console.error`s on every 404 · Low

`(marketing)/[slug]/page.tsx:56` logs an error inside `generateMetadata`'s catch, returning `{ title: "Page not found" }`. Any crawler hitting a dead URL generates Sentry noise. The metadata for a genuine 404 should also carry `robots: { index: false }` even though Next sets a 404 status.

**Priority.** 5.

---

## Content Findings

### C1 — Structured data coverage is good, with gaps

Present: `Course` + `BreadcrumbList` (course pages, with `hasCourseInstance` correctly included for the post-May-2023 Google requirement), `Product` + `Offer` (product pages), `CollectionPage` (all-courses, course-cat), `Blog` (blog index), `FAQPage` (help), `WebSite` + `Organization` (homepage).

Missing:

- **No `Organization` schema on the site-wide layout** — it only exists on the homepage. Sitelinks and Knowledge Panel eligibility benefit from a single consistent `Organization` node with `logo`, `sameAs`, `contactPoint`.
- **No `BreadcrumbList` on blog posts, bundles, or product pages** — breadcrumb rich results are cheap wins; those pages render visual breadcrumbs already.
- **No `AggregateRating` on `/reviews`** despite a dedicated reviews page.
- `Course` schema hardcodes `priceCurrency: "GBP"` (`course/[slug]/page.tsx:103`) while the codebase has a currency plan (`CURRENCY_PLAN.md`) — will emit wrong offers for non-GBP.

**Note on verification.** Schema in this codebase is server-rendered into the HTML, so it is genuinely present — but confirm against Google's Rich Results Test after deploying, since `curl`/`web_fetch` cannot see JS-injected markup and the Rank Math JSON-LD path (`rmSeo?.jsonLd`) inherits the T1/T2/T4 URL problems in its `@id` fields.

**Priority.** 3.

---

### C2 — E-E-A-T signals

Positives: HTTPS, contact page, privacy policy, terms, cancellations/refunds page, verify-certificate tool, reviews page, `CourseExperts` and `CourseAccreditations` components on course pages.

Gaps: no author pages or author schema for blog content (relevant once O2 is resolved), no `sameAs` social profiles in `Organization` schema.

**Priority.** 4.

---

## Prioritised Action Plan

### 1. Critical — fix this week

1. `blog/[slug]/page.tsx` — change both `fetchRankMathSeo(\`/${slug}\`)` calls to `` `/blog/${slug}/` `` **(T1)**
2. `course-cat/[slug]/page.tsx` — change both `fetchRankMathSeo(\`/course-category/${slug}\`)` calls to `` `/course-cat/${slug}/` `` **(T2)**
3. Add the canonical-mismatch guard to `fetchRankMathSeo` + unit tests per path mapping **(T3)**
4. WP admin: replace the homepage Rank Math description `"VK"` with real copy **(O1)**

### 2. High — this sprint

5. Normalise trailing slashes on Rank Math canonicals and JSON-LD URLs **(T4)**
6. Fix nav: `/courses` → `/all-courses`; remove or create `/careers` and `/special-offers` **(T5)**
7. Add `<h1>` to `AllCoursesHero` **(O3)**
8. Add missing routes to `sitemap.ts`; add `generateStaticParams` to `/product/[slug]` **(T6)**
9. Decide the blog's fate — publish or unlink **(O2)**

### 3. Medium — next sprint

10. Real `lastModified` in the sitemap **(T7)**
11. Self-referencing canonicals on paginated category pages **(T8)**
12. Extend `robots.ts`; add `robots: { index: false }` to auth/cart/checkout/business pages; remove `/design-system` from production **(T9)**
13. `metadataBase: getMetadataBase(env.SITE_URL)`; switch `fetchRankMathSeo` to `getServerWpJsonBase()` **(T10)**
14. Convert the 4 raw `<img>` tags to `next/image` **(O4)**
15. Site-wide `Organization` schema; `BreadcrumbList` on blog/bundle/product; currency-aware `Course` offers **(C1)**

### 4. Follow-up — needs access this audit did not have

- Run PageSpeed Insights / Lighthouse against the deployed frontend for LCP, INP, CLS (`next/font` with `display: swap` and `priority` on hero images are already in place — verify the result).
- Verify all structured data in Google's Rich Results Test post-deploy.
- Search Console: submit `sitemap.xml`, review Coverage for "Duplicate, Google chose different canonical" (expect T1/T4 fallout) and Crawl Stats for the category pages.
- Confirm the WP → headless redirect map: WP `page-sitemap.xml` lists `/hardcopy-certificate/`, `/course-selector-page/`, `/student-portal/`, `/course-player/`, `/lostpassword/`, `/sitemap/`, `/thank-you-for-ordering-certificate/` — none of which have a frontend route. These need 301s at the migration cutover or they become 404s with inbound equity.

---

## Method

- Static analysis of `src/app/`, `src/lib/seo/`, `src/lib/utils/`, `src/components/layout/`, `next.config.mjs`, `src/proxy.ts`.
- Metadata/JSON-LD/`generateStaticParams` coverage checked across all 63 page routes.
- Live probes of `trainingexcellence.org.uk`: `rankmath/v1/getHead` for homepage, blog post (both paths), course, course category (both paths); `robots.txt`; `sitemap_index.xml` and child sitemaps; `wp/v2/posts`; `lms-backend/v1/courses`; HTTP status of 6 nav targets.
