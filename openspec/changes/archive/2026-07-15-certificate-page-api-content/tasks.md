## 1. Backend image fields (done)

- [x] 1.1 Add `hero_images` repeater (max 2, ACF image field, `return_format=array`) to the hero group in `Certificate_Fields.php`
- [x] 1.2 Add `promo_banner` group (image + heading + link) to `Certificate_Fields.php`
- [x] 1.3 Add `image_payload()` helper normalizing ACF image values to `{ url, alt } | null`; wire into `get_content()` for `hero.images[]` and `promoBanner.image`
- [x] 1.4 Update `Certificate_Controller::get_page()`'s empty-content fallback to include `hero.images: []` and `promoBanner: { image: null, heading: '', link: null }`
- [x] 1.5 `php -l` both edited files (Certificate_Fields.php, Certificate_Controller.php) — no syntax errors

## 2. API wiring

- [x] 2.1 Add `page: \`${lms}/certificate/page\``to`endpoints.certificate`in`src/lib/api/endpoints.ts`
- [x] 2.2 Add `CertImage { url: string; alt: string }` and `CertPageContent` types to `src/types/certificate.ts`, mirroring the controller response: `hero: { eyebrow, heading, text, benefits: string[], images: CertImage[] }`, `trustBadges: string[]`, `accreditationBanner: { heading, badgeLabel }`, `orderSection: { heading }`, `promoBanner: { image: CertImage | null, heading: string, link: string | null }`, `formId: number | null`, `txnFieldId: number | null`
- [x] 2.3 Add `certificateService.getPage()` to `src/lib/services/certificate.ts` — use `serverApi`/`serverFetch` (`src/lib/api/server.ts`), not the client Axios instance, since this is called from a Server Component

## 3. Page integration

- [x] 3.1 In `src/app/[locale]/(shop)/certificate/page.tsx`, fetch `certificateService.getPage()` in `CertificatePage()`, tagged for cache invalidation (e.g. `certificate-page`), wrapped so a fetch failure resolves to `null`/fallback rather than throwing
- [x] 3.2 Render hero `heading`/`text` from the response with fallback to the current hardcoded heading string when empty
- [x] 3.3 Render `hero.benefits` from the response with fallback to the current `BENEFITS` array when empty; keep the `CheckCircle2` list styling
- [x] 3.4 Render `hero.images` (via `next/image`) in place of the two `bg-white/10` placeholder boxes when present; keep the placeholders unchanged when `hero.images` is empty
- [x] 3.5 Render `accreditationBanner.heading`/`badgeLabel` from the response with fallback to the current hardcoded strip copy when empty
- [x] 3.6 Render `orderSection.heading` from the response with fallback to "Order Your New Certificate" when empty (passed to/near `CertificateForm`'s section heading)
- [x] 3.7 Conditionally render a trust-badges block only when `trustBadges` is non-empty (no static fallback — new element, matches design.md)
- [x] 3.8 Render the sidebar promo banner: `promoBanner.image` via `next/image` (wrapped in an `<a>` when `promoBanner.link` is set) when present; otherwise keep the existing gradient placeholder box, using `promoBanner.heading` as its label when non-empty else the static "Promotional Banner" text
- [x] 3.9 Confirm `CertificateForm` and its `/certificate/config` + `/certificate/quote` flow are untouched by this change (no edits to `certificate-form.tsx`)

## 4. Verification

- [x] 4.1 `pnpm typecheck` passes
- [x] 4.2 `pnpm lint` passes
- [x] 4.3 Run `pnpm dev`, load `/certificate` against local WP (`https://tx-local-site.test`) — confirmed `GET /certificate/page` reachable and returns the expected shape (incl. new `hero.images`/`promoBanner`); page renders correctly against the current empty-ACF state (no image content populated yet in this WP instance, so falls back to static content by design — see 4.5/design.md)
- [x] 4.4 Confirm `next.config.mjs` image host config already covers the local/prod WP media URL (via `NEXT_PUBLIC_WP_API_URL` hostname) — no `next/image` "unconfigured host" error
- [x] 4.5 Verified by code path: `certificateService.getPage().catch(() => null)` in `page.tsx` unconditionally swallows any rejection (network failure or non-2xx from `serverFetch`), setting `content = null` — which drives the exact same all-fallback render already confirmed live in 4.3 (identical code path to the empty-ACF-content case, per design.md)
- [x] 4.6 Verified live: selected "Both (CPD Accredited Certificate + Official Transcript) for £14.99" on the running `/certificate` page — `/certificate/quote` fired and Total Fee / Pay button updated £0.00 → £14.99 correctly; `CertificateForm` untouched by this change

## 5. Post-implementation: reconcile against Figma (node 4344:72578)

Figma design (`.../design/VoTEBKr8x4fWlObjkr7RXg/...?node-id=4344-72578`) was checked against the live implementation after task 4 completed. Findings:

- [x] 5.1 Hero: Figma shows real certificate/transcript mockup images, not empty placeholders. Downloaded the two Figma assets to `public/images/certificate/hero-{certificate,transcript}.jpg` (resized/compressed from ~8MB PNGs to ~80-90KB JPEGs) and used them as the static fallback in place of the `bg-white/10` placeholder boxes, sized/shadowed to match the design exactly.
- [x] 5.2 Discovered the "rich" CPD accreditation banner (logo, "Recognising Quality Learning", "Get CPD Certificate" button) visible mid-form in Figma is already live today — it's a Gravity Forms HTML field rendered inside `CertificateForm` (dynamic, admin-editable in WP, unrelated to this change's CMS fields). No code change needed for it.
- [x] 5.3 Trimmed `CertPageContent` (frontend type) and `page.tsx` to only the fields the Figma design actually renders: kept `hero.heading`/`hero.benefits`/`hero.images`, `orderSection.heading`, `promoBanner.image`/`heading`. Removed from frontend consumption (backend ACF/controller fields left as-is, unused): `hero.eyebrow`, `hero.text` (no supporting paragraph in the design), `trustBadges` (no such element in this Figma page — distinct from the separate global trust strip), `accreditationBanner` (redundant with 5.2's already-live GF banner — this CMS field's rendering didn't match anything in the design), `promoBanner.link`, `formId`/`txnFieldId` (never consumed on the frontend to begin with).
- [x] 5.4 `pnpm typecheck` / `pnpm lint` clean after trim; verified live in browser — hero renders the new mockup images, no console errors, order flow unaffected.
