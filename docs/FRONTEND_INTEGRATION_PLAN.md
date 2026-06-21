# Frontend Integration Plan — consume new backend features

> Wires `tx-headless-frontend` to the endpoints delivered in the
> `wp-lms-backend-rest-api` plugin (Phases 1 & 3 of its migration). Scope:
> **Bundles**, **block-composed Pages (promos)**, **bulk-discount tiers UI**,
> **blog enrichment**. Cart coupon/bulk pricing already flows transparently
> through the WC Store API — no frontend change for the math itself.
>
> Backend refs: `wp-lms-backend-rest-api/docs/HEADLESS_MIGRATION_PROGRESS.md`,
> `…/docs/cart-orders-payment-api.md`.

---

## Conventions (follow these)

- **Data fetching:** `api` (axios, `src/lib/api/client.ts`) — baseURL `/wp-json`,
  auto-unwraps the `{success,data}` LMS envelope, redirects on 401. Use it for all
  `lms-backend/v1` + `wp/v2` reads. Cart/orders use the BFF (`/api/*`) — unchanged.
- **Paths:** add to `src/lib/api/endpoints.ts` (never hardcode URLs).
- **Services:** `src/lib/services/<area>.ts` — fetch raw, `normalize…()` raw→domain,
  return typed domain objects. Mirror `services/courses.ts`.
- **Types:** `src/types/<area>.ts` (domain types, camelCase).
- **Hooks:** `src/lib/hooks/use<Area>.ts` — `@tanstack/react-query`; keys in
  `src/lib/utils/query-keys.ts`.
- **Pages:** App Router under `src/app/[locale]/(marketing)/…`; SSR/ISR via server
  fetchers where SEO matters (see `services/blog.server.ts`).
- **Components:** `src/components/<area>/…`; reuse `components/ui/*`.
- **Parsers:** `paginate()`, `decodeEntities()` from `src/lib/api/parsers.ts`.

---

## F0 — Endpoint & env wiring (do first)

`endpoints.ts` additions:

```ts
bundles: {
  list: `${lms}/bundles`,
  detail: (id: number) => `${lms}/bundles/${id}`,
  bySlug: (slug: string) => `${lms}/bundles/slug/${encodeURIComponent(slug)}`,
  featured: `${lms}/bundles/featured`,
},
pages: {                                   // NEW — lms namespace (content + blocks)
  list: `${lms}/pages`,
  byTemplate: (t: string) => `${lms}/pages?template=${encodeURIComponent(t)}`,
  detail: (slug: string) => `${lms}/pages/${encodeURIComponent(slug)}`,
},
cartRules: { bulkTiers: `${lms}/bulk-discount-tiers` },   // NEW
```

> Note: existing `blog.pages` (`wp/v2/pages`) stays for any raw WP page need; the
> new `pages.*` (lms) is the one that returns `blocks[]` for promos.

Env: confirm `NEXT_PUBLIC_WP_API_URL` / `WP_API_URL` point at the WP site. Prod CORS
is a **backend** setting (`LMS_BACKEND_API_ALLOWED_ORIGINS` must list this app's
origin) — flag for deploy, no frontend code.

---

## F1 — Bundles (P0)

Backend: `GET /bundles` (archive cards), `/bundles/featured`, `/bundles/{id}`,
`/bundles/slug/{slug}` (detail). Contract:

- **Card:** `{ id, slug, title, excerpt, image{full,large,thumb}, pricing{price,
regular_price, sale_price, is_on_sale, currency, price_html}, rating{average,count},
included_courses_count, courses_preview[{id,title,slug}] }`
- **Detail adds:** `content, objectives, standards, course_for, faq[{question,answer}],
included_courses[]` (full course objects, same shape as `/courses/{id}`),
  `included_courses_cards[{title,short_description}], total_duration_seconds,
total_duration_hours, cpd_points, benefits[], last_update`.

Tasks:

- [ ] `src/types/bundle.ts` — `Bundle`, `BundleDetail`, `BundlePricing`, `BundleCoursePreview`.
- [ ] `src/lib/services/bundles.ts` — `list({page,perPage,search})`, `featured(limit)`,
      `getById(id)`, `getBySlug(slug)`; `normalizeBundle` / `normalizeBundleDetail`
      (reuse `normalizeCourse` for `included_courses`).
- [ ] `src/lib/hooks/useBundles.ts` — `useBundles`, `useFeaturedBundles`, `useBundle(slug)`.
- [ ] `src/components/bundles/` — `bundle-card.tsx`, `bundles-grid.tsx`,
      `bundle-hero.tsx`, `bundle-included-courses.tsx`, `bundle-sidebar.tsx`
      (price + benefits + CPD + add-to-cart), `bundle-faq.tsx`.
