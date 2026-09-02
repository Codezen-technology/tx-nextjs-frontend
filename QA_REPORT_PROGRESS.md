# QA Report — Implementation Checklist

**Plan:** `.context/attachments/s3tv8L/QA_REPORT_PLAN.md`
**Branch:** `qa-report-progress-tracker` (target `origin/qa-report-execution-plan`)
**Last updated:** 2026-08-08

Legend: `[x]` done and verified · `[ ]` outstanding · `[-]` deliberately out of round 1 · `[!]` blocked, not startable

**Progress: 24 / 63 actionable items done.** Everything that could ship without a
design ruling has shipped; the rest is gated on §6 and §7.

---

## 0. Verification gates

- [x] `pnpm typecheck` — clean
- [x] `pnpm lint` — 0 errors (44 pre-existing warnings, none in changed files)
- [x] `pnpm test` — 469/469 pass across 37 files
- [x] `npx playwright test e2e/qa-round-1.spec.ts` — 19 passed / 2 skipped, all three viewports
- [x] Pre-existing E2E failures confirmed unrelated — baseline (stashed tree) fails 5: `smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`

---

## 1. Infrastructure — plan §3.4

- [x] Add `desktop-1920` project (1920×1080) to `playwright.config.ts`
- [x] Add `mobile-440` project (440×956, `isMobile`, `hasTouch`, DPR 3)
- [x] Keep `chromium` (1280×720) as default so existing specs and `--project=chromium` still work

All three widths from the QA pass are now testable. Phase 2's verification column is meaningful.

---

## 2. Class B — functional bugs (6 / 6)

- [x] **QA-HOME-B1** — quantity increases, amount does not
  - [x] New `src/lib/utils/price.ts` — `parseDisplayPrice`, `scaleDisplayPrice`, `planLineTotal`
  - [x] `QuantitySelector` shows the line total, not the unit price
  - [x] Struck-through original price scales too
  - [x] Handles both API shapes — prod `"£29"` + `product: null`, local numeric `product.price`
  - [x] Tests: `price.test.ts` (14), `quantity-selector.test.tsx` (5), E2E ×3 widths
- [x] **QA-COURSE-B2** — buy CTA bypassed the cart
  - [x] `course-purchase-card.tsx` → `router.push("/cart")`
  - [x] Updated `course-purchase-card.test.tsx` to assert `/cart`
  - [x] E2E ×3 widths
- [x] **QA-BLOGS-B3** — ToC anchors did not scroll to the clicked heading
  - [x] Explicit smooth scroll with 96px sticky-header clearance in `blog-post-sidebar.tsx`
  - [x] `href` kept, so the link stays shareable and works without JS
  - [x] `scroll-mt-24` on `prose-wp` headings for direct `#id` URLs
  - [x] Tests: `blog-post-sidebar.test.tsx` (5), E2E ×3 widths
- [x] **QA-HOME-B4** — navbar dropdown opened on click, should open on hover
  - [x] `useHoverIntent` hook in `header.tsx`, 150ms close delay
  - [x] Applied to the Resources dropdown
  - [x] Applied to the mega menu — handlers passed into `MegaMenu`, not a wrapper
  - [x] Click and keyboard still work (touch / screen readers)
  - [x] Dropdown panel flush against its trigger (dropped `mt-1`) so the pointer crosses no dead gap
  - [x] E2E ×2 desktop widths
- [x] **QA-HOME-B5** — certificate and transcript not rendering (see §4)
- [x] **QA-BLOG-B6** — blog card month names overflow
  - [x] `formatCardDate()` in `format.ts` — fixed three-letter months
  - [x] Applied to `blog-card.tsx` and `trending-carousel.tsx`
  - [x] Date set `whitespace-nowrap`, category `truncate`
  - [x] Tests: `format.test.ts` (3), E2E ×3 widths

> Fixed table rather than `month: "short"`: ICU's en-GB short form for September
> is `"Sept"` — four characters, which reintroduces the ragged meta line.

---

## 3. Class A — CSS / token fixes (3 / ~30)

Only the items whose target the doc states outright, so they do not depend on the
unresolved Figma nodes.

