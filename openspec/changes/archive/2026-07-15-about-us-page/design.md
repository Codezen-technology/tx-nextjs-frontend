## Context

Figma "About US" (node `649:22654`, fileKey `VoTEBKr8x4fWlObjkr7RXg`, 1920×5228) is a full page composed of, top to bottom: `Header` (global — already built), `Breadcrumb` ("Home > About us", static navy bar), `Trusted` (icon+label trust strip), `Header section` (hero: eyebrow/H1/subtext/2 buttons), `Features section` (white, "Our Commitment to Excellence" + 3 alternating image/text/checklist blocks — "What We Offer?", "Why Train with Us?", "Train Your Workforce with Confidence"), a second `Features section` (grey `#F9FAFB`, "Our values" + 6-card icon/title/description grid), `Team section` ("Join our team" / "We're just getting started" + 2 buttons + a 5-photo collage), `Footer` (global — already built).

The live `/about` page today is hand-written, hardcoded JSX with different copy, different section count, and an extra "Our journey" stats block that has no Figma counterpart. It has no backend content source at all.

The backend already has two conventions for page-bound ACF content — `Homepage_Fields` (front-page-bound, controller supplies hardcoded fallback when ACF is empty) and `Contact_Fields` (slug-page-bound via `ensure_page()`, ACF fields default to empty string with no `default_value` set, relying on an admin to fill them in). Neither is exactly what's wanted here: the requirement is Figma-derived defaults **out of the box**, on a dedicated page, without a human editing wp-admin first.

Separately, the Figma "Trusted" strip (star / wifi / medal / money-back icon+label row) is pixel-for-pixel the same shape as the **already-shipped** `Topbar` component (`src/components/home/topbar.tsx`), which is already ACF-driven (`Homepage_Fields::get_topbar()` → `lms_home_topbar` repeater) and already reused on both the homepage and `/pricing`. Figma's own use of an "instance" (not a one-off drawing) for this element on the About page confirms it's meant to be the same reusable global component, not a per-page fork.

## Goals / Non-Goals

**Goals:**

- Rebuild `/about` to match the Figma structure and copy exactly, section-for-section.
- Make every text field admin-editable via ACF, defaulting to the literal Figma copy with zero setup, from one canonical PHP array (see Decision 1 for how this is actually achieved — plan changed during implementation).
- Auto-create the `about-us` WP page on plugin load if it doesn't exist, exactly like `Contact_Fields::ensure_page()`.
- Reuse the existing `Topbar` component/data for the trusted strip instead of building a parallel one.

**Non-Goals:**

