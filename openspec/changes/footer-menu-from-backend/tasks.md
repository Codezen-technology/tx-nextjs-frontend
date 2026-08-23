## 1. Types

- [x] 1.1 Add `description?: string | null` to `FooterData["contact"]` in `src/types/settings.ts`
- [x] 1.2 Add `compliance?: { badges: FooterBadge[] }` to `FooterData`, with `export interface FooterBadge { src: string; alt?: string | null }`
- [x] 1.3 Run `pnpm typecheck` — confirm no existing call site breaks (both fields optional)

## 2. Nav column building (the reported bug)

- [x] 2.1 Extract and export `buildNavColumns()` from `footer.tsx` into a pure module (e.g. `src/lib/utils/footer-nav.ts`) so it is unit-testable without rendering a server component
- [x] 2.2 Rewrite the nested-tree branch: a top-level `WpNavItem` with ≥1 child becomes a column whose `header` is its title and whose links are its children; a top-level item with no children becomes a standalone link (design decision 1)
- [x] 2.3 Group consecutive standalone links into unheaded columns so a flat menu still renders as columns rather than one long list
- [x] 2.4 Replace the `if (!nav)` guard with a zero-renderable-links check: build columns first, then fall back to `FALLBACK_NAV_LINKS` when the total link count across all columns is `0` (covers `undefined`, `[]`, and all-empty sections — design decision 2)
- [x] 2.5 Apply `toFrontendPath()` → trailing-slash strip (preserving bare `/`) → `remapNavHref()` at column-build time so each column's `href` is final
- [x] 2.6 Carry each item's `target` through to the built column links so the renderer can decide `<Link>` vs new-tab `<a>`
- [x] 2.7 Preserve `menu_order` ordering for both columns and the links inside them

## 3. Footer rendering

- [x] 3.1 Render internal footer nav links with `<Link>` instead of `<a>`; render external links or `target === "_blank"` items as `<a target="_blank" rel="noopener noreferrer">`
- [x] 3.2 Use a key that cannot collide when the same href appears twice (e.g. item id, or `${colIndex}-${href}`)
- [x] 3.3 Delete `FALLBACK_SOCIAL`; render the "Follow us" row only when at least one social link is configured
- [x] 3.4 Render `contact.description` as the brand blurb; delete the hardcoded blurb paragraph
- [x] 3.5 Render `contact.address` beside the brand blurb in the left column (not the bottom bar — the bottom bar is now legal text only, and the address reads as contact info next to the logo); delete the hardcoded `Riverside Business Park, Dansk Way, Ilkley…` fallback, and omit the address when unset
- [x] 3.6 Render `compliance.badges` as `next/image` badges in the Certificate Validator column; render nothing (no container) when the list is empty; use `alt={badge.alt ?? ""}`
- [x] 3.7 Correct the bottom-bar legal line to `© <year> EXCELLENT TRAINING GROUP LTD. Registered in England and Wales: 16275537`; remove `VAT Reg. No: 923 6593 07` and `6428976` — **flag this line for sign-off, it is legal text** (design risk 5)
- [x] 3.8 Confirm the contact block still omits `tel:`/`mailto:` links entirely when phone/email are `null`

## 4. Frontend tests

- [x] 4.1 New test file for `buildNavColumns()` — nested menu (Quick links + Support) produces two headed columns with the right links in menu order
- [x] 4.2 Test `nav: []` → fallback columns, and assert no empty/header-only column is produced
- [x] 4.3 Test `nav: undefined` (endpoint failed) → fallback columns
- [x] 4.4 Test tree of sections with empty `items` → fallback columns
- [x] 4.5 Test flat menu (top-level items, no children) → links rendered, not empty headed columns
- [x] 4.6 Test href normalisation: WP absolute permalink → root-relative path, trailing slash stripped, `/contact` → `/contact-us` remap applied
- [x] 4.7 Run `pnpm test` and `pnpm lint`

## 5. Backend content — WP `footer-menu`

- [x] 5.1 Confirm which menu is assigned to the `footer-menu` location (currently `Footer Menu-> More`, 0 items) and whether to populate it or assign a new one
- [x] 5.2 Verify each intended target page exists as a headless route before adding it: `/about-us`, `/write-for-us`, `/privacy-policy`, `/terms-and-conditions`, `/contact-us` — drop or fix any that 404 (design risk 2)
- [x] 5.3 Populate the menu with WP-CLI: parent `Quick links` (children: About us, Write for us, Privacy Policy, Terms & Conditions) and parent `Support` (child: Contact us)
- [x] 5.4 Record the exact WP-CLI commands in `sites/tx/DEPLOY.md` so the menu is reproducible per environment (design decision 5)
- [x] 5.5 Verify `GET /lms-backend/v1/footer` now returns a two-section nested `nav` tree

## 6. Backend content — option-backed footer fields

- [x] 6.1 Add `sites/tx/options/lms_social_links.json` with the real accounts only — `facebook: https://www.facebook.com/profile.php?id=61575661705840`, `linkedin: https://www.linkedin.com/company/training-xcellence/`, `null` for the rest — and correct the existing wrong values in the local DB
- [x] 6.2 Add `sites/tx/options/lms_contact_address.json` with the live address: `Suite A, 82 James Carter Road, Mildenhall, Bury Saint Edmunds, IP28 7DE, United Kingdom`
- [x] 6.3 Add `sites/tx/options/lms_footer_description.json` with the live brand blurb
- [x] 6.4 Confirm `sites/README.md` conventions are followed (filename = exact option name; no `_comment` key on array-shaped files)
- [x] 6.5 Re-run the local site config apply and re-check the `/footer` response

## 7. Verification

- [x] 7.1 Run the dev server and compare the rendered footer against `https://trainingexcellence.org.uk/` — nav columns, headers, social icons, address, blurb, legal line
- [x] 7.2 Confirm footer nav links client-navigate (no full page reload) and none 404
- [x] 7.3 Temporarily point at an environment with an empty `footer-menu` (or stub the response) and confirm the static fallback renders
- [x] 7.4 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`
- [x] 7.5 Note in the PR that `/footer` is cached for 1 hour (`revalidate: 3600`), so menu edits need a `footer` tag revalidation to appear immediately (design risk 4)