- [x] **QA-PRIVACY-A1 / QA-COURSE-A1** — body copy line-height 150% (`prose-wp p`: `leading-relaxed` 162.5% → `leading-normal`)
- [x] **QA-BLOG-A1** — 80px between the final CTA and the footer (`pb-20` **on** `BlogTeamCta`; the earlier `pb-20` _wrapper_ stacked on the section's own `lg:py-16` and shipped 144)
- [x] **QA-BLOGS-A2** — headings landed under the sticky header (`scroll-mt-24`, ships with B3)

### Reopened 2026-09-02 — rows that read FIXED but were not

- [x] **QA-BLOG-D2** — blog hero was a flat `bg-neutral-900`, not the frame's navy→teal gradient (`4900:75794`). `neutral-900` _is_ the gradient's first stop, which is how a sampled screenshot passed the 2026-08-24 re-verdict. Now `HERO_GRADIENT`.
- [x] **QA-BLOG-C2** — the trending panel stretched to 1.9 against the frame's 636x400, so `object-cover` cropped every trending image. Ratio pinned; two-column split moved `md`→`lg`.
- [x] **QA-BLOG-A1** — see above: measured 144px under the CTA card, not 80.
- [x] **QA-BLOGS-A3** — `postCategory.name` rendered raw, so `&amp;` reached the page. The old assertion compared it to WP's equally-encoded `name`, so it passed on a broken page.
- [x] **QA-BLOGS-D1** — mobile ToC drawer built (`BlogTocDrawer`); it was never started.

Still open, needs a design ruling, unchanged: **QA-BLOGS-A6** — the report asks
for H2 32px, frame `6015:127252` measures SUSE Bold **20**. The build ships 20.

Already correct on `main` — mark `FIXED` in the tracker, do not rework:

- [x] **QA-VERIFY-A1** — Verify Certificate field already white bg + subtle border (`certificate-form.tsx:43`)
- [x] **QA-COURSES-A1** — filter checkboxes already white + border unselected, `bg-secondary-500` selected (`course-category-filter.tsx:47`)

Outstanding (~27) — all gated on §6:

- [ ] Hero top/bottom spacing 80–100px (multiple pages)
- [ ] Mobile section spacing 40px
- [ ] Laptop side padding 128px — Single Blog, Category
- [ ] Dropdown right padding 16px — Checkout, Priority Support
- [ ] Section header weight and Title Case
- [ ] Card title colour stable on hover
- [ ] Related-course section title sizing
- [ ] Cart card content parity with Figma
- [ ] Remainder of the ~30 in plan §4

---

## 4. Class C — missing images (2 / ~8)

- [x] **QA-HOME-C1 / C2** — certificate and transcript
  - [x] Root cause 1, component bug: `className="h-auto w-auto"` on `next/image`. `width: auto`
        resolves against intrinsic size, so a source that fails to decode collapses the
        element to **0×0** and the section renders as an empty 104×80 padding box.
        Measured before: `w:0 h:0 cssW:"0px" natW:0` → after: `w:280 h:218 natW:384`.
        Independent of `src` — this is why the section looked broken even with a live image.
  - [x] Root cause 2, content gap: prod returns `/images/certificate/certificate-frame.png`
        and `/transcript.png`, both **404**. Falls back to the bundled `hero-certificate.jpg` /
        `hero-transcript.jpg`.
  - [x] New `src/components/ui/fallback-image.tsx` — dead `src` → fallback, or nothing at all
  - [x] E2E asserts the image resolves (`naturalWidth > 0`) and occupies a non-zero box, ×3 widths
- [x] **QA-HOME-C3** — team collaboration photos: degrade to absent instead of empty boxes
  - [ ] `CONTENT-GAP` handed off — prod returns `/images/team/collaboration-{1,2,3}.jpg`,
        all 404, `public/images/team/` does not exist. Needs the real assets or corrected CMS paths.

Triaged and closed — measured on the deployed frontend at 1280 and 440 (plan §3.3, change `qa-round-1-remainder`):

- [x] **About Us ×2** — `CONTENT-GAP`. Prod `/about/page` returns `image: null` on all three
      commitment blocks and `photos: null` for the team. The page renders 7 images, 0 broken,
      0 collapsed, 32 placeholder SVGs. Now also routed through `FallbackImage`, so a field
      that holds a _dead URL_ degrades to the placeholder too, not just an unset one.
- [x] **Category "Why Choose Us" — desktop** — `CANT-REPRODUCE`. 14 images, 0 broken, 0 collapsed.
- [x] **Category "Why Choose Us" — mobile** — `CANT-REPRODUCE`. Identical result at 440.
      Answers the design open question: one issue, not two.
- [x] **Blog hero** — `RECLASSIFIED → Class D`. `blog-hero.tsx` renders a CSS radial-gradient
      and no `<img>` at all. Matches the existing Class D item "Blog and All Courses — hero
      gradient and bottom pattern". Never was a Class C failure.
- [x] **Single Blog hero** — `CANT-REPRODUCE`. Hero renders 572×322 (nat 682) at 1280,
      400×230 (nat 440) at 440.
- [x] **Single Course** — `CANT-REPRODUCE`. 14 zero-box images at 440, all inside
      `hidden … lg:block` / `lg:flex` wrappers. The page renders desktop and mobile copies of
      the purchase card; the inactive copy legitimately measures 0×0. The visible mobile card
      is 408×392.
- [x] **Swept the codebase for the `w-auto`/`h-auto` collapse** — see §4a.

**No Class C component bugs remain.** The only one in the report was the homepage collapse,
fixed in round 1.

## 4a. Collapse-pattern sweep

- [x] `home/accreditations.tsx` — had the same both-axes-auto collapse (`h-auto max-h-20 w-auto`),
      never reported by QA. Now `max-h-20 w-20`.
- [x] CMS-sourced logos given a `min-w` floor so a failed load reserves its slot instead of
      collapsing to zero width: `trusted-orgs.tsx`, `layout/footer.tsx`, `layout/minimal-header.tsx`,
      `layout/header.tsx` (site logo from settings), `blocks/block-renderer.tsx`.
- [x] Re-grepped: no `next/image` in the codebase now sets both `w-auto` and `h-auto`.

## 4b. Shared mechanism

- [x] `FallbackImage` resolution order is now explicit: `src` → `fallbackSrc` → `fallback` node → nothing.
      Each source is tried once, so a fallback that also fails degrades to absent instead of looping.
- [x] `src/__tests__/fallback-image.test.tsx` — 13 tests covering every spec scenario.
- [x] E2E helper `assertImagesRender` asserts decode **and** box independently, and skips images
      with a hidden ancestor — without that, Single Course alone reports 14 false positives.
- [x] Mutation-tested: reintroducing a dead source with `w-auto` fails the suite in 3.3s with
      `zero-width box: <url>`. Ordering the box check before `toBeVisible()` was required —
      Playwright blocks on a zero-size element, which turned the same failure into a 90s timeout.

## 5. Class D — net-new builds (0 / 8)

Out of round 1 by design (plan §7). Each becomes its own OpenSpec change.

- [-] Team Training page — does not exist at all, no Figma link
- [-] All Courses mobile — "huge mobile responsive issues", unbounded, needs sizing
- [-] Pricing — third pricing card ⚠️ **prod already returns 3 plans** — may be a render issue, not a build
- [-] Checkout — section present in Figma, absent in build
- [-] Category — FAQ section under the courses
- [-] Blog hero gradient + bottom pattern
- [-] All Courses hero gradient + bottom pattern
- [-] Single Blog mobile — sticky bottom ToC as a floating drawer (`4146:87332`)

---

## 6. Class E — blocked on a human decision (0 / 7)

Nothing guessed. Code untouched for all seven. Tracker rows carry `BLOCKED-DESIGN`.

- [!] 1 — Homepage search button: "shape and color needs to be fixed", no target given
- [!] 2 — Homepage section spacing: "took too much space… more standard and middle align", no target
- [!] 3 — Pricing, same bg colours: which two sections move where
- [!] 4 — Pricing, "remove this section": product call, not design — routed separately
- [!] 5 — Cart mobile: doc offers two options and picks neither
- [!] 6 — FAQ/Help hero: `Solution(Dev):` blank
- [!] 7 — Single Course mobile "Rating": `Solution(Dev):` blank

### 6 divergent Figma node pairs (plan §2.3) — Class A cannot proceed until resolved

- [!] Homepage — `4571:10560` (1920×7150) vs `6013:89909` (1920×7055)
- [!] Blog — `4900:75788` vs `6015:127034`
- [!] Blog single — `4040:11134` vs `6015:127141`
- [!] All Courses — `3306:50109` vs `6015:96163` (v2)
- [!] Category — `3294:42427` vs `6015:108699`
- [!] About Us — `6239:102399` vs `6015:129608` (the one pair where the doc links the _newer_ node)

No valid design reference at all (plan §2.4): Cancellations, Priority Support, Privacy Policy.

---

## 7. Phase 1 housekeeping

- [ ] Archive `openspec/changes/fix-seo-metadata-defects` (41/43, merged into `main`, not archived — plan §3.6)
- [ ] Rebase onto `main`, cut `fix/qa-report-round-1`
- [ ] Build the verbatim 80-row grid in `.context/qa-tracker.md` from the source doc (actionable rows already captured)
- [ ] Add `test-results/` to `.gitignore` — it is committed, so every Playwright run dirties the tree
- [ ] Delete `src/components/courses/course-info-card.tsx` — 235 lines, 0 importers, holds a second `/checkout?course=` CTA that would reintroduce QA-COURSE-B2

---

## 8. Corrections to the plan, found during triage

- [x] **Plan §3.1 names the wrong host.** `backend.trainingexcellence.org.uk` serves the
      Next.js frontend — every `/wp-json/*` there 404s. WordPress is `https://trainingexcellence.org.uk`.
      Anyone re-running the §3.1 checks needs this.
- [x] **Prod and local return different pricing shapes.** Prod: 3 plans, `product: null`,
      price strings like `"£29"`. Local: 2 plans, full WooCommerce objects, `"£49.00"`.
      Any pricing work must handle both — this is why `planLineTotal` takes the display
      string _and_ the numeric price.
- [x] **Some Class A items are already fixed on `main`** (plan §3.1 predicted this) — see §3.

---

## 9. Files

**New**

- [x] `src/lib/utils/price.ts` — display-price parsing / scaling
- [x] `src/components/ui/fallback-image.tsx` — `next/image` that survives a dead `src`
- [x] `src/__tests__/price.test.ts` — 14 tests
- [x] `src/__tests__/quantity-selector.test.tsx` — 5 tests
- [x] `src/__tests__/blog-post-sidebar.test.tsx` — 5 tests
- [x] `e2e/qa-round-1.spec.ts` — 7 tests × 3 viewports

**Modified**

- [x] `playwright.config.ts` — 1920 / 1280 / 440 projects
- [x] `src/lib/utils/format.ts` — `formatCardDate()`
- [x] `src/app/globals.css` — `prose-wp` 150% leading, heading `scroll-mt`
- [x] `src/components/home/quantity-selector.tsx` — line total tracks quantity
- [x] `src/components/home/blog-card.tsx` — short-form date, non-wrapping meta
- [x] `src/components/home/trending-carousel.tsx` — short-form date
- [x] `src/components/home/cpd-certificate.tsx` — sized box + fallback images
- [x] `src/components/home/transform-team.tsx` — fallback images
- [x] `src/components/courses/course-purchase-card.tsx` — CTA → `/cart`
- [x] `src/components/blog/blog-post-sidebar.tsx` — ToC scroll with header clearance
- [x] `src/components/layout/header.tsx` — hover intent for both menus
- [x] `src/components/layout/mega-menu.tsx` — accepts hover handlers
- [x] `src/app/[locale]/(marketing)/blog/page.tsx` — 80px CTA → footer
- [x] `src/__tests__/course-purchase-card.test.tsx` — asserts `/cart`
- [x] `src/__tests__/format.test.ts` — `formatCardDate` coverage

---

## 10. How to re-verify

```bash
pnpm typecheck && pnpm lint && pnpm test
npx playwright test e2e/qa-round-1.spec.ts                      # all three viewports
npx playwright test e2e/qa-round-1.spec.ts --project=mobile-440 # one width
```

Playwright starts `pnpm dev` itself, or reuses one already on `:3000`.
