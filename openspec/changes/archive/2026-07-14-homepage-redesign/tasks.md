## 1. Backend — course list promotional data (`course-card-promotions`)

- [x] 1.1 In `Course_Model.php`, extract `get_badges()` to also check `vibe_free_certificate` and `vibe_team_training` post meta (default truthy when unset), returning `free_certificate` / `team_training` keys alongside existing `bestseller` / `limited_time_offer`.
- [x] 1.2 Add a shared `get_sale_summary()` helper (regular price, sale price, `is_on_sale`, `sale_ends_at` from `$product->get_date_on_sale_to()` formatted ISO 8601, `null` for free/unlinked courses) and use it from both `to_array()` and `get_detail_pricing()` to avoid duplicating WooCommerce lookups.
- [x] 1.3 Add `'badges' => $this->get_badges()`, `'cpd_points' => $this->get_cpd_points()`, and `'sale' => $this->get_sale_summary()` to `to_array()`.
- [x] 1.4 Manually verify `GET /courses?per_page=20` and `GET /courses/featured` response times before/after (Risk in design.md) — confirm no material regression. (~0.5s/~0.4s locally, no meaningful regression; verified `badges`/`cpd_points`/`sale` populate correctly on a real course.)
- [x] 1.5 Update `API_REFERENCE.md` (frontend repo) course list schema to document `badges`, `cpd_points`, `sale`.

## 2. Backend — homepage sections (`homepage-sections`)

- [x] 2.1 Rewrite `why_data()` in `Homepage_Controller.php` to return the 4-item icon-grid shape (`icon`, `title`, `description` per item) with the hardcoded fallback content from the design (Flexible Online Learning, Recognised & Accredited Courses, Industry-Standard and Expert-Curated Courses, Instant Digital Certificate). Add matching ACF getter in `Homepage_Fields.php`.
- [x] 2.2 Change `trusted_orgs_data()` to return `{ header: { title }, orgs: [...] }`, with fallback title "Trusted by Over 1000+ UK organisations". Update ACF getter accordingly.
- [x] 2.3 Add `team_data()` (heading, subtext, ordered benefit bullets with icon keys, images, CTA) with hardcoded fallback matching the "Transform Your Team with Us" content, register `GET /home/team`, add to composite `/home` response and `Homepage_Fields.php`.
- [x] 2.4 Add `certificate_data()` (heading, description, images, CTA) with hardcoded fallback matching "CPD Accredited Certificate & Transcript", register `GET /home/certificate`, add to composite `/home` response and `Homepage_Fields.php`.
- [x] 2.5 Swap the pricing fallback badges in `pricing_data()`: Premium Access → `most-popular`, Business Training → `best-value`.
- [x] 2.6 Check the live `lms_home_pricing` WP option on the target site — found 3 stale artifacts blocking the redesign: the `lms_home_pricing`/`lms_home_why`/`lms_home_trusted_orgs` WP _options_ (fake test fixture content, deleted with user confirmation) **and** real ACF postmeta on the front page for `lms_home_why` (old-shape content duplicating the pre-redesign fallback verbatim — cleared, since the shape is now obsolete by design) — `lms_home_pricing` ACF data is real, live, WooCommerce-linked content (2 plans, no "Business Training" tier) that a content editor needs to update separately; left untouched. Also fixed the `hero_headline` PHP fallback copy (was still "Get Skilled, Get Certified" — updated to match the new Figma hero copy, since ACF is empty there and the fallback is what actually renders).
- [x] 2.7 Update `API_REFERENCE.md` for `/home`, `/home/trusted-orgs`, `/home/why`, `/home/team` (new), `/home/certificate` (new).

## 3. Frontend — types & data layer

- [x] 3.1 Update `src/types/course.ts`: add `badges: string[]`, `cpdPoints?: number`, `sale?: { regularPrice: number | null; salePrice: number | null; isOnSale: boolean; saleEndsAt: string | null } | null` to `Course`, and normalize snake_case → camelCase in the courses service.
- [x] 3.2 Update `src/types/home.ts`: add `HomeWhyFeature { icon: string; title: string; description: string }` and change `HomePageData['why']` to `HomeWhyFeature[]`; change `trusted_orgs` to `{ header: { title: string }; orgs: HomeTrustedOrg[] }`; add `HomeTeamSection` and `HomeCertificateSection` types and their fields on `HomePageData`.
- [x] 3.3 Add `${lms}/home/team` and `${lms}/home/certificate` to `src/lib/api/endpoints.ts`.
- [x] 3.4 Wire `serverApi.home.get()` (and any per-section fetchers in `src/lib/api/server.ts`) to the updated `HomePageData` shape. (No code change needed — the composite fetch is generically typed as `HomePageData`, so the type update alone propagates.)

