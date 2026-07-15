## Why

The Figma "Header" component (node `649:22655`, Training Excellence desktop nav) is already implemented in code (`SiteHeader` in `src/components/layout/header.tsx`) with matching layout, colors, and copy — but every nav label, the search placeholder, and the basket/login copy is hardcoded in JSX. Content editors have no way to change this text without a code deploy, unlike the rest of the site's marketing content which is already ACF-editable (homepage sections, contact page, blog). This change brings the header's text content under ACF control, seeded with the exact default values shown in the Figma design.

## What Changes

- Add a new `Header_Fields.php` ACF field group (backend) registered on an ACF Options Page ("Header Settings"), following the existing `*_Fields.php` pattern (`Homepage_Fields`, `Contact_Fields`).
- Fields: primary nav links (About us, Help, Our courses, Training teams, Resources, Contact us — label + optional URL override), search placeholder text ("e.g. food hygiene"), search label ("Find a course:"), basket label ("Basket"), login label ("Log in"), and an optional logo image (left empty by default — frontend keeps its existing text-logo fallback when unset).
- Extend `GET /lms-backend/v1/settings` (`Settings_Controller::get_settings`) to include a `header` object sourced from `Header_Fields`, with hardcoded defaults matching Figma when ACF is empty/unavailable.
- Extend the frontend `SiteSettings` type (`src/types/settings.ts`) with an optional `header` field and update `getEnvFallbackSettings()` with the same Figma-derived defaults.
- Update `SiteHeader` (`src/components/layout/header.tsx`) to read nav labels/hrefs, search copy, and basket/login labels from `useSiteSettings().header`, falling back to today's hardcoded strings when the field is absent (keeps existing behavior identical until content is edited in wp-admin).
- Logo continues to resolve via the existing `logo_url` mechanism (theme mod custom logo); no new image-upload UI is added on the frontend in this change — image section stays empty/unimplemented per request.

## Capabilities

### New Capabilities

- `site-header-content`: ACF-backed, editable content for the global site header nav (labels, links, search copy, basket/login copy) exposed via the settings endpoint and consumed by `SiteHeader`.

### Modified Capabilities

(none — no existing spec covers header/settings content today)

## Impact

- Backend: new `includes/Infrastructure/Header_Fields.php`; `includes/Api/Controllers/Settings_Controller.php` (`get_settings()` response shape gains a `header` key — additive, non-breaking); wiring in `includes/Routes.php` to instantiate `Header_Fields` and hook `acf/init`.
- Frontend: `src/types/settings.ts` (additive `header?` field), `src/lib/services/settings.ts` (env-fallback defaults), `src/components/layout/header.tsx` (reads dynamic copy instead of hardcoded strings).
- No breaking changes to the `/settings` response consumers — `header` is a new optional key.
