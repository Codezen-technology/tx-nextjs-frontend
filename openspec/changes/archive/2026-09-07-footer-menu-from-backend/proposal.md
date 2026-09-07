## Why

The site footer is supposed to render its navigation from the WordPress `footer-menu` location via `GET /lms-backend/v1/footer`, but today it renders **no links at all**. The backend returns `nav: []` (menu assigned but empty), and the frontend's `buildNavColumns()` treats an empty array as "data present", so its hardcoded fallback never fires and both nav columns render blank.

On top of that, the frontend ignores the nested shape the backend actually sends (top-level items are column _headers_, their `items` are the links), hardcodes brand copy the backend already serves (`contact.description`), and prints legally wrong company details in the bottom bar — the live site says `© EXCELLENT TRAINING GROUP LTD, Registered in England and Wales: 16275537` while the frontend prints `Training Excellence … VAT Reg. No: 923 6593 07 … 6428976`.

## What Changes

- **Consume the backend nav tree correctly.** Top-level `WpNavItem`s become footer column headers; their nested `items` become the links in that column. Today the code flattens top-level items and splits them in half, which produces the wrong columns for any real menu.
- **Fix the empty-nav fallback.** An empty `nav: []` (or a tree whose sections contain no links) must fall back to the static route list, not render two empty columns.
- **Populate the `footer-menu` in WordPress** to match the live site: a `Quick links` section (About us, Write for us, Privacy Policy, Terms & Conditions) and a `Support` section (Contact us). This is the content side of "get it from the backend" — without it the endpoint keeps returning `[]`.
- **Render backend-served footer content that is currently ignored:** `contact.description` (brand blurb, today hardcoded in the component) and `compliance.badges` (accreditation images, today dropped entirely). Add both to the `FooterData` type, which is missing them.
- **Correct the bottom-bar company details** to match the live site, and source the address from `contact.address` rather than a stale hardcoded Ilkley address.
- **Drop the fake social fallback.** `FALLBACK_SOCIAL` invents URLs (`facebook.com/trainingexcellence`, `x.com/trainingexcellence`, …) that do not exist — the real accounts are `facebook.com/profile.php?id=61575661705840` and `linkedin.com/company/training-xcellence`. Unconfigured social links must render nothing rather than dead links.
- **Use `<Link>` instead of `<a>` for internal footer nav** so links client-navigate instead of triggering a full page reload.
- Handle `target="_blank"` / external nav items from the menu (`toFrontendPath` already returns external URLs unchanged; the component currently renders them as if internal).

Not in scope: the header/mega menu, and the footer CTA band copy (differs from live but is a separate content decision).

## Capabilities

### New Capabilities

- `footer-navigation`: How the site footer sources its navigation columns, social links, contact details, brand blurb and accreditation badges from the backend `/footer` endpoint, and how it degrades when that data is absent or empty.

### Modified Capabilities

None — no existing spec in `openspec/specs/` covers the footer.

## Impact

**Frontend (`tx-headless-frontend`)**

- `src/components/layout/footer.tsx` — `buildNavColumns()`, fallback handling, nav rendering, social fallback, description, badges, bottom bar
- `src/types/settings.ts` — `FooterData` gains `contact.description` and `compliance.badges`
- New unit tests for `buildNavColumns()` (no footer tests exist today)

**Backend / content (`wp-lms-backend-rest-api`)**

- The `Footer Menu-> More` menu assigned to the `footer-menu` location is empty and needs its items created (content change, not code). `Footer_Controller` already returns the nested tree correctly — no controller change expected.

**Behaviour**

- No API contract break. `GET /lms-backend/v1/footer` response shape is unchanged; the frontend starts reading two fields it previously discarded.
