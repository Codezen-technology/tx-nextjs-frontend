## 1. Product page metadata — Open Graph type (D1)

- [ ] 1.1 Add an `OG_TYPES` allowlist to `src/lib/seo/server.ts` matching Next's `OpenGraphType` union (`article`, `book`, `music.song`, `music.album`, `music.playlist`, `music.radio_station`, `profile`, `website`, `video.tv_show`, `video.other`, `video.movie`, `video.episode`)
- [ ] 1.2 Replace `(seo?.ogType ?? "website") as "website"` in `buildPageMetadata` with an allowlist lookup that falls back to `"website"` and `console.warn`s the rejected value; delete the cast so the types are load-bearing
- [ ] 1.3 Add a `product-head.json` fixture to `src/lib/seo/__fixtures__/` captured from the production `getHead` for a WooCommerce product (`og:type=product`)
- [ ] 1.4 Unit-test `buildPageMetadata` against it — `openGraph.type` is `"website"`, and `title`, `description`, `alternates.canonical`, `robots`, `openGraph.title/url/images` and the Twitter tags are all still present
- [ ] 1.5 Unit-test that a supported upstream type (`article`) passes through verbatim
- [ ] 1.6 Verify live: `/product/{slug}` renders `<title>`, `<meta name="description">`, `<link rel="canonical">` and `<meta name="robots">`, and the dev log has no `Invalid OpenGraph type` error

## 2. Title branding (D2)

- [ ] 2.1 Add a `brandOnce(title, siteName)` helper in `src/lib/seo/server.ts` — appends ` | {siteName}` only when the decoded title does not already contain the site name, case-insensitively
- [ ] 2.2 Have `buildPageMetadata` read the site name from the cached `fetchSettings()` the root layout already uses, and return `title: { absolute: brandOnce(...) }`
- [ ] 2.3 Strip the now-redundant hand-written `| Training Excellence` suffixes from page-level fallback titles across `(marketing)`, `(shop)` and the catch-all route
- [ ] 2.4 Unit-test `brandOnce` — already-branded title unchanged, unbranded title gains one suffix, title equal to the site name is not doubled
- [ ] 2.5 Verify live: `/`, `/all-courses`, `/blog`, `/course-cat/{slug}`, `/training-teams` each contain the site name exactly once in `<title>`

## 3. Sitemap pagination (D3, D4)

- [ ] 3.1 Clamp `perPage` to 1–100 inside `fetchBlogPage` in `src/lib/services/blog.server.ts`
- [ ] 3.2 Add `collectAllPages(fetchPage, { perPage, maxPages })` to `src/app/sitemap.ts` — stops on a short page, on a reported `totalPages`, or at `maxPages` (50), logging when the cap is hit
- [ ] 3.3 Convert `getCourses()` to page through `serverApi.courses.list({ page, per_page: 100 })` using the envelope's `total`
- [ ] 3.4 Convert `getProducts()` to page through `serverApi.products.list({ page, per_page: 100 })`, stopping on a short page
- [ ] 3.5 Convert `getBlogPosts()` to page through `fetchBlogPage(page, 100)` using its `totalPages`
- [ ] 3.6 Log a warning from `safely()` (or its replacement) when a source resolves to zero entries, naming the family
- [ ] 3.7 Test with a mocked 238-item course source served 100 at a time — all 238 URLs present; test a source erroring on page 2 — page 1's entries survive and the document still renders
- [ ] 3.8 Test that a 400 from `wp/v2/posts` no longer reaches the sitemap: `fetchBlogPage(1, 500)` requests `per_page=100`
- [ ] 3.9 Verify live against the production backend: sitemap contains 238 course URLs, 280 product URLs, and every published blog post

## 4. Sitemap membership and catch-all 404s (D5, D6)

- [ ] 4.1 Create `src/lib/seo/app-routes.ts` — every path the app serves with its own route file, each flagged `indexable`
- [ ] 4.2 Build `sitemap.ts`'s static route list from `app-routes.ts` and delete the `staticRoutes` literal
- [ ] 4.3 Add a test that walks `src/app/[locale]/**/page.tsx` and fails when a route file has no `app-routes.ts` entry
- [ ] 4.4 Replace `EXPLICIT_ROUTES` filtering in `getCatchAllPages()` with Gate A — exclude any WordPress slug that `app-routes.ts` already claims
- [ ] 4.5 Add Gate B — keep a slug only when `fetchRankMathSeo(wpPath.page(slug))` returns a payload carrying a canonical; issue the probes with a concurrency cap
- [ ] 4.6 Extract the shared "servable" predicate (empty `content` **and** empty `blocks` **and** no Rank Math canonical ⇒ not servable) into one module used by both the sitemap and the catch-all page
- [ ] 4.7 Call `notFound()` from `(marketing)/[slug]/page.tsx` when the predicate says the page is not servable
- [ ] 4.8 Test membership against a page list containing `shop`, `home`, `activity`, `activate`, `pwa`, `register` and `training-teams`, with `getHead` returning a 404 head, noindex heads, a root canonical for `home`, and self-canonicals for the rest — only `training-teams` and the other self-canonical pages survive
- [ ] 4.9 Test the catch-all route — `/shop` returns 404, `/training-teams` renders despite empty `content`
- [ ] 4.10 Verify live: sitemap contains no `/register`, `/business-dashboard`, `/shop`, `/home`, `/activate`, `/activate-2`, `/activity`, `/pwa`; `curl -o /dev/null -w "%{http_code}" /shop` returns 404

## 5. Verification and documentation

- [ ] 5.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
- [ ] 5.2 Regenerate the sitemap against production data and diff the URL set against the pre-change 254 URLs — every addition and removal accounted for
- [ ] 5.3 Document in `SEO.md`: Next's closed Open Graph type set and the `website` fallback; the 100-item page cap on all three sources; and that sitemap membership is decided by `app-routes.ts` plus a Rank Math canonical, not by a denylist
- [ ] 5.4 Note in `SEO.md` that a new route needs an `app-routes.ts` entry alongside its `wpPath` entry
- [ ] 5.5 Post-deploy: resubmit `sitemap.xml` in Search Console and confirm the course, product and blog-post counts
- [ ] 5.6 Post-deploy: run Google's Rich Results Test on a product page — it should now report `Product` schema on a page that also has a title and canonical

## 6. WordPress-side follow-ups (not code)

- [ ] 6.1 Report to the site owner: the homepage Rank Math meta description is literally `"VK"` — needs a real 150–160 character description
- [ ] 6.2 Report to the site owner: blog posts emit `noindex, nofollow` from Rank Math (verified on the live WordPress page, not introduced by the frontend) — the entire blog is excluded from search while this stands
- [ ] 6.3 Confirm with the site owner whether `/members-directory` and `/registration` should be indexable; both are WordPress-indexable today and will therefore stay in the sitemap