- [ ] Routes: `app/[locale]/(marketing)/bundles/page.tsx` (archive, SSR) +
      `app/[locale]/(marketing)/bundles/[slug]/page.tsx` (detail, `generateStaticParams`
      from `/bundles`, `generateMetadata`).
- [ ] Add-to-cart: bundle has its own `product_id` (the bundle WC product) — reuse
      the existing cart `addItem(productId)` flow.
- [ ] Header/footer nav links to `/bundles` (dashboard-nav already references
      `bundle-courses`).

---

## F2 — Block-composed Pages / promos (P1)

Backend: `GET /pages/{slug}` → `{ id, slug, title, template, is_blocks, content,
excerpt, blocks[], modified }`. Plain pages → render `content`; pages on the
"Landing (Blocks)" template → render `blocks[]`. `GET /pages?template=landing-blocks`
lists promo slugs for SSG.

Block types: `hero`, `rich_text`, `popular_courses` (config → fetch `/courses/popular`),
`membership` (config → fetch `/pricing`), `testimonials` (items embedded),
`sponsors`, `faq`, `cta_banner`.

Tasks:

- [ ] `src/types/page.ts` — `PageContent`, `PageBlock` (discriminated union by `type`).
- [ ] `src/lib/services/pages.ts` (client) + extend `pages.server.ts` — `getPage(slug)`,
      `listPages(template?)`.
- [ ] `src/components/blocks/` — one renderer per block type + `block-renderer.tsx`
      (switch on `block.type`). Reuse existing home sections where possible
      (`components/home/popular-courses.tsx`, `reviews-section.tsx`/testimonials,
      `trusted-orgs.tsx` for sponsors, `pricing-section.tsx` for membership).
- [ ] Route: catch-all `app/[locale]/(marketing)/[slug]/page.tsx` →
      `getPage(slug)`; if `is_blocks` render `<BlockRenderer blocks=…/>`, else render
      `content` (reuse `components/legal/legal-page.tsx` for plain pages).
      `generateStaticParams` from `listPages()`; 404 via `notFound()`.
- [ ] Ensure the catch-all sits **below** explicit routes (about, pricing, blog…) so
      it only handles slugs not already claimed. Verify Next.js route precedence.
- [ ] Rebuild promos in wp-admin as Pages with the Landing (Blocks) template:
      hot-deals, lucky-learner, halloween, halloween-mega-sale.

---

## F3 — Bulk-discount tiers UI (P1)

Backend: public `GET /bulk-discount-tiers` → `{ tiers:[{ min, max, percentage }] }`
(`max:0` = open-ended). Per-band price = `unitPrice × (1 − percentage/100)`.

Tasks:

- [ ] `src/lib/services/cart-rules.ts` — `getBulkTiers()`; `src/types/cart-rules.ts`.
- [ ] `src/lib/hooks/useBulkTiers.ts` (react-query, long staleTime — rarely changes).
- [ ] `src/components/courses/bulk-discount-table.tsx` — renders the "For Team" /
      bulk table (matches the legacy product card: `10–19 → £x → Save Extra 10%` …).
- [ ] Integrate into `components/courses/course-purchase-card.tsx` (For Me / For Team
      toggle) and the bundle sidebar (F1). Compute per-band price from the card's unit price.

---

## F4 — Blog enrichment adoption (P2)

Backend now returns `featured_image_url` + `reading_time` on `wp/v2/posts`.

Tasks:

- [ ] `src/types/blog.ts` — add `reading_time?: number` (already has `featured_image_url?`).
- [ ] Use `post.featured_image_url` (drop reliance on `_embedded` where simpler);
      show `reading_time` on `components/blog/*` + blog post header.

---

## Phasing

1. **F0** endpoints/env.
2. **F1** bundles (P0 — revenue surface).
3. **F2** promo pages + **F3** bulk tiers (P1).
4. **F4** blog polish (P2).

## Risks / decisions

- **Route precedence:** the `[slug]` catch-all (F2) must not shadow explicit
  marketing routes. Keep explicit segments; catch-all resolves last.
- **Bundle URL:** `/bundles/[slug]` chosen (archive at `/bundles`). Confirm vs legacy
  `/course/<bundle-slug>` links — add redirects if SEO requires.
- **Block ↔ home component reuse:** prefer reusing home section components; only fork
  when the promo layout genuinely differs.
- **Prod CORS:** backend `LMS_BACKEND_API_ALLOWED_ORIGINS` must include this origin.
