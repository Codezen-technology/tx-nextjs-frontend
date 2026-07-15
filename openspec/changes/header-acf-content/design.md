## Context

`SiteHeader` (`tx-headless-frontend/src/components/layout/header.tsx`) already visually matches the Figma "Header" node (`649:22655`, fileKey `VoTEBKr8x4fWlObjkr7RXg`) — same dark navy bar, logo, "About us" / "Help" / search / "Our courses" / "Training teams" / "Resources" / "Contact us" / basket / login. All of that copy is hardcoded JSX strings; there is no admin surface to change it.

The backend plugin already has an established convention for admin-editable content: `includes/Infrastructure/*_Fields.php` classes register ACF field groups on `acf/init` via `acf_add_local_field_group` (code-defined, not DB-stored field definitions — see `Homepage_Fields`, `Contact_Fields`, `Page_Blocks_Fields`). Each binds its field group's `location` to something addressable: the site's static front page (`Homepage_Fields`), or an auto-created singleton page matched by slug (`Contact_Fields` → `contact-us`). ACF Pro is confirmed active (`Page_Blocks_Fields` already uses the Pro-only `flexible_content` field type), so Options Pages are available.

The header renders on every page, so it isn't a good fit for either existing binding style (front-page-only, or one-slug-page). It needs a **global** admin location, independent of any single WP page — an ACF Options Page.

Site-wide, non-page-bound settings already flow through one existing pipe: `GET /lms-backend/v1/settings` (`Settings_Controller::get_settings`) → server-fetched once → `SiteSettingsProvider` → `useSiteSettings()` / `useFeatureFlag()` in client components. `logo_url`, `currency`, `features`, etc. all travel this way already.

## Goals / Non-Goals

**Goals:**

- Make header nav labels, hrefs, search copy, and basket/login labels editable from wp-admin via ACF, defaulting to the exact strings/behavior in the Figma design (and in the current hardcoded JSX, which already matches Figma).
- Reuse the existing `*_Fields.php` + `/settings` + `SiteSettingsProvider` pipeline rather than introducing a new endpoint, provider, or fetch path.
- Zero visual/behavioral change when ACF fields are left empty (fallback to today's hardcoded defaults) — this ships safely with no content-editor action required.

**Non-Goals:**

- No new logo upload UI or image-cropping flow. The design's logo image and any other imagery are left unimplemented per explicit instruction ("img section can remain empty"); the header keeps using the existing `logo_url` (`custom_logo` theme mod) → text-fallback behavior unchanged.
- No changes to the mega menu (`Our courses` dropdown categories) or the `Resources` dropdown sub-links (`Blog`, `Help Centre`, `About Us`) — those are out of scope; only the top-level nav item labels/hrefs are covered.
- No mobile-nav-specific ACF fields — the mobile nav reuses the same desktop label set.
- No multi-language/i18n field variants.

## Decisions

**1. ACF Options Page, not a page-bound field group.**
Alternatives considered: bind to the front page like `Homepage_Fields`. Rejected — the header isn't homepage content, it's global chrome; binding it to the front page would be semantically wrong and would break if the front-page setting changes. An Options Page (`acf_add_options_page`, standard ACF Pro API) is the correct fit for singleton, page-independent config, matching how most WP sites model global header/footer content.

**2. Extend `/settings` response with a `header` key, not a new endpoint.**
Alternatives considered: a dedicated `/header` endpoint (mirroring `/promo-banner`, `/membership-upsell`). Rejected for this change — those standalone endpoints exist because their consumers (cart page, dashboard sidebar) need to fetch/refresh independently of the full settings blob. The header is rendered in the root layout alongside all other site settings and has no independent refresh need, so folding it into the existing `/settings` call (already fetched once server-side per `CLAUDE.md`'s site-settings architecture) avoids an extra request and a new provider.

**3. Defaults live in two places, deliberately: PHP (`Header_Fields::get_defaults()`) and TS (`getEnvFallbackSettings()`).**
The PHP defaults answer "what does ACF show/return when a field is empty" (server truth). The TS defaults answer "what does the client render before the server settings arrive, or if the whole `/settings` fetch fails" (`getEnvFallbackSettings()` already serves this role for other fields). Both are seeded with the same Figma-derived strings so they never visibly disagree. This mirrors the existing pattern (`Homepage_Fields` defaults vs. `Homepage_Controller` hardcoded fallback) rather than inventing a shared-source-of-truth mechanism, which the codebase doesn't have today.

**4. Per-nav-item shape: `{ label: string, href?: string }`.**
`href` is optional per item — when unset, the frontend keeps its current hardcoded route (`/about`, `/help`, `/training-teams`, `/contact-us`, plus the two special-cased items `Our courses` which toggles the mega menu and `Resources` which opens the `NavDropdown`, neither of which navigates directly). This lets editors retitle a link without needing to also know/re-enter its route, while still allowing a full URL override (e.g. pointing "Help" at an external help-desk URL) when needed.

**5. `header.tsx` reads settings but keeps its existing state machine and dropdown behavior untouched.**
Only label/href/placeholder strings become dynamic; `NavDropdown`, `CourseSearch`, `CartButton`, mega menu, and mobile nav open/close logic are unchanged. This keeps the diff small and avoids re-testing already-working interaction code.

## Risks / Trade-offs

- [Options Page requires ACF Pro] → Already confirmed active via `Page_Blocks_Fields`' flexible_content usage; no new dependency introduced.
- [Two default sources (PHP + TS) can drift over time] → Both seeded once from the same Figma spec in this change; acceptable given the existing codebase already accepts this duplication pattern elsewhere (`Homepage_Fields` vs. its controller fallback). No automated sync is proposed — out of scope.
- [`header` becomes `undefined` for a stale cached `/settings` response during rollout] → `SiteHeader` treats every header field as optional-with-fallback, so a partial or missing `header` object renders identically to today's hardcoded UI. No breaking change window.
- [Editors could set an empty/whitespace label, blanking a nav item] → `Header_Fields` sanitizes and treats blank strings the same as unset (falls back to default), following the `sanitize_text_field` + fallback pattern already used in `Admin_Navigation_Settings_Controller::update_navigation_settings`.

## Migration Plan

1. Ship `Header_Fields.php` + Options Page registration + `Settings_Controller` change. Deploy is additive-only — no DB migration, no existing option/row touched.
2. Ship frontend `SiteSettings.header` type + `header.tsx` consumption with fallbacks. Safe to deploy independently of the backend change (falls back to current hardcoded strings if `header` is absent from the API response).
3. No rollback concerns beyond a normal revert — nothing destructive, no data migrated.

## Open Questions

- None blocking. If future work wants dropdown sub-links (Resources menu, mega menu categories) editable too, that's a natural follow-up capability, not addressed here.
