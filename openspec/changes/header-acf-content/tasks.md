## 1. Backend — ACF field group

- [ ] 1.1 Create `lms-backend-rest-api/includes/Infrastructure/Header_Fields.php` (namespace `LMS\BackendApi\Infrastructure`) modeled on `Homepage_Fields.php` / `Contact_Fields.php`: `init()` hooks `acf/init` → `register_field_group()`.
- [ ] 1.2 In `register_field_group()`, call `acf_add_options_page()` (guarded by `function_exists`) to create a top-level "Header Settings" options page, then `acf_add_local_field_group()` with `location` targeting that options page.
- [ ] 1.3 Define fields: a `repeater` (or ordered group set) `header_nav_items` with sub-fields `label` (text) and `href` (text, optional) seeded with 6 default rows (About us→/about, Help→/help, Our courses→(none), Training teams→/training-teams, Resources→(none), Contact us→/contact-us); `header_search_label` (text, default "Find a course:"); `header_search_placeholder` (text, default "e.g. food hygiene"); `header_basket_label` (text, default "Basket"); `header_login_label` (text, default "Log in"); `header_logo` (image, no default — left empty per design.md Non-Goals).
- [ ] 1.4 Implement `get_defaults(): array` returning the Figma-derived defaults (single source used by both the field-group registration and the reader fallback).
- [ ] 1.5 Implement reader method(s), e.g. `get_header(): array`, that call `get_field()` against the options page, sanitize each value, and fall back to `get_defaults()` per-field when a saved value is empty/blank (mirrors `Admin_Navigation_Settings_Controller`'s empty-string-falls-back-to-default behavior).
- [ ] 1.6 Wire `Header_Fields` into the plugin bootstrap in `lms-backend-rest-api.php` alongside the existing `Homepage_Fields` / `Contact_Fields` `init()` calls, guarded by `class_exists()`.

## 2. Backend — settings endpoint

- [ ] 2.1 In `lms-backend-rest-api/includes/Api/Controllers/Settings_Controller.php`, add a `header` key to the `get_settings()` response array, sourced from a `Header_Fields` instance's `get_header()` (lazy-instantiate the same way `Homepage_Controller::fields()` does).
- [ ] 2.2 Confirm no existing key in `get_settings()`'s response is renamed/removed — `header` is additive only.
- [ ] 2.3 Manually verify via `wp-json/lms-backend/v1/settings` (or PHPUnit) that a fresh install returns the full Figma-default `header` object, and that saving/blanking a field in wp-admin round-trips correctly.

## 3. Frontend — types and fallback defaults

- [ ] 3.1 In `tx-headless-frontend/src/types/settings.ts`, add `HeaderNavItem { label: string; href?: string }` and `HeaderContent { nav_items: HeaderNavItem[]; search_label: string; search_placeholder: string; basket_label: string; login_label: string }`, and add optional `header?: HeaderContent` to `SiteSettings`.
- [ ] 3.2 In `tx-headless-frontend/src/lib/services/settings.ts`, add the same Figma-derived defaults to `getEnvFallbackSettings()`'s `header` field (and to the merge logic in the settings-merging function, consistent with how other optional fields are merged).

## 4. Frontend — SiteHeader consumption

- [ ] 4.1 In `tx-headless-frontend/src/components/layout/header.tsx`, read `settings.header` from `useSiteSettings()` inside `SiteHeader`.
- [ ] 4.2 Replace hardcoded "About us" / "Help" / "Our courses" / "Training teams" / "Resources" / "Contact us" label strings (desktop nav, rows 1–2, and the mobile nav block) with values from `settings.header.nav_items`, matched by position/id, falling back to the current hardcoded label+href when the item or the whole `header` object is absent. Keep "Our courses" and "Resources" special-cased (mega menu / `NavDropdown` triggers) — only their label text becomes dynamic, not their click behavior.
- [ ] 4.3 Replace the hardcoded "Find a course:" label and "e.g. food hygiene" placeholder in `CourseSearch` with `settings.header.search_label` / `settings.header.search_placeholder`, with fallback.
- [ ] 4.4 Replace the hardcoded "Basket" and "Log in" strings with `settings.header.basket_label` / `settings.header.login_label`, with fallback (leave the `({count})` suffix logic in `CartButton` untouched).
- [ ] 4.5 Do not add any new logo-image consumption — leave `logoUrl` resolution as-is (per design.md Non-Goals).

## 5. Verification

- [ ] 5.1 `pnpm typecheck` and `pnpm lint` in `tx-headless-frontend/`.
- [ ] 5.2 `pnpm test` — update/add unit test coverage for `SiteHeader` rendering with (a) no `header` settings (fallback matches today's UI) and (b) a populated `header` object (renders overridden labels/hrefs).
- [ ] 5.3 Backend: `composer test` (or targeted PHPUnit) in `lms-backend-rest-api/` covering `Header_Fields::get_header()` defaults and `Settings_Controller::get_settings()` including the `header` key.
- [ ] 5.4 Manual check: start `pnpm dev`, load the homepage, confirm the header renders identically to the current site with no ACF data saved (visual parity with Figma node `649:22655`); then set a custom nav label/href in wp-admin's Header Settings page and confirm it reflects on reload.
