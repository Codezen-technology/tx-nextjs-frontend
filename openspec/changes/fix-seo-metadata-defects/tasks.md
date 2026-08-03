## 1. Rank Math integrity — path mappings, validation, tests

- [ ] 1.1 Create `src/lib/seo/wp-paths.ts` exporting the `wpPath` mapping table (home, course, courseCategory, blogPost, blogCategory, bundle, product, page) per design D3
- [ ] 1.2 Add the path-mismatch guard to `fetchRankMathSeo` in `src/lib/seo/server.ts` — compare slash-normalised canonical pathname to the requested `wpPath`, return `null` and `console.warn` on mismatch (D1); accept a canonical-less payload unchanged (D2)
- [ ] 1.3 Replace the wrong path in `(marketing)/blog/[slug]/page.tsx` at both call sites (`generateMetadata` line ~65, page body line ~82) with `wpPath.blogPost(slug)`
- [ ] 1.4 Replace the wrong path in `(marketing)/course-cat/[slug]/page.tsx` at both call sites (lines ~40, ~108) with `wpPath.courseCategory(slug)`
- [ ] 1.5 Convert the remaining inline `fetchRankMathSeo` literals to `wpPath.*` — homepage, `course/[slug]`, `blog/category/[slug]`, `bundles/[slug]`, `bundles`, `product/[slug]`, `(marketing)/[slug]`, `pricing`, `all-courses`, `certificate`, and the static marketing pages
- [ ] 1.6 Capture production fixture heads into `src/lib/seo/__fixtures__/`: real course head, homepage head, bare 404 head, noindex head with no canonical
- [ ] 1.7 Unit-test `fetchRankMathSeo` against the fixtures — match uses Rank Math values; homepage-head-for-a-course-request returns `null`; noindex-no-canonical preserves `robots` and uses the fallback canonical
- [ ] 1.8 Add an MSW integration test keying the `getHead` fixture off the `url` query param, asserting each route family (course, course-cat, blog post, blog category, bundle, product, page) resolves its own metadata and not the homepage's
- [ ] 1.9 Run `pnpm test` and `pnpm typecheck`

## 2. Canonical URL form

- [ ] 2.1 Add a `canonicalize()` helper in `src/lib/seo/server.ts` that strips trailing slashes while preserving the root path (D5) — do not modify `src/lib/utils/url.ts`
- [ ] 2.2 Apply `canonicalize()` to the Rank Math canonical after `toFrontendUrl()`
- [ ] 2.3 Apply the same normalisation to JSON-LD `@id` / `url` / `mainEntityOfPage` values in the `replaceWpOrigin` patch step
- [ ] 2.4 Audit every hand-written `canonical:` fallback across the page files for a stray trailing slash; confirm each matches its `sitemap.ts` `<loc>` byte-for-byte
- [ ] 2.5 Unit-test `canonicalize()` — trailing slash stripped, root origin preserved, query and hash retained
- [ ] 2.6 Switch `src/app/layout.tsx` to `metadataBase: getMetadataBase(env.SITE_URL)` (D9)
- [ ] 2.7 Build the `url=` query parameter in `fetchRankMathSeo` from the server-side WordPress origin instead of `env.WP_API_URL` (D9)

## 3. Sitemap coverage and freshness

- [ ] 3.1 Add `/bundles` and `/bundles/{slug}` to `src/app/sitemap.ts`
- [ ] 3.2 Add `/blog/category/{slug}` to the sitemap
- [ ] 3.3 Add `/product/{slug}` to the sitemap
- [ ] 3.4 Add `/pricing` and `/certificate` to the static route list
- [ ] 3.5 Add the live catch-all WordPress pages (`/training-teams`, `/force-for-good`, `/resources`) — enumerate from the pages API rather than hardcoding, so new WP pages are picked up
- [ ] 3.6 Replace `new Date()` with real `date_modified` / `modified_gmt` timestamps for courses, posts, and pages; use a stable build-time constant for static routes and taxonomy terms (D6)
- [ ] 3.7 Verify each new sitemap source degrades to an empty array on fetch failure without failing the document
- [ ] 3.8 Add `generateStaticParams` to `(shop)/product/[slug]/page.tsx`, returning `[]` on error
- [ ] 3.9 Test the generated sitemap — no protected/auth/cart/checkout/search URLs present, no trailing slashes, entries match page canonicals

## 4. Crawl and index directives

- [ ] 4.1 Extend `src/app/robots.ts` disallow list with `/cart`, `/checkout`, `/order-confirmation/`, `/business-dashboard/`, `/reset-password`, `/design-system`
- [ ] 4.2 Export `metadata = { robots: { index: false, follow: false } }` from `(auth)/layout.tsx`, `(student)/layout.tsx`, `(business)/layout.tsx`
- [ ] 4.3 Export the same from `(shop)/cart/layout.tsx`, `(shop)/checkout/layout.tsx`, `(shop)/order-confirmation/layout.tsx` — not from `(shop)/layout.tsx`, which is shared with the indexable product route (D7)
- [ ] 4.4 Gate `(marketing)`-adjacent `design-system/page.tsx` behind `notFound()` when `NODE_ENV === "production"`
- [ ] 4.5 Confirm `/product/{slug}` still emits an indexable robots directive after 4.3
- [ ] 4.6 Read `searchParams.page` in `course-cat/[slug]` `generateMetadata` and append `?page=N` to the canonical when `N > 1`; keep the Rank Math request on the unparameterised path (D8)
- [ ] 4.7 Test the paginated canonical — `?page=2` self-references, no param and `page=1` both emit the bare path

## 5. On-page corrections

- [ ] 5.1 Add a single `<h1>` to `src/components/courses/all-courses-hero.tsx`
- [ ] 5.2 Retarget the header `/courses` link to `/all-courses` in `src/components/layout/header.tsx`
- [ ] 5.3 Remove the dead `/careers` and `/special-offers` nav links (footer / profile menu) — see design Open Questions; removing a link to a 404 is correct either way
- [ ] 5.4 Verify every remaining header, footer, and mega-menu link target resolves to a served route for an anonymous request
- [ ] 5.5 Convert the two raw `<img>` tags in `src/components/home/transform-team.tsx` to `next/image` with explicit `width`/`height`
- [ ] 5.6 Convert the two raw `<img>` tags in `src/components/home/cpd-certificate.tsx` to `next/image` with explicit dimensions and real alt text (certificate imagery is content, not decoration)

## 6. Documentation and verification

- [ ] 6.1 Document the validation contract and the verified WP↔Next path mapping table in `SEO.md`, replacing the current illustrative table
- [ ] 6.2 Note in `SEO.md` that Rank Math returns 200 with an unrelated head for unknown URLs, and that new routes must add an entry to `wpPath` plus an MSW test
- [ ] 6.3 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
- [ ] 6.4 Post-deploy: resubmit `sitemap.xml` in Search Console; `curl` canonicals on `/`, `/course/{slug}`, `/course-cat/{slug}`, `/blog/{slug}` and confirm each matches its served URL
- [ ] 6.5 Post-deploy: run Google's Rich Results Test on a course page and a product page — JSON-LD `@id` values change in step 2
