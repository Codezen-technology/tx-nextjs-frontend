## Context

See `proposal.md` — Why. The relevant current state:

- `GET /lms-backend/v1/footer` (`Footer_Controller`) already returns the shape we need: a **nested** `nav` tree (top-level node = section, `items` = its links), `social`, `contact` (incl. `description`), and `compliance.badges` with image URLs already resolved by `Media_Path`. **No backend controller change is needed.**
- On the local WP site, the `footer-menu` location _is_ assigned — to a menu named `Footer Menu-> More` that has **0 items**. Hence `nav: []`.
- `src/components/layout/footer.tsx` is a server component. `buildNavColumns()` reads only top-level items, ignores `items`, and splits the flat list in half. Its `if (!nav)` fallback guard never fires for `[]`.
- `FooterData` in `src/types/settings.ts` omits `contact.description` and `compliance` entirely, so those fields are invisible to TypeScript even though the API sends them.
- `serverFetch` already unwraps the `{ success, data }` envelope; `serverApi.footer.get()` returns `FooterData` directly with `revalidate: 3600, tags: ["footer"]`.
- `next.config.mjs` already allow-lists the WP host and the S3 media host for `next/image`, so badge images need no config change.
- `trailingSlash` is not set (defaults to `false`), so a WP permalink like `/about-us/` costs an extra redirect hop.
- The per-brand seeding mechanism (`sites/<brand>/options/*.json`) applies **`wp_options` only**. Nav menus are taxonomy terms + posts and are not covered by it.

## Goals / Non-Goals

**Goals:**

- One rendering path for footer nav that is correct for the nested tree the backend actually sends, with a fallback that fires on any shape yielding zero links.
- Move footer brand copy (description, address, social, badges) out of the component and into backend-served data, following the same ADR-0008 "no content defaults in shared code" split the backend already applies.
- Make `buildNavColumns()` a pure, exported, unit-testable function — footer has no tests today.

**Non-Goals:**

- No change to `Footer_Controller` or the `/footer` response contract.
- No change to the header, mega menu, or the footer CTA band copy.
- No general WP-menu seeding tool. Footer menu items are populated by a documented WP-CLI runbook, not by a new mechanism.
- Not consuming `GET /menus/footer`. `/footer` already carries nav plus everything else the footer needs in one round trip.

## Decisions

### 1. Treat a top-level node with children as a section; without children, as a link

`build_nav_tree()` returns every top-level item with an `items` array (empty when it has no children). A WP footer menu is conventionally authored as heading-with-children, but a site could author a flat list. Rather than branch on a config flag, classify per node:

- node has ≥1 child → it is a **column header**, children are its links (the header is not itself a link, matching the live site where "Quick links" / "Support" are plain text)
- node has no children → it is a **standalone link**, grouped with adjacent standalone links into an unheaded column

_Alternative rejected:_ require nesting and treat a flat menu as misconfigured. That would silently blank the footer for exactly the authoring mistake most likely to happen, which is the bug we're fixing.

### 2. Fallback triggers on "zero renderable links", not on "nav is falsy"

The guard becomes: build columns from whatever the backend sent, then if the total link count across all columns is `0`, discard and use `FALLBACK_NAV_LINKS`. This covers `undefined`, `[]`, and a tree of empty sections with one rule instead of three special cases — and is the direct fix for the reported bug.

_Alternative rejected:_ `if (!nav || nav.length === 0)`. Misses the "sections present but all empty" case, which is what a half-authored menu looks like.

### 3. Keep the static fallback nav; delete the fake social fallback

These look symmetrical but are not. Fallback _nav_ links point at routes this app genuinely serves, so they degrade to a working footer. Fallback _social_ URLs (`facebook.com/trainingexcellence` et al.) are invented — the real accounts are `facebook.com/profile.php?id=61575661705840` and `linkedin.com/company/training-xcellence` — so they degrade to dead links that misrepresent the brand. Nav fallback stays; `FALLBACK_SOCIAL` is deleted and the whole "Follow us" row is omitted when nothing is configured.

The same reasoning deletes the hardcoded Ilkley address and the `Training Excellence` VAT/registration line: those are _wrong_, not merely stale. Address comes from `contact.address`; the company/registration line is corrected in the component (it is structural legal text for this deployment, not per-request content).

### 4. Normalise trailing slashes and route internal links through `<Link>`

`toFrontendPath()` already strips the backend origin. Add a trailing-slash strip on top (preserving `/`), then decide the element:

- internal (path starts with `/`) → `<Link href>` — client navigation, no full reload
- external, or item `target === "_blank"` → `<a target="_blank" rel="noopener noreferrer">`

`remapNavHref()` is kept — it is a cheap guard for legacy permalinks (`/contact`, `/policies`) — but is applied at column-build time so the rendered `href` is final and directly assertable in tests.

### 5. Populate the WP `footer-menu` with WP-CLI, and record it in the brand DEPLOY doc

Menu items are not `wp_options`, so `sites/tx/options/*.json` cannot carry them. Populate via `wp menu item add-post` / `add-custom` against the menu already assigned to `footer-menu`, and record the exact commands in `sites/tx/DEPLOY.md` so the state is reproducible per environment rather than hand-transcribed (the failure mode `sites/README.md` exists to prevent).

Content mirrors the live site: **Quick links** → About us, Write for us, Privacy Policy, Terms & Conditions; **Support** → Contact us.

Alongside it, seed the option-backed footer fields through the existing mechanism: `sites/tx/options/lms_social_links.json` (real Facebook + LinkedIn, `null` elsewhere), `lms_contact_address`, `lms_footer_description`.

_Alternative rejected:_ extend `apply-site-config.sh` to seed nav menus from JSON. Real value, wrong change — it is its own feature with its own idempotency problem (menus are terms, re-applying must not duplicate items), and it would block this fix behind it.

### 6. Extend `FooterData` rather than introduce a second type

Add `contact.description` and `compliance: { badges: { src, alt }[] }` to the existing interface, both optional, so existing call sites keep compiling and the untouched fields stay one source of truth.

## Risks / Trade-offs

- **Frontend fix lands before the menu is populated in every environment** → The zero-link fallback (Decision 2) means an unpopulated environment shows the static link list, which is strictly better than today's blank columns. Order of deployment does not matter.
- **`Write for us` / `Force for Good` / `Resources` may not exist as headless routes** → Any menu URL whose page is missing will 404 through the catch-all route, the same failure that got `/careers` removed from the fallback list. Verify each menu URL resolves before adding it (task in `tasks.md`), and keep the fallback list to routes known to exist.
- **Badge images are absolute WP/S3 URLs** → Hosts are already allow-listed in `next.config.mjs`; a brand later serving badges from a new CDN host must add it there. `alt` is author-supplied and may be empty — render `alt=""` so a decorative badge does not become an unlabelled image.
- **Footer response is cached for 1 hour (`revalidate: 3600`)** → Menu edits in wp-admin take up to an hour to appear unless the `footer` cache tag is revalidated. Acceptable for footer nav; flagged so nobody debugs a "menu didn't update" ghost.
- **Correcting the company/registration line is a legal-text change** → Values are taken from the live production site rather than invented; called out explicitly in `tasks.md` for sign-off rather than slipped in as a refactor.

## Open Questions

- The live CTA band reads "Power up your skills for a better career!" while the frontend reads "Training That Works for Your Team". Deliberately out of scope here; needs a content owner's decision on which is current.
- Whether TX currently holds accreditation badges to display at all. If `lms_footer_badges` stays unset the badge block simply never renders, so this does not block the change.
