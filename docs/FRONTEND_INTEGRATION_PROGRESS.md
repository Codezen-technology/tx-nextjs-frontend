# Frontend Integration — Progress Tracker

Companion to [`FRONTEND_INTEGRATION_PLAN.md`](./FRONTEND_INTEGRATION_PLAN.md).
Keep feature IDs (F0–F4) in sync with the plan.

## Status legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked / needs decision

---

## F0 — Endpoint & env wiring

- [x] `endpoints.ts`: extended `bundles` (`bySlug`), added `pages` (lms), added `cartRules.bulkTiers`
- [x] `query-keys.ts`: added `bundles`, `pages`, `cartRules` keys
- [ ] Confirm `NEXT_PUBLIC_WP_API_URL` / `WP_API_URL` (deploy env)
- [!] Prod: backend `LMS_BACKEND_API_ALLOWED_ORIGINS` must include this app's origin (deploy task)

## F1 — Bundles (P0)

- [x] `types/bundle.ts` (`Bundle`, `BundleDetail`, pricing/rating/preview/faq/cards)
- [x] `lib/services/bundles.ts` (list / featured / getById / getBySlug + `normalizeBundle`/`normalizeBundleDetail`; reuses `normalizeCourse`)
- [x] `lib/api/server.ts`: added `serverApi.bundles` (list/featured/bySlug, ISR-tagged) for SSR
- [x] `lib/hooks/useBundles.ts` (`useBundles`, `useFeaturedBundles`, `useBundle`)
- [x] `components/bundles/*` — `bundle-card` (+skeleton), `bundles-grid`, `bundle-add-to-cart` (client), `bundle-detail` (reuses `CourseCard`)
- [x] route `(marketing)/bundles/page.tsx` (SSR archive + JSON-LD + metadata)
- [x] route `(marketing)/bundles/[slug]/page.tsx` (SSR detail + generateStaticParams + generateMetadata + Product JSON-LD)
- [x] add-to-cart via bundle `id` (= WC product id) → existing `useAddToCart`
- [x] type-clean (`tsc --noEmit` 0 errors in new files)
- [ ] nav links to `/bundles` (header/footer) — pending
- [ ] (enhancement) client pagination/search on archive (SSR shows first 24)

## F2 — Block-composed Pages / promos (P1)

- [x] `types/page.ts` (`PageContent`, `PageBlock` discriminated union — keys match backend)
- [x] `lib/services/pages.ts` (`getPage`/`listPages` + `normalizePage`, exports `RawPage`)
- [x] `lib/api/server.ts`: added `serverApi.pages` (list/detail, ISR-tagged) for SSR
- [x] `components/blocks/block-renderer.tsx` (server switch) + `popular-courses-block.tsx` (client, fetches `/courses/popular`)
- [x] catch-all `(marketing)/[slug]/page.tsx` — blocks vs plain content; `generateStaticParams` (landing-blocks only); 404
- [x] route precedence OK — explicit segments beat the `[slug]` dynamic
- [x] `coursesService.popular` added (for popular_courses block)
- [x] type-clean (`tsc --noEmit` 0 errors)
- [ ] rebuild promos in wp-admin (hot-deals, lucky-learner, halloween, halloween-mega-sale) — content task

## F3 — Bulk-discount tiers UI (P1)

- [x] `types/cart-rules.ts` + `lib/services/cart-rules.ts`
- [x] `lib/hooks/useBulkTiers.ts` (1h stale)
- [x] `components/courses/bulk-discount-table.tsx` (self-fetching; price = unit × (1−%/100))
- [x] integrated into `course-purchase-card.tsx` (For teams tab) + bundle sidebar
- [x] type-clean

## F4 — Blog enrichment (P2)

- [x] `types/blog.ts`: added `reading_time?: number`
- [x] `reading_time` shown in `components/home/blog-card.tsx` meta row + blog post header (`blog/[slug]`)
- [x] `featured_image_url` already consumed (card + post) — no change needed
- [x] no service change — `wp/v2/posts` returns the new fields (no `_fields` restriction)
- [x] type-clean

---

## Backend contracts (reference)

| Endpoint                                     | Shape                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /bundles`                               | `{items:[card], total, page, per_page, totalPages}`                    |
| `GET /bundles/featured`                      | `{items:[card]}`                                                       |
| `GET /bundles/{id}` · `/bundles/slug/{slug}` | bundle detail                                                          |
| `GET /pages` (`?template=landing-blocks`)    | `{items:[{id,slug,title,template}]}`                                   |
| `GET /pages/{slug}`                          | `{id,slug,title,template,is_blocks,content,excerpt,blocks[],modified}` |
| `GET /bulk-discount-tiers`                   | `{tiers:[{min,max,percentage}]}`                                       |
| `GET /wp/v2/posts`                           | core post + `featured_image_url` + `reading_time`                      |

Block `type`s: `hero`, `rich_text`, `popular_courses`, `membership`, `testimonials`,
`sponsors`, `faq`, `cta_banner`.

---

## Changelog

| Date       | Item                        | Status | Notes                                                                            |
| ---------- | --------------------------- | ------ | -------------------------------------------------------------------------------- |
| 2026-06-21 | Plan + progress created     | x      | Scoped to backend Phase 1/3 features                                             |
| 2026-06-21 | F0 endpoints/keys wired     | x      | bundles/pages/cartRules in endpoints + query-keys                                |
| 2026-06-21 | F1 Bundles implemented      | x      | types/service/serverApi/hooks/components/routes; SSR + add-to-cart; tsc clean    |
| 2026-06-21 | F2 Block pages implemented  | x      | page types/service/serverApi; block-renderer + popular-courses; catch-all [slug] |
| 2026-06-21 | F3 Bulk-tier UI implemented | x      | cart-rules service/hook + table; purchase card (teams) + bundle sidebar          |
| 2026-06-21 | F4 Blog enrichment          | x      | reading_time in card + post header; featured_image_url already used              |
| 2026-06-21 | **Frontend F0–F4 complete** | x      | bundles, block pages, bulk tiers, blog all wired; tsc clean                      |