- No new image-upload/cropping UI. The 3 commitment-block photos and 5 team-collage photos are left as empty-by-default ACF fields; rendering a real uploaded image is in scope (the `<img>` tag exists), but no default asset is shipped or committed.
- No per-team-member name/role captions — the Figma team section is a decorative photo collage with no visible text per photo; this change does not add a "team roster" content type.
- No changes to `Topbar`/`Homepage_Fields`/`Homepage_Controller` — the About page only becomes a second consumer of the existing `/home/topbar` data.
- No `about-us` menu/nav wiring beyond what already exists (the header's "About us" link already points at `/about`).

## Decisions

**1. `defaults()` is the single canonical PHP array; it is both the ACF `default_value` source and is seeded as real saved values once, on `acf/init`.**
Originally planned as "ACF `default_value` alone, no PHP fallback array" — **revised during implementation** after live testing against this plugin's ACF Pro install showed `get_field('hero', $pid)` (by field _name_) returns `null` for `group`/`repeater` fields that have never been explicitly saved, even though the field definition's `default_value` is fully populated and correctly resolves when read by field _key_. Relying on `default_value` alone silently failed the "fresh install renders full Figma copy" requirement — verified failure: a clean site returned empty strings for every field. Fix: `About_Fields::defaults()` is the one canonical array; `fields()` reads from it to populate each field's ACF `default_value` (so wp-admin still shows sensible values in the UI), and `seed_defaults_on_init()` writes that same array as real ACF values via `update_field()` — using field **keys**, not names, which also proved more reliable — once per page, guarded by a `_lms_about_seeded` postmeta flag. This must run on the `acf/init` hook, not at `plugins_loaded` time inside `ensure_page()`: calling `update_field()` before ACF's own bootstrap (and WP's rewrite/post-type machinery on the `init` action) has completed triggers a fatal error. Net effect: still one source of truth in code, but "no separate hardcoded array" turned out to not be achievable given ACF's actual runtime behavior for nested field types.

**2. Page-bound field group (`Contact_Fields` pattern), not an Options Page.**
Unlike header content (global, page-independent — see `header-acf-content`), About page content is inherently one page's content. Binding the field group to the `about-us` Page via `ensure_page()` + `location: page == <id>` is the right fit and matches `Contact_Fields` exactly.

**3. Reuse `Topbar` + `/home/topbar` for the Trusted strip — do not fork new fields.**
Alternatives considered: a per-page `about_trusted` ACF field mirroring the About page's specific Figma copy ("Trusted by Over 3 Million Learners", "24/7 Access to Online Training", "Fully Accredited Courses", "Money-Back Guarantee"). Rejected: `Topbar` is already an ACF-driven, cross-page-reused component (home + pricing today). Figma modeling this element as a reusable _instance_ rather than a one-off frame supports treating it the same way in code — one trust bar, edited once, shown everywhere. The Figma mockup's specific wording is a placeholder for whatever the shared topbar currently says, not a mandate for page-specific copy.

**4. Repeatable content (check-items, values grid, team photos) uses ACF `repeater`, following `Contact_Fields`'s `cards` repeater pattern** — not the `Homepage_Fields`-style newline-delimited textarea (`lines()` helper). A repeater gives each row real structure (e.g. values need icon+title+description per row, not just a string), and keeps this change's newest infrastructure code consistent with the more structured of the two existing conventions.

**5. Icons (offer/why/workforce feature icons, 6 values-grid icons) are a `select` field of icon keys, not an image upload.**
The Figma icons are simple line-icon glyphs (message-chat-circle, zap, chart-breakout-square, message-smile-circle, command, message-heart-circle) with direct `lucide-react` equivalents already used elsewhere in this codebase (the current hand-written About page already imports `Lightbulb`, `Award`, `Medal`, etc. from `lucide-react` for this exact purpose). A `select` field (icon key → frontend icon-map lookup) avoids depending on Figma's expiring asset URLs for decorative UI iconography, matching the `figma-design-to-code` guidance to only pull real exported assets for genuine imagery, not to hand-author SVGs — here the "authored" version is a pre-existing, already-approved lucide icon, not a hand-drawn SVG.

**6. `about/page.tsx` becomes a Server Component reading from `serverApi`, tagged for revalidation** — matching the project convention (`CLAUDE.md`: Server Components use `serverApi`/`serverFetch`, tag every fetch for `revalidateTag()`), replacing the current fully-static hardcoded page.

## Risks / Trade-offs

- [`about-us` page could already exist with unrelated content on some environment] → `ensure_page()` only creates the page when absent (checked by `get_page_by_path`), exactly like `Contact_Fields`; an existing page is never overwritten, only gains a field group.
- [Removing the "Our journey" stats section is a content loss for anyone relying on it] → It has no Figma counterpart and the proposal explicitly calls this out as an intentional removal to match the design; flagged as **BREAKING (content)** in proposal.md rather than silently dropped.
- [Icon `select` field requires the frontend icon-map to already contain a matching lucide icon for every choice] → All 6 Figma icon glyphs used here already have direct, already-imported lucide equivalents in the current About page code; no new icon dependency introduced.
- [Team collage images left empty by default means the Team section may look sparse until an admin uploads all 5] → Acceptable per explicit instruction; frontend renders a neutral placeholder (matching the existing `SectionImage`-style gradient block pattern) for any unset photo slot rather than a broken `<img>`.
- [Seeding runs `update_field()` once per page via a postmeta flag, so a manually-cleared field group would not be re-seeded] → Acceptable: matches how every other `*_Fields` class in this codebase behaves (an admin clearing a field is treated as an intentional edit, not a request to reset to defaults). If a full reset is ever needed, deleting the `_lms_about_seeded` postmeta re-triggers seeding on the next `acf/init`.

## Migration Plan

1. Ship `About_Fields.php` + `About_Controller.php` + Routes/bootstrap wiring. Additive-only; creates the `about-us` page and its field group on first `acf/init` if missing, touches nothing else.
2. Ship the rewritten `about/page.tsx` and new `src/components/about/*` components. This replaces the current page's output — deploy both backend and frontend together (or frontend can ship first behind its own fallback-to-Figma-defaults-on-fetch-failure, since the frontend defaults already match the ACF defaults byte-for-byte).
3. Rollback: a normal revert of both changes; no data migrated, no destructive step.

## Open Questions

- Exact destination for the Team section's "Read our principles" / "We're hiring!" buttons is unspecified by the design (no linked page in Figma). Defaulting hrefs to `/about#values` and `/contact-us?enquiry=careers` respectively as a placeholder editors can override in wp-admin — flag to product for a real careers-page URL if one exists.
