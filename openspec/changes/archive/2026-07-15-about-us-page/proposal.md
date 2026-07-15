## Why

The live `/about` page (`src/app/[locale]/(marketing)/about/page.tsx`) exists but its copy, structure, and section order don't match the Figma "About US" design (node `649:22654`), and every string is hardcoded in JSX — no admin can edit it without a code deploy. Per the migration rules (Figma is the design source of truth for this rebuild), the page needs to be rebuilt to match the design exactly, with its content moved to ACF fields (bound to a `about-us` WP page, auto-created if missing) seeded with the exact Figma copy as defaults — mirroring how `contact-us` and the homepage already work.

## What Changes

- **BREAKING (content)**: Replace the current About page section structure with the Figma-matched structure: Breadcrumb bar → Trusted strip → Hero → 3 alternating image/text "commitment" blocks → 6-card values grid → Team section. The current page's closing "Our journey" stats section (3M+ learners, 100% online, etc.) is not part of the Figma design and is removed.
- Add `includes/Infrastructure/About_Fields.php` (backend): ACF field group bound to the WP Page with slug `about-us` (auto-created if missing, mirroring `Contact_Fields`'s `ensure_page()` pattern). Every text field's ACF `default_value` is set to the literal Figma copy, so a fresh install renders the full design with zero admin setup.
- Add `includes/Api/Controllers/About_Controller.php` exposing `GET /lms-backend/v1/about/page`, returning the page's hero, three commitment blocks (heading/text/check-items/image), values grid (6 cards), and team section content.
- Reuse the **existing** `Topbar` component + `/lms-backend/v1/home/topbar` data for the "Trusted" strip section — it is already ACF-editable and already shared across the homepage and pricing page; no new backend work needed for it.
- Photographic image fields (3 commitment-block images, 5 team-collage photos) are ACF fields with **no default value** — left empty per the request; the frontend keeps a placeholder in their place until an admin uploads one, matching how the page already degrades today.
- Rewrite `src/app/[locale]/(marketing)/about/page.tsx` to fetch `/about/page` server-side (`serverApi`, tagged for `revalidateTag`) and render the new section structure, falling back to the Figma-derived defaults if the fetch fails.

## Capabilities

### New Capabilities

- `about-us-page-content`: ACF-backed content for the `/about` page (hero, three commitment blocks, values grid, team section), auto-created `about-us` WP page, and the `GET /about/page` endpoint, defaulting to the exact Figma design copy.

### Modified Capabilities

(none — no existing spec covers the About page today; this only touches implementation, not a previously specified capability)

## Impact

- Backend: new `includes/Infrastructure/About_Fields.php`, new `includes/Api/Controllers/About_Controller.php`; wiring in `includes/Routes.php` (controller) and `lms-backend-rest-api.php` (Fields `init()` + `ensure_page()`, mirroring the existing `Contact_Fields` bootstrap lines).
- Frontend: full rewrite of `src/app/[locale]/(marketing)/about/page.tsx`; new presentational components under `src/components/about/` for the commitment blocks, values grid, and team section; reuse of the existing `Topbar` component for the trusted strip.
- No breaking API changes to other endpoints. `GET /about/page` is a new route.
- SEO: `generateMetadata`/`generateStaticParams` on the page stay in place per `SEO.md`; canonical path (`/about`) is unchanged.
