## Why

The `/certificate` page's hero copy, benefits list, CPD accreditation banner, order-section heading, hero graphic panels, and sidebar promotional banner are all hardcoded (text and static placeholder boxes) in `page.tsx`. The backend plugin now exposes `GET /lms-backend/v1/certificate/page` (`Certificate_Controller::get_page()`), returning this content — hero (eyebrow/heading/text/benefits/**images**), trust badges, accreditation banner, order-section copy, a **sidebar promo banner (image/heading/link)**, plus `formId`/`txnFieldId` — sourced from ACF fields (including image fields, added to `Certificate_Fields.php` in this change) so marketing can edit copy and images without a code deploy. The frontend never calls this endpoint, so editorial changes currently require a code change and redeploy, and the two hero graphic slots plus the sidebar banner are unfillable placeholder `<div>`s with no image at all.

## What Changes

- **Backend** (`wp-lms-backend-rest-api` plugin, already implemented in this change):
  - `Certificate_Fields.php`: add a `hero_images` repeater (max 2, ACF image field, `return_format=array`) to the hero group, and a new `promo_banner` group (image + heading + optional link) for the sidebar banner. `get_content()` normalizes each ACF image into `{ url, alt }` via a new `image_payload()` helper, or `null` when unset.
  - `Certificate_Controller.php`: `get_page()`'s empty-content fallback shape extended with `hero.images: []` and `promoBanner: { image: null, heading: '', link: null }`.
- **Frontend**:
  - Add `certificate.page` to `src/lib/api/endpoints.ts` (`GET /certificate/page`).
  - Add a `CertPageContent` type to `src/types/certificate.ts` mirroring the controller's response shape (`hero` incl. `images: CertImage[]`, `trustBadges`, `accreditationBanner`, `orderSection`, `promoBanner`, `formId`, `txnFieldId`), plus a `CertImage { url: string; alt: string }` type.
  - Add `certificateService.getPage()` in `src/lib/services/certificate.ts`.
  - Update `src/app/[locale]/(shop)/certificate/page.tsx` to fetch `/certificate/page` server-side (via `serverApi`/`serverFetch`) and render hero heading/text/benefits/images, trust badges, the accreditation banner, and the sidebar promo banner from the response.
  - Preserve the current hardcoded copy/placeholder boxes as the fallback when the API returns null/empty fields (matches the controller's own `get_page()` fallback shape) or the fetch fails, so the page never renders blank.
  - No changes to `CertificateForm` — it continues to source pricing/fields from `/certificate/config`, unaffected by this change.

## Capabilities

### New Capabilities

- `certificate-page-content`: Server-rendered `/certificate` marketing page sources its editable copy and images (hero text/benefits/images, trust badges, accreditation banner, order-section heading, sidebar promo banner) from the `GET /certificate/page` API response, with a static fallback when the response is empty or unavailable.

### Modified Capabilities

(none — no existing spec covers the certificate page)

## Impact

- **Frontend files**: `src/lib/api/endpoints.ts`, `src/types/certificate.ts`, `src/lib/services/certificate.ts`, `src/app/[locale]/(shop)/certificate/page.tsx`.
- **Backend files** (already edited): `includes/Infrastructure/Certificate_Fields.php`, `includes/Api/Controllers/Certificate_Controller.php` in `wp-lms-backend-rest-api`.
- **API**: consumes `GET /lms-backend/v1/certificate/page` (public, no auth) — image URLs come from WP media library (`wp-content/uploads`), already an allowed `next/image` host via `NEXT_PUBLIC_WP_API_URL`.
- **Rendering**: page stays a Server Component; new fetch uses `serverApi`/`serverFetch` (Next.js cache tags) per project convention, not the client Axios instance.
- **Risk**: low — additive fetch with fallback to existing static content/placeholders; no change to the payment/order flow.