## 4. Frontend — course card promotions UI

- [x] 4.1 Build a small live countdown sub-component (`"Offer expires in HH:MM:SS"`, client component, ticks client-side from `sale.saleEndsAt`, renders nothing once expired). → `src/components/courses/sale-countdown.tsx`
- [x] 4.2 Update `CourseCard` (`src/components/courses/course-card.tsx`): render a badge pill per entry in `course.badges` (fixed label/style per known key: CPD, Free Certificate Included, Team Training Available, Bestseller, Limited Time Offer), strike through `sale.regularPrice` when `sale.isOnSale`, and render the countdown when `sale.saleEndsAt` is present and in the future.
- [x] 4.3 Verify `HeroCarousel` (unchanged component) still renders correctly with courses carrying the new fields (no prop-shape break). Verified via dev-server render.

## 5. Frontend — homepage sections

- [x] 5.1 Add a search input + submit to `HeroSection`, routing with the query applied; wire `HeroCarousel` into the hero. Already present in the existing implementation (search form → `/search?q=`, `HeroCarousel` wired to a popularity-sorted course list) — no change needed; only the `hero_headline` backend copy needed a fix (done in 2.6).
- [x] 5.2 Update `TrustedOrgs` to render the new `header.title` above the logo row (was previously a hardcoded client-side string, now driven by `data.header.title`).
- [x] 5.3 Create `why-choose-grid.tsx` rendering the 4-item icon grid from `HomeWhyFeature[]`; deleted the now-fully-unused `why-section.tsx` (its only consumer was `page.tsx`, updated in 5.7) and its `HomeWhyPanel` type (kept — still used by the legacy `hero` field for other potential consumers).
- [x] 5.4 Create `transform-team.tsx` (dark band: heading, subtext, 5 icon-bullets, photo collage, "Request a Quote" CTA → `/contact-us`).
- [x] 5.5 Create `cpd-certificate.tsx` (heading, description, certificate/transcript images, "Order Certificate" CTA → `/verify-certificate`).
- [x] 5.6 Add a Trustpilot summary card to `ReviewsSection` alongside existing testimonial cards (links to `/reviews`; rating/count derived from the live testimonials data — no external Trustpilot integration exists to source real numbers from).
- [x] 5.7 Update `page.tsx`: reordered to Topbar → Hero → TrustedOrgs → Categories → PopularCourses → Reviews → Pricing → WhyChooseGrid → TransformTeam → CpdCertificate (Header/Footer are global layout, unaffected). No `BlogSection` was rendered on `/` to begin with — nothing to remove. Also fixed `/pricing` page's now-stale `TrustedOrgs sponsors=` prop (same shared component).

## 6. Verification

- [x] 6.1 `pnpm typecheck` and `pnpm lint` pass in `tx-headless-frontend` (0 type errors; 0 lint errors, only pre-existing warnings in untouched files).
- [x] 6.2 `composer test` — **skipped, confirmed with user**: this environment has no `WP_TESTS_DIR` / PHPUnit test DB configured (one-time setup per root `CLAUDE.md`, not present here). Verified correctness instead via `php -l` on every touched file plus live `curl` checks against the real local WP+WooCommerce install (`/courses`, `/courses/featured`, `/home`) confirming the exact expected shapes.
- [x] 6.3 Ran `pnpm dev`, fetched `/` and confirmed every new/changed section heading renders server-side ("UK's Leading eLearning Hub for Growth", "Trusted by Over 1000...", "Explore courses by category", "Popular Courses", "What Our Learners Have to Say", "Trustpilot", "Enjoy Unlimited Training...", "Why Choose Us", "Transform Your Team with Us", "CPD Accredited Certificate..."), plus badge pills and pricing ribbons; no error/hydration-failure markers in the rendered HTML.
- [x] 6.4 Confirmed `CourseCard` badges render correctly on `/all-courses` too (after clearing a stale Next.js fetch cache left over from before the backend change — not a real bug, see note in the change summary).
- [x] 6.5 Two Open Questions from `design.md` **confirmed with the user**: (a) the Figma "Education" category highlight stays a static visual accent, not live filtering; (b) "Request a Quote"/"Order Certificate" CTAs keep pointing at `/contact-us`/`/verify-certificate` (no dedicated B2B/certificate-ordering flow exists). Remaining follow-up (not code, flagged to user): the live site's ACF-driven pricing content has only 2 plans (Monthly/Premium, real WooCommerce-linked), not the 3-tier Monthly/Premium/Business shown in the Figma redesign — a content-team task.
