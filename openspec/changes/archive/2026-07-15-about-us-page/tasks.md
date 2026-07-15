## 1. Backend — ACF field group and page auto-create

- [x] 1.1 Create `lms-backend-rest-api/includes/Infrastructure/About_Fields.php` (namespace `LMS\BackendApi\Infrastructure`), modeled on `Contact_Fields.php`: `PAGE_SLUG = 'about-us'`, `ensure_page()`, cached `page_id()`, `init()` hooking `acf/init` → `register_field_group()`.
- [x] 1.2 Define hero fields (`group`): `eyebrow` (text, default "About us"), `heading` (text, default "Empowering Careers, Ensuring Compliance."), `subheading` (textarea, default "Expert-led training to enhance skills, ensure compliance, and support career growth"), `primary_button` (group: `label` default "Get started", `href` default "/all-courses"), `secondary_button` (group: `label` default "Chat to sales", `href` default "/contact-us").
- [x] 1.3 Define `commitment_blocks` repeater (3 default rows) with sub-fields: `icon` (select: message-chat, zap, chart-breakout), `heading` (text), `text` (textarea), `check_items` (repeater of `{ text }`), `image` (image field, no default) — seed the 3 default rows with exact Figma copy: "What We Offer?" (5 check items), "Why Train with Us?" (4 check items), "Train Your Workforce with Confidence" (4 check items), per design.md §Decisions 1 and 4.
- [x] 1.4 Define `values` group: `eyebrow` (text, default "Our values"), `heading` (text, default "We value excellence, flexibility, and integrity, empowering growth through quality training."), `cards` repeater (6 default rows) with sub-fields `icon` (select: message-chat, zap, chart-breakout, message-smile, command, message-heart), `title`, `description` — seed with the 6 Figma values (Commitment to Learning, Innovation, Excellence, Flexibility, Learner-Centric, Impact-Driven) and their exact descriptions.
- [x] 1.5 Define `team` group: `eyebrow` (text, default "Join our team"), `heading` (text, default "We're just getting started"), `text` (textarea, default "Our philosophy is simple — hire a team of diverse, passionate people and foster a culture that empowers you to do your best work."), `primary_button` (default label "We're hiring!", href per design.md Open Questions), `secondary_button` (default label "Read our principles", href per design.md Open Questions), `photos` repeater (5 rows, each an image field with no default).
- [x] 1.6 Implement `get_content(): ?array` reading `get_field()` for each top-level field off `page_id()`, returning `null` only when the page/ACF is entirely unavailable (mirrors `Contact_Fields::get_content()`). Revised from the original plan (see design.md Decision 1): ACF `default_value` alone proved unreliable for `get_field()`-by-name on never-saved `group`/`repeater` fields, so a canonical `defaults()` array is also seeded as real values via `update_field()` on `acf/init`.
- [x] 1.7 Wire `About_Fields` into `lms-backend-rest-api.php` bootstrap: `init()` alongside the existing `Homepage_Fields`/`Contact_Fields` calls, and `ensure_page()` alongside `Contact_Fields::ensure_page()`.

## 2. Backend — endpoint

- [x] 2.1 Create `lms-backend-rest-api/includes/Api/Controllers/About_Controller.php` registering `GET /lms-backend/v1/about/page`, returning `About_Fields::get_content()` shaped per specs/about-us-page-content/spec.md's "About page endpoint response shape" requirement, with an empty-shell fallback (mirroring `Contact_Controller::get_page()`) if `get_content()` returns null.
- [x] 2.2 Register `About_Controller` in `includes/Routes.php` alongside the other controllers.
- [x] 2.3 Verify (PHPUnit or manual `wp-json` call) that a fresh install's `/about/page` response matches every Figma default string listed in design.md, and that image/photo fields are `null`. Done via manual `wp-json` call against the local dev WP install (`tx-local-site.test`) — this is what caught and led to fixing the `default_value` seeding bug described in Decision 1.

## 3. Frontend — shared trusted-strip reuse

- [x] 3.1 Confirm `Topbar` (`src/components/home/topbar.tsx`) and `/lms-backend/v1/home/topbar` fetch pattern used on the homepage/pricing page (`src/app/[locale]/(marketing)/page.tsx`, `.../pricing/page.tsx`) — reuse the identical fetch + component on the About page. No new component.

## 4. Frontend — About page components

- [x] 4.1 Add `src/types/about.ts` (or extend `src/types/`) with types matching the `About_Controller` response: `AboutHero`, `AboutCommitmentBlock`, `AboutValues`, `AboutTeam`.
- [x] 4.2 Add `src/lib/services/about.ts` fetching `/about/page` via `serverApi`/`serverFetch` (server-side, tagged e.g. `about-page` for `revalidateTag`), normalizing the response into the types from 4.1, with Figma-derived defaults as the in-code fallback if the fetch fails (matching the ACF defaults from task 1.2–1.5 verbatim, so a fetch failure is visually indistinguishable from a fresh install).
- [x] 4.3 Add `src/components/about/about-breadcrumb.tsx` — static "Home > About us" navy (`#00204A`) bar per Figma's Breadcrumb component.
- [x] 4.4 Add `src/components/about/about-hero.tsx` — eyebrow/H1/subtext/two-button hero section per Figma's Header section.
- [x] 4.5 Add `src/components/about/about-commitment-section.tsx` — heading/subtext + the 3 alternating icon/heading/text/check-list/image rows (icon `select` key → lucide icon map per design.md Decision 5; image renders the uploaded photo or a placeholder per specs' "Photographic image fields default to empty" requirement).
- [x] 4.6 Add `src/components/about/about-values-grid.tsx` — eyebrow/heading + 6-card icon/title/description grid.
- [x] 4.7 Add `src/components/about/about-team-section.tsx` — eyebrow/heading/text/two buttons + 5-photo scattered collage (Figma's absolute-positioned layout), each photo slot falling back to a placeholder when its ACF image is unset.
- [x] 4.8 Rewrite `src/app/[locale]/(marketing)/about/page.tsx`: fetch About content (4.2) and topbar content (3.1) server-side, render `AboutBreadcrumb → Topbar → AboutHero → AboutCommitmentSection → AboutValuesGrid → AboutTeamSection` in that order; remove the old hardcoded content and the "Our journey" stats section (no Figma counterpart, per proposal.md's BREAKING note); keep the existing `generateMetadata`/`fetchRankMathSeo`/JSON-LD wiring intact per `SEO.md`.

## 5. Verification

- [x] 5.1 `pnpm typecheck` and `pnpm lint` in `tx-headless-frontend/`.
- [x] 5.2 `pnpm test` — add/adjust unit coverage for the new `src/components/about/*` components (fallback-default rendering + populated-data rendering) and `src/lib/services/about.ts`'s normalization.
- [ ] 5.3 Backend: `composer test` (or targeted PHPUnit) covering `About_Fields::get_content()` defaults and `About_Controller`'s response shape.
- [x] 5.4 Manual check: `pnpm dev`, load `/about` with no ACF data saved — confirm visual parity with Figma node `649:22654` section-by-section (Breadcrumb, Trusted, Hero, 3 commitment blocks, values grid, Team). Then edit a field (e.g. hero heading, one check item) in wp-admin and confirm it reflects after `revalidateTag`/reload.
