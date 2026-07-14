## Context

The homepage is currently implemented per Figma node `89:9557` (see memory: full Figma→code pass, `src/components/home/*`, backed by the WP plugin's `Homepage_Controller` composite `/lms-backend/v1/home` endpoint, each section stored as a WP option / ACF field on the front page with a hardcoded PHP fallback). Design has replaced this with node `4571:10560` ("Homepage - Redesigned"). Investigation of both repos found:

- The floating hero course-card stack already exists as `HeroCarousel` (`src/components/home/hero-carousel.tsx`), built from an earlier Figma pass (node `89:10324`) and pixel-matches the new design's hero carousel — **reuse as-is**, only needs course data wired in.
- `SiteFooter` (`src/components/layout/footer.tsx`) already contains the exact "Training That Works for Your Team" CTA band + nav columns + certificate validator shown at the bottom of the new design — **no change needed** beyond visual diffing.
- `CategoriesGrid` already supports per-category icons (`cat.image`) — the new design's icon grid is a styling pass, not a data-model change.
- The backend course model (`Course_Model.php`) already computes `badges` (`bestseller`, `limited_time_offer`), `cpd_points`, and full WooCommerce sale pricing (`is_on_sale`, `sale_price`, regular price, price HTML) — but only on `to_detail_array()` (single-course endpoint). The list endpoints used by the homepage (`to_array()`, used by `/courses`, `/courses/featured`) omit all three. This is the one real backend gap driving the new course-card visuals (badges row, strikethrough price, countdown).
- `why_data()` / `hero` (the alternating title+bullets+gif+CTA panel format, `HomeWhyPanel`) has no equivalent in the new design at all — both the homepage hero and "Why Choose Us" sections in `4571:10560` use different, denser layouts (search+carousel hero; 2x2 icon-grid why-section).
- Two sections are entirely new content with no backend representation: "Transform Your Team With Us" (B2B teaser) and "CPD Accredited Certificate & Transcript" (certificate ordering teaser).

## Goals / Non-Goals

**Goals:**

- Match Figma `4571:10560` section-for-section on `/`.
- Extend the WP plugin so all new homepage content follows the existing pattern (ACF front-page field → WP option JSON fallback → hardcoded PHP fallback) — no new content-storage mechanism.
- Enrich course list responses so any listing using `CourseCard` (homepage, all-courses, category pages) gets the new badge/countdown/price fields for free, keeping one card component.
- Keep `/home` a single composite fetch for the full-page ISR read (`revalidate = 300`), consistent with today.

**Non-Goals:**

- No admin UI for editing the new sections (out of scope; content is edited via WP option/ACF like existing sections, or hardcoded fallback until content team provides copy).
- No changes to `/pricing`, `/about`, `/all-courses` page layout — only the shared `CourseCard`.
- No WooCommerce checkout/cart flow changes — sale countdown only _reads_ `date_on_sale_to`, it does not schedule sales.
- No interactive category-filtering behavior (clicking a category on the homepage does not live-filter Popular Courses) — Figma shows one category ("Education") in a highlighted/active visual state, which reads as a static design accent, not a specified interaction. Treated as out of scope; flagged under Open Questions.

## Decisions

**1. Reuse `HeroCarousel` and `SiteFooter` unchanged.** Both already match the new design pixel-for-pixel (confirmed via Figma screenshot comparison). Avoids duplicate components and preserves existing animation/accessibility work in `HeroCarousel`. Only `page.tsx` wiring (which courses feed the carousel — reuse `/courses/featured`) changes.

**2. Replace `WhySection` content model rather than extend it.** The new design's "Why Choose Us" is a fixed 4-item icon+title+description grid — structurally incompatible with the old alternating-panel format (`side`, `bullets`, `gif`, `cta` per item). Introduce a new type (`HomeWhyFeature[]`) and a new component (`why-choose-grid.tsx`), replacing `why-section.tsx`'s usage on the homepage. The old `WhySection`/`HomeWhyPanel` type and `hero` field are left in place (not deleted) in case another page reuses them — homepage stops rendering them. If nothing else references `WhySection` after this change, a follow-up cleanup change can remove it.

**3. Add badges/CPD/sale-countdown fields to `to_array()` (list serialization) by extracting the existing detail-only logic into shared protected methods.** `get_badges()`, `get_cpd_points()`, and the sale-pricing fields inside `get_detail_pricing()` already exist on `Course_Model` — they're simply not called from `to_array()`. Add `'badges' => $this->get_badges()`, `'cpd_points' => $this->get_cpd_points()`, and a slim `'sale' => ['regular_price' => ..., 'sale_price' => ..., 'is_on_sale' => ..., 'sale_ends_at' => ...]` block to `to_array()`, sourced from `$product->get_date_on_sale_to()` (native WooCommerce field — no new post meta needed for the countdown). Rejected alternative: a separate `/courses/featured?include=badges` opt-in param — rejected because every current consumer of `CourseCard` benefits from these fields and the extra data is cheap (a handful of scalars, already-loaded product object).

**4. `free_certificate` / `team_training` badges need new post-meta flags.** Unlike `bestseller`/`limited_time_offer` (already meta-backed), the Figma card shows "Free Certificate Included" and "Team Training Available" on every sampled card — ambiguous whether these are per-course toggles or universal marketing copy. Design decision: model them as **new per-course boolean meta** (`vibe_free_certificate`, `vibe_team_training`) defaulting to `true` for backward-compatible display parity with the mock, so content editors can turn either off per course later without a further backend change. `get_badges()` gains these two keys alongside the existing two.

**5. Pricing badge ribbon mapping is corrected to match the new mock, not preserved.** Current fallback assigns `'best-value'` to Premium Access and `'most-popular'` to Business Training; the new design shows "Most Popular" on Premium Access and "Best Value" on Business Training. Swap the fallback assignment in `pricing_data()`. This only affects the hardcoded PHP fallback and any already-saved `lms_home_pricing` option content is left untouched (site editors can update it independently) — call out prominently in tasks so whoever ships this checks the live option value too.

**6. New sections (`team`, `certificate`) follow the exact `Homepage_Controller` pattern.** Add `team_data()` and `certificate_data()` private methods (ACF → option → hardcoded fallback, same as every existing section), register `/home/team` and `/home/certificate` routes, and add both to the `/home` composite payload and `HomePageData` type. `Homepage_Fields.php` gets two new lazy ACF getters mirroring the existing ones.

**7. Trusted-orgs gets a header field, changing its response from a bare array to an object.** **BREAKING** at the wire level: `trusted_orgs_data()` currently returns `HomeTrustedOrg[]`; new shape is `{ header: { title: string }, orgs: HomeTrustedOrg[] }` so the "Trusted by Over 1000+ UK organisations" copy is content-managed like every other section header. `TrustedOrgs` component and `HomePageData['trusted_orgs']` type update together with the endpoint — no dual-read shim, since this is a same-repo/same-deploy coordinated change (frontend and backend ship together per this proposal).

## Risks / Trade-offs

- **[Risk] Enriching `to_array()` adds a WooCommerce product lookup (`wc_get_product()`) to every course in every list response** (all-courses, category pages, featured), which today only pays that cost on the single-course detail page → **Mitigation**: `get_product()` already lazy-loads and short-circuits for free courses; verify with a quick before/after timing check on `/courses?per_page=20` during implementation (task included). If it regresses, cache the WC product lookup per-request (static array keyed by product ID) rather than reverting the feature.
- **[Risk] `free_certificate`/`team_training` meta defaults to `true` for every existing course**, so every card immediately shows both badges until content editors curate them → **Mitigation**: acceptable per Decision 4 (matches the Figma mock's apparent "always on" look); documented as an editable default, not a bug.
- **[Risk] Trusted-orgs response shape change is breaking** for any other consumer of `/home/trusted-orgs` → **Mitigation**: grep confirms the only consumer is the homepage `TrustedOrgs` component shipped in this same change; no other caller exists today.
- **[Trade-off] "Request a Quote" (Transform Your Team) and "Order Certificate" (CPD Certificate) CTAs need a landing target.** Neither a B2B lead-capture endpoint nor a certificate-ordering flow was found wired into this frontend during investigation (a separate `wp-lms-b2b-rest-api` plugin and `wplms-business-dashboard` exist locally but are not confirmed integrated here). Default both CTAs to routing to existing pages (`/contact-us` prefilled for a quote request, `/verify-certificate` or `/all-courses` for certificate) rather than blocking the whole change on a new lead-gen integration — see Open Questions.

## Migration Plan

1. Ship backend changes first (additive endpoints/fields + the two breaking shape changes called out above), deploy to the local WP instance, verify via `API_REFERENCE.md`-style manual curl checks.
2. Ship frontend changes against the updated backend; `revalidate = 300` on `/` means the old cached page serves for up to 5 minutes post-deploy — acceptable, no manual cache purge required (a `WP_REVALIDATE_SECRET`-authenticated purge is available if the team wants immediate cutover).
3. No rollback complexity beyond standard `git revert` on both repos — no data migration, only additive/reshaped read endpoints and a stateless page rebuild.

## Open Questions

- Should the "Education" category highlight in Figma become a real active/selected state (and if so, does selecting a category filter Popular Courses), or is it purely a static design accent? Defaulted to **static/no interaction** for this change — confirm with design before implementation if wrong.
- Where should "Request a Quote" and "Order Certificate" actually route — existing `/contact-us` and `/verify-certificate`, or new dedicated flows (possibly tied to `wp-lms-b2b-rest-api` / a certificate-ordering feature)? Defaulted to existing pages; revisit if a dedicated flow already exists that wasn't discovered.
- Confirm the live `lms_home_pricing` WP option (if already populated on the target site) reflects the old best-value/most-popular mapping and needs manual correction alongside the fallback code fix (Decision 5).
