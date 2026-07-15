## Context

`Certificate_Controller::get_page()` (backend, `wp-lms-backend-rest-api` plugin) already returns editable content for the `/certificate` page — sourced from `Certificate_Fields` (ACF) — via `GET /lms-backend/v1/certificate/page`:

```json
{
  "hero": { "eyebrow": "", "heading": "", "text": "", "benefits": [], "images": [] },
  "trustBadges": [],
  "accreditationBanner": { "heading": "", "badgeLabel": "" },
  "orderSection": { "heading": "" },
  "promoBanner": { "image": null, "heading": "", "link": null },
  "formId": null,
  "txnFieldId": null
}
```

`hero.images` is an array of up to 2 `{ url: string, alt: string }` objects (ACF `hero_images` repeater, max 2, image sub-field with `return_format=array`), sourced from the WP media library. `promoBanner.image` is a single `{ url, alt } | null` for the sidebar banner (ACF `promo_banner` group). Both were added to `Certificate_Fields.php`/`Certificate_Controller.php` as part of this change (backend edits already applied).

The controller itself returns this exact fallback shape (all empty/null) when no ACF content is configured, rather than an error — so the frontend must treat "empty strings/arrays/null" as "use static fallback," not treat the request itself as failable in the common case.

The frontend `certificate` page (`src/app/[locale]/(shop)/certificate/page.tsx`) is a Server Component with all copy hardcoded. `CertificateForm` (client component) already separately calls `/certificate/config` for pricing/fields — that flow is untouched.

## Goals / Non-Goals

**Goals:**

- Render hero heading/text/benefits/images, trust badges, the accreditation banner strip, and the sidebar promo banner from the `/certificate/page` API response.
- Keep the page statically renderable and fast (it's `revalidate = 3600` today) — fetch via `serverApi`/`serverFetch` so Next.js cache tags apply, not client-side TanStack Query.
- Never render a blank/broken section: if a field is empty (API's own fallback) or the fetch fails, fall back to today's hardcoded copy/placeholder for that section independently.

**Non-Goals:**

- No change to `/certificate/config`, `CertificateForm`, pricing, or the payment flow.
- No admin/CMS UI work — ACF fields already exist server-side per the controller's `Certificate_Fields` dependency.
- Not wiring `formId`/`txnFieldId` into the frontend — `CertificateForm` already gets form/field wiring from `/certificate/config` (`form_id`, `record_form_id`, `fields`); `page.tsx`'s `formId`/`txnFieldId` are not currently consumed by any component and are out of scope until a concrete need appears.

## Decisions

- **Fetch layer**: use `serverApi`/`serverFetch` (`src/lib/api/server.ts`), matching the file's existing `generateMetadata` pattern (`fetchRankMathSeo`) and the project convention that Server Components use tagged native `fetch`, not the client Axios singleton. Tag as `certificate-page` for future `revalidateTag()` support.
- **Endpoint constant**: add `page: \`${lms}/certificate/page\``under`endpoints.certificate`in`endpoints.ts`, alongside the existing `config`/`quote` entries — keeps the single-source-of-URLs convention.
- **Type shape**: new `CertPageContent` type in `types/certificate.ts`, mirrored field-for-field from the controller response (`hero` incl. `images`, `trustBadges`, `accreditationBanner`, `orderSection`, `promoBanner`, `formId`, `txnFieldId`) rather than reusing/extending `CertConfig` — the two endpoints return unrelated shapes (content vs. pricing schema). A shared `CertImage { url: string; alt: string }` type backs both `hero.images[]` and `promoBanner.image`.
- **Image rendering**: use `next/image` for both hero images and the promo banner image — the WP media host is already registered in `next.config.mjs` via `NEXT_PUBLIC_WP_API_URL`'s hostname, so no config change needed. Use `alt` from the API payload, falling back to an empty/decorative `alt=""` only if the field is blank (ACF media library `alt` is usually populated, but the type allows an empty string).
- **Fallback strategy**: per-field fallback, not all-or-nothing. Each rendered field (`hero.heading`, `hero.text`, `hero.benefits`, `hero.images`, `trustBadges`, `accreditationBanner.heading`/`badgeLabel`, `promoBanner`) falls back independently to the current static value/placeholder when empty/missing, so partial ACF content (e.g., only the hero text filled in, no images yet) still renders correctly rather than blanking sections that have no content yet.
- **Hero images fallback**: when `hero.images` is empty, keep today's two decorative placeholder `<div>`s (`bg-white/10` boxes) exactly as-is — they carry no content today, so there's nothing lossy about keeping them as the zero-state.
- **Promo banner fallback**: when `promoBanner.image` is null, keep the current hardcoded gradient box with "Promotional Banner" text (using `promoBanner.heading` in place of that label if present, else the static string). When an image is present, render it (optionally wrapped in an `<a>` if `promoBanner.link` is set) instead of the gradient box.
- **Error handling**: wrap the fetch so a network/5xx failure degrades to full static fallback (current hardcoded page) rather than throwing — this is a public marketing page; it must never 500 because the CMS content endpoint is down. Matches `fetchRankMathSeo`'s existing "returns null on failure, caller falls back" pattern in this codebase.
- **No client-side re-fetch**: content is presentational and low-frequency-changing, so no TanStack Query hook is introduced for it — avoids a second data-fetching pattern on a page that's otherwise fully server-rendered.

## Risks / Trade-offs

- **[Risk]** ACF content team edits `heading`/`text` but leaves `benefits` empty, expecting the array to be optional → **Mitigation**: fallback is per-field, so `benefits` renders the static 3-item list until ACF supplies its own, without blocking the heading/text edits from showing.
- **[Risk]** `trustBadges` is a new UI element with no existing static equivalent (nothing currently rendered for it) → **Mitigation**: only render the trust-badges block when the array is non-empty; omit entirely otherwise (no fallback content needed since nothing renders today).
- **[Risk]** Revalidate window (3600s) means content edits take up to 1h to appear → **Mitigation**: unchanged from current behavior (page already has `revalidate = 3600`); acceptable for marketing copy/images, no change requested here.
- **[Risk]** Admin uploads a very large/unoptimized hero or banner image via the ACF media picker, hurting LCP on a page that already ships hero imagery → **Mitigation**: `next/image` handles responsive sizing/optimization automatically once wired up; no additional backend constraint added in this change (could add ACF image size/type restrictions later if it becomes a real issue).

## Open Questions

- None — `orderSection.heading` fallback: the controller returns `{ heading: '' }` with no other fields; frontend will fall back to the existing static "Order Your New Certificate" heading when empty.
- None — image `alt` text: sourced directly from the WP media library attachment's alt field via ACF's `return_format=array`; no separate alt-text input was added to the `hero_images`/`promo_banner` ACF fields.
