## Why

The current homepage (Figma node `89:9557`) is the original migration pass. Design has produced a new homepage layout (Figma node `4571:10560`, "Homepage - Redesigned") that adds conversion-focused elements the old page lacks: a hero search bar, a scarcity-driven course-card design (sale countdown, richer trust badges), a Trustpilot-backed reviews strip, and two new commercial upsell sections (team/B2B training, CPD certificate ordering). The redesign also drops the old three-panel "alternating gif" Hero/Why format and the homepage blog section in favor of denser, higher-signal content blocks. We need both the WP plugin (`wp-lms-backend-rest-api`) and the Next.js frontend updated together since several new UI elements require fields the API does not currently return.

## What Changes

- Rebuild `/` (marketing homepage) section order and visuals to match Figma `4571:10560`: Topbar → Header → Hero (headline + search + floating course-card carousel) → Trusted Orgs → Categories → Popular Courses (new card design) → Reviews (+ Trustpilot card) → Pricing → Why Choose Us (new 2x2 icon-grid content model, **BREAKING** for the `why` section shape) → Transform Your Team (new) → CPD Certificate & Transcript (new) → Footer CTA/columns (mostly reused, verify against design).
- **BREAKING**: `HomeWhyPanel`/`why` payload (alternating title+bullets+gif+CTA panels) is replaced by a 4-item icon+title+description grid. The `hero` field (same alternating-panel shape, currently unused by the homepage) is deprecated for homepage use.
- Add a hero course-search affordance (subject/qualification input + submit) that routes to `/all-courses` or `/search` with a query param — reuses existing search infrastructure.
- Reuse the existing `HeroCarousel`/`CourseCard` stacked-carousel component for the hero's floating course cards (already built from a prior Figma pass — no new component needed, only data wiring).
- Extend course list/card data (`/courses`, `/courses/featured`, category/all-courses listings) to include: promotional badges (bestseller, limited-time offer, free-certificate, team-training), CPD points, and a sale end datetime for a live countdown — currently only present on the single-course detail endpoint.
- Add a "Transform Your Team" B2B teaser section (heading, 5 icon-bullets, photo collage, "Request a Quote" CTA) and a "CPD Accredited Certificate & Transcript" teaser section (heading, description, "Order Certificate" CTA, certificate/transcript images) as new homepage content, sourced from the existing `/home` composite endpoint pattern (new sub-sections).
- Add a "Trusted by Over 1000+ UK organisations" header line to the trusted-orgs section (currently logos only, no heading/count copy).
- Remove the `BlogSection` from the homepage (blog remains reachable via `/blog`).
- Reconcile the pricing-card badge mapping (`best-value` vs `most-popular`) against the redesigned pricing cards, which assign the ribbons differently than the current hardcoded fallback.

## Capabilities

### New Capabilities

- `homepage-sections`: The homepage's section set, order, and content contract — hero (headline + search + carousel), trusted orgs, categories, popular courses, reviews/Trustpilot, pricing, why-choose-us grid, transform-your-team, cpd-certificate, and footer CTA — served by the WP `/lms-backend/v1/home*` endpoints and rendered by the Next.js `/` route.
- `course-card-promotions`: Promotional metadata on course list responses — badges (bestseller, limited-time-offer, free-certificate, team-training), CPD points, and sale countdown (sale end datetime + regular/sale price) — consumed by `CourseCard` and any listing that reuses it (homepage, all-courses, category pages, hero carousel).

### Modified Capabilities

_None — no existing `openspec/specs/` capabilities in this repo yet; the homepage's previous behavior is undocumented as a spec, so it is captured fresh under `homepage-sections` above rather than as a delta._

## Impact

**Frontend (`tx-headless-frontend/`)**

- `src/app/[locale]/(marketing)/page.tsx` — section order, drop `BlogSection`, wire new sections.
- `src/components/home/*` — `hero-section.tsx` (add search bar, wire `HeroCarousel`), `why-section.tsx` (replace with icon-grid variant or new component), `trusted-orgs.tsx` (add heading), new `transform-team.tsx`, new `cpd-certificate.tsx`; `reviews-section.tsx` (add Trustpilot card).
- `src/components/courses/course-card.tsx` — badges row, sale countdown, strikethrough price.
- `src/types/home.ts`, `src/types/course.ts` — new/changed shapes (`HomeWhyFeature`, `HomeTeamSection`, `HomeCertificateSection`, `Course.badges`/`saleEndsAt`/`cpdPoints`).
- `src/lib/api/endpoints.ts`, `src/lib/api/server.ts`, `src/lib/services/courses.ts` — new endpoint paths/fields, normalization.

**Backend (`wp-lms-backend-rest-api` — local install path `/Users/codeentechnologies/Sites/tx-local-site/wp-content/plugins/wp-lms-backend-rest-api`)**

- `includes/Api/Controllers/Homepage_Controller.php`, `includes/Infrastructure/Homepage_Fields.php` — replace `why_data()` shape, add `team_data()` / `certificate_data()` sections and their ACF/option-backed fallbacks, add trusted-orgs heading.
- `includes/Api/Models/Course_Model.php` — expose `badges`, `cpd_points`, and sale pricing (`get_detail_pricing()`'s fields, incl. `date_on_sale_to`) on `to_array()` (list serialization), not just `to_detail_array()`.
- No database schema changes — all new content is WP options/ACF (JSON-encoded, following the existing pattern) plus existing WooCommerce product fields already present on course products.

**Out of scope:** `/pricing`, `/about`, `/all-courses` page layouts (only the shared `CourseCard` changes), auth/BFF, other migrated pages.
