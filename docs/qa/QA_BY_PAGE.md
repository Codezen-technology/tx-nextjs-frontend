# QA Report — By Page

**Source report:** [QA Report (Google Doc)](https://docs.google.com/document/d/1jEH8XZCVGtwbOOix-Y2Uk--3FdFks4jOLwNPf3cAl0M/edit)
**Spec:** `docs/superpowers/specs/2026-08-11-qa-report-by-page-design.md`
**Last updated:** 2026-08-11
**Supersedes:** `.context/qa-tracker.md` (deleted)

---

## How to use

**QA path:** pick a page, run its manual sweep at 1920 / 1280 / 440, then re-test each `STILL-BROKEN` row. Rows with a real `Auto` reference are already guarded by a test — focus your time on `GAP` and `MANUAL-VISUAL` rows. Sign off by ticking the sweep checkboxes and updating row statuses.

**Dev path:** read the page index below. `RED` pages have shippable work; the `Owner change` column names the OpenSpec change and task that closes each one. Open rows with `BLOCKED-DESIGN` or `N/A` cannot be worked — decisions pending.

---

## Environment

| Host                                        | What it is                                        | Used for                                                                                                       |
| ------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `https://backend.trainingexcellence.org.uk` | **Deployed headless frontend** — this Next.js app | QA triage and re-test. Where every issue in the report was filed. Default for all sweeps and row verifications |
| `https://trainingexcellence.org.uk`         | **WordPress** — CMS, REST API, live legacy site   | Behaviour/data reference; the `/wp-json/*` origin                                                              |
| `https://tx-local-site.test`                | Local WordPress, prod-like media                  | Local verification while fixing                                                                                |

`backend.` serves no `/wp-json/*` — every such path there 404s. All manual sweeps default to `backend.trainingexcellence.org.uk` unless a row says otherwise.

---

## Viewports

| Playwright project | Width                      | Used for                         |
| ------------------ | -------------------------- | -------------------------------- |
| `chromium`         | 1280 × 720                 | default; existing specs run here |
| `desktop-1920`     | 1920 × 1080                | QA pass 1920 breakpoint          |
| `mobile-440`       | 440 × 956, isMobile, DPR 3 | QA pass mobile breakpoint        |

Run all three: `npx playwright test --project=chromium --project=desktop-1920 --project=mobile-440`

---

## Legend

### Status

| Value            | Meaning                                         |
| ---------------- | ----------------------------------------------- |
| `STILL-BROKEN`   | Reproduced on `backend.`, not yet fixed         |
| `FIXED`          | Verified fixed; `Auto` holds the test reference |
| `CANT-REPRODUCE` | Could not reproduce at the stated breakpoint    |
| `BLOCKED-DESIGN` | Awaiting a human decision; code untouched       |
| `CONTENT-GAP`    | CMS content missing; fix is outside this repo   |
| `RECLASSIFIED`   | Class changed during triage (see row note)      |

### Coverage (`Auto` column)

| Value                             | Meaning                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| `` `e2e/qa-round-1.spec.ts:37` `` | Existing E2E test at that file:line                                     |
| `` `price.test.ts` ``             | Existing unit test (file only)                                          |
| `GAP`                             | Mechanically assertable; no test yet — see page's "Tests to write"      |
| `MANUAL-VISUAL`                   | Judgement call: Figma fidelity, colour, visual balance. Never automated |
| `N/A`                             | Row is `CONTENT-GAP` or `BLOCKED-DESIGN`; nothing to assert             |

**Invariant:** a row is never both `GAP` and `MANUAL-VISUAL`.

---

## Page Index

Ship order = `RED` pages by descending open count. `BLOCKED-DESIGN` rows excluded from ordering.

| Page               | Route                 | Ready | Open | Blocked | Owner change                         |
| ------------------ | --------------------- | ----- | ---- | ------- | ------------------------------------ |
| Homepage           | `/`                   | RED   | 4    | 2       | `qa-class-a-design-fidelity §5.2`    |
| About Us           | `/about-us`           | GREEN | 0    | 0       | —                                    |
| Blog               | `/blog`               | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.3`    |
| Single Blog        | `/blog/[slug]`        | GREEN | 0    | 0       | —                                    |
| Contact            | `/contact-us`         | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.6`    |
| Course Category    | `/course-cat/[slug]`  | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.4`    |
| All Courses        | `/all-courses`        | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.4`    |
| Single Course      | `/course/[slug]`      | AMBER | 0    | 1       | —                                    |
| Privacy Policy     | `/privacy-policy`     | GREEN | 0    | 0       | —                                    |
| FAQ / Help         | `/help`               | AMBER | 0    | 1       | —                                    |
| Cart               | `/cart`               | AMBER | 0    | 1       | —                                    |
| Checkout           | `/checkout`           | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.5`    |
| Pricing            | `/pricing`            | RED   | 1    | 2       | —                                    |
| Verify Certificate | `/verify-certificate` | GREEN | 0    | 0       | —                                    |
| Cancellations      | `/cancellations`      | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.6`    |
| Priority Support   | `/support-request`    | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.5`    |
| Team Training      | **does not exist**    | RED   | 0    | 0       | Class D — own OpenSpec change needed |

---

## Pages

---

### Homepage

**Route:** `/`
**Figma:** `OPEN 4571:10560 (1920×7150) vs 6013:89909 (1920×7055)` — resolution task: `qa-class-a-design-fidelity §2.1`
**Notes:** Largest section (~21 issues). Divergent Figma pair unresolved — Class A pixel targets gated on §2.1. Two Class E items blocked on design input.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Pricing plans render; quantity stepper updates the line total; certificate section renders images

#### Issue table

| QA-ID      | Quote                                                         | BP        | Class | Status         | Auto                         | Manual                                                                                                                                                           |
| ---------- | ------------------------------------------------------------- | --------- | ----- | -------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-HOME-B1 | "quantity increases, amount does not"                         | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:37`  | —                                                                                                                                                                |
| QA-HOME-B4 | "dropdown opens on click, should open on hover"               | 1920/1280 | B     | FIXED          | `e2e/qa-round-1.spec.ts:288` | —                                                                                                                                                                |
| QA-HOME-B5 | "certificate and transcript not rendering"                    | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:143` | —                                                                                                                                                                |
| QA-HOME-C1 | "certificate image collapsed / missing"                       | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143` | —                                                                                                                                                                |
| QA-HOME-C2 | "transcript image collapsed / missing"                        | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143` | —                                                                                                                                                                |
| QA-HOME-C3 | "team collaboration photos not visible"                       | all       | C     | CONTENT-GAP    | N/A                          | Prod WP returns `/images/team/collaboration-{1,2,3}.jpg`, all 404. Upload assets or correct CMS paths. Component degrades gracefully.                            |
| QA-HOME-A1 | "hero top/bottom spacing — not 80–100px"                      | 1920      | A     | STILL-BROKEN   | MANUAL-VISUAL                | Compare hero padding against Figma `6013:89909` (pending Figma pair resolution §2.1). Owner: `qa-class-a-design-fidelity §5.2`                                   |
| QA-HOME-A2 | "mobile section spacing not 40px"                             | 440       | A     | STILL-BROKEN   | MANUAL-VISUAL                | Measure section gap at 440 against Figma 440 frame. Owner: `qa-class-a-design-fidelity §5.2`                                                                     |
| QA-HOME-A3 | "section header weight and Title Case"                        | all       | A     | PARTIAL-FIX    | GAP                          | Weight fixed: `font-bold` applied to trusted-orgs h2 (commit `1c92a4e`). Title Case aspect not yet measured from Figma. Owner: `qa-class-a-design-fidelity §5.2` |
| QA-HOME-A4 | "card title colour changes on hover"                          | all       | A     | STILL-BROKEN   | GAP                          | Assert card title colour at rest vs hover state. Owner: `qa-class-a-design-fidelity §5.2`                                                                        |
| QA-HOME-E1 | "search button — shape and color needs to be fixed"           | all       | E     | BLOCKED-DESIGN | N/A                          | No target given. Waiting for design to specify shape and colour token.                                                                                           |
| QA-HOME-E2 | "section took too much space… more standard and middle align" | all       | E     | BLOCKED-DESIGN | N/A                          | No pixel target given. Waiting for design to specify spacing target.                                                                                             |

#### Tests to write

- `QA-HOME-A3` — assert `font-weight` and Title Case on section headings at all 3 widths → `e2e/design-fidelity.spec.ts`
- `QA-HOME-A4` — assert card title colour at rest and on `:hover` → `e2e/design-fidelity.spec.ts`

---

### About Us

**Route:** `/about-us`
**Figma:** `OPEN 6239:102399 vs 6015:129608` — resolution task: `qa-class-a-design-fidelity §2.6`
**Notes:** Class C images are content gaps (CMS returns `null`). Page renders placeholder SVGs gracefully. No shippable code work remains; all rows are closed or content-gap.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Team and commitment section placeholders render correctly; no empty boxes

#### Issue table

| QA-ID       | Quote                                   | BP       | Class | Status      | Auto | Manual                                                                                                                       |
| ----------- | --------------------------------------- | -------- | ----- | ----------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| QA-ABOUT-C1 | "commitment section images not visible" | 1280/440 | C     | CONTENT-GAP | N/A  | Prod `/about/page` returns `commitment_section.blocks[*].image = null`. Upload assets to CMS. Component renders placeholder. |
| QA-ABOUT-C2 | "team photos not visible"               | 1280/440 | C     | CONTENT-GAP | N/A  | Prod `/about/page` returns `team_section.photos = null`. Upload assets to CMS. Component renders placeholder.                |

---

### Blog

**Route:** `/blog`
**Figma:** `OPEN 4900:75788 vs 6015:127034` — resolution task: `qa-class-a-design-fidelity §2.2`
**Notes:** QA-BLOG-C1 (blog hero image) reclassified to Class D — `blog-hero.tsx` renders a CSS gradient with no `<img>`. Class A spacing items gated on Figma pair resolution.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Blog card dates display three-letter months (Jan, Feb, Mar…); no month name overflow

#### Issue table

| QA-ID      | Quote                                  | BP   | Class | Status       | Auto                         | Manual                                                                                                                                         |
| ---------- | -------------------------------------- | ---- | ----- | ------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-BLOG-B6 | "month names overflow on card"         | 440  | B     | FIXED        | `e2e/qa-round-1.spec.ts:401` | —                                                                                                                                              |
| QA-BLOG-A1 | "80px between final CTA and footer"    | all  | A     | FIXED        | N/A                          | Verified: `pb-20` wrapper around `BlogTeamCta`.                                                                                                |
| QA-BLOG-C1 | "blog hero image missing"              | all  | C     | RECLASSIFIED | N/A                          | Reclassified → Class D. `blog-hero.tsx` renders CSS radial-gradient; no `<img>`. Matches Class D item "Blog hero gradient and bottom pattern". |
| QA-BLOG-A2 | "hero top/bottom spacing"              | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL                | Compare hero padding against Figma (pending pair resolution §2.2). Owner: `qa-class-a-design-fidelity §5.3`                                    |
| QA-BLOG-A3 | "laptop side padding not 128px"        | 1280 | A     | STILL-BROKEN | GAP                          | Assert container padding at 1280 → `e2e/design-fidelity.spec.ts`. Owner: `qa-class-a-design-fidelity §5.3`                                     |
| QA-BLOG-A4 | "section header weight and Title Case" | all  | A     | STILL-BROKEN | GAP                          | Assert section heading font-weight and casing. Owner: `qa-class-a-design-fidelity §5.3`                                                        |

#### Tests to write

- `QA-BLOG-A3` — assert container side padding = 128px at 1280 → `e2e/design-fidelity.spec.ts`
- `QA-BLOG-A4` — assert section heading font-weight and Title Case → `e2e/design-fidelity.spec.ts`

---

### Single Blog

**Route:** `/blog/[slug]`
**Figma:** `OPEN 4040:11134 vs 6015:127141` — resolution task: `qa-class-a-design-fidelity §2.3`
**Notes:** All filed issues resolved. Hero image `CANT-REPRODUCE` (renders correctly at all widths). ToC anchor fix shipped with QA-BLOGS-B3.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] ToC link scrolls to the correct heading with sticky-header clearance (96px)

#### Issue table

| QA-ID       | Quote                                                 | BP       | Class | Status         | Auto                         | Manual                                                        |
| ----------- | ----------------------------------------------------- | -------- | ----- | -------------- | ---------------------------- | ------------------------------------------------------------- |
| QA-BLOGS-B3 | "ToC anchors do not scroll to clicked heading"        | all      | B     | FIXED          | `e2e/qa-round-1.spec.ts:205` | —                                                             |
| QA-BLOGS-A2 | "headings land under sticky header on direct #id URL" | all      | A     | FIXED          | N/A                          | `scroll-mt-24` on `prose-wp` headings. Ships with B3.         |
| QA-BLOGS-C1 | "single blog hero image missing"                      | 1280/440 | C     | CANT-REPRODUCE | N/A                          | Hero renders 572×322 (nat 682) @1280, 400×230 (nat 440) @440. |

---

### Contact

**Route:** `/contact-us`
**Figma:** `NONE` — no Figma node cited in source report for this page.
**Notes:** Only reported issue is a Class A spacing item. Fix against live behaviour only (no design ref).

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Contact form submits without error; success state renders

#### Issue table

| QA-ID         | Quote                                         | BP   | Class | Status       | Auto          | Manual                                                                                                  |
| ------------- | --------------------------------------------- | ---- | ----- | ------------ | ------------- | ------------------------------------------------------------------------------------------------------- |
| QA-CONTACT-A1 | "hero top/bottom spacing not matching design" | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | No Figma ref. Compare against live WP site at same breakpoint. Owner: `qa-class-a-design-fidelity §5.6` |

---

### Course Category

**Route:** `/course-cat/[slug]`
**Figma:** `OPEN 3294:42427 vs 6015:108699` — resolution task: `qa-class-a-design-fidelity §2.5`
**Notes:** "Why Choose Us" image issues `CANT-REPRODUCE` at both widths. Class A spacing gated on Figma pair. Class D: FAQ section under courses not in round 1.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Course cards render; category filter applies correctly

#### Issue table

| QA-ID     | Quote                                  | BP   | Class | Status         | Auto          | Manual                                                                                                                                                         |
| --------- | -------------------------------------- | ---- | ----- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CAT-C1 | "Why Choose Us images not visible"     | 1280 | C     | CANT-REPRODUCE | N/A           | 14 imgs, 0 broken, 0 collapsed @1280.                                                                                                                          |
| QA-CAT-C2 | "Why Choose Us images not visible"     | 440  | C     | CANT-REPRODUCE | N/A           | Same result @440. One issue, not two.                                                                                                                          |
| QA-CAT-A1 | "laptop side padding not 128px"        | 1280 | A     | STILL-BROKEN   | GAP           | Assert container padding = 128px @1280. Owner: `qa-class-a-design-fidelity §5.4`                                                                               |
| QA-CAT-A2 | "hero top/bottom spacing"              | 1920 | A     | STILL-BROKEN   | MANUAL-VISUAL | Compare against Figma (pending pair resolution §2.5). Owner: `qa-class-a-design-fidelity §5.4`                                                                 |
| QA-CAT-A3 | "section header weight and Title Case" | all  | A     | PARTIAL-FIX    | GAP           | Weight fixed: `font-bold` applied to course-faq h2 (commit `1c92a4e`). Title Case aspect not yet measured from Figma. Owner: `qa-class-a-design-fidelity §5.4` |

#### Tests to write

- `QA-CAT-A1` — assert container side padding = 128px at 1280 → `e2e/design-fidelity.spec.ts`
- `QA-CAT-A3` — assert section heading font-weight and Title Case → `e2e/design-fidelity.spec.ts`

---

### All Courses

**Route:** `/all-courses`
**Figma:** `OPEN 3306:50109 vs 6015:96163 (v2)` — resolution task: `qa-class-a-design-fidelity §2.4`
**Notes:** Filter checkboxes already correct on `main`. Class D: All Courses mobile "huge responsive issues" — out of round 1, needs sizing.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Filter checkboxes: white + border unselected, `bg-secondary-500` selected; course cards render

#### Issue table

| QA-ID         | Quote                                                        | BP   | Class | Status       | Auto          | Manual                                                                                  |
| ------------- | ------------------------------------------------------------ | ---- | ----- | ------------ | ------------- | --------------------------------------------------------------------------------------- |
| QA-COURSES-A1 | "unselected checkbox white + border, selected Secondary 500" | all  | A     | FIXED        | N/A           | `course-category-filter.tsx:47` already correct on `main`.                              |
| QA-COURSES-A2 | "hero top/bottom spacing"                                    | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | Pending Figma pair resolution §2.4. Owner: `qa-class-a-design-fidelity §5.4`            |
| QA-COURSES-A3 | "section header weight and Title Case"                       | all  | A     | STILL-BROKEN | GAP           | Assert section heading font-weight and casing. Owner: `qa-class-a-design-fidelity §5.4` |
| QA-COURSES-D1 | "huge mobile responsive issues… needs to be done properly"   | 440  | D     | STILL-BROKEN | N/A           | Out of round 1. Unbounded — needs sizing in its own OpenSpec change.                    |

#### Tests to write

- `QA-COURSES-A3` — assert section heading font-weight and Title Case → `e2e/design-fidelity.spec.ts`

---

### Single Course

**Route:** `/course/[slug]`
**Figma:** `NONE` — no divergent pair noted; source doc links not verified.
**Notes:** Buy CTA fix shipped. Body line-height fix shipped. Mobile "Rating" issue `BLOCKED-DESIGN` (Solution(Dev) blank in source doc).

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] "Buy this course" CTA routes to `/cart`, not `/checkout`

#### Issue table

| QA-ID        | Quote                                         | BP  | Class | Status         | Auto                         | Manual                                                                                                                            |
| ------------ | --------------------------------------------- | --- | ----- | -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| QA-COURSE-B2 | "buy CTA goes to checkout, should go to cart" | all | B     | FIXED          | `e2e/qa-round-1.spec.ts:187` | —                                                                                                                                 |
| QA-COURSE-A1 | "body copy line-height should be 150%"        | all | A     | FIXED          | N/A                          | `prose-wp p` leading-relaxed 162.5% → leading-normal 150% in `globals.css`.                                                       |
| QA-COURSE-C1 | "single course images not visible"            | 440 | C     | CANT-REPRODUCE | N/A                          | 14 zero-box imgs @440 all inside `hidden … lg:block` / `lg:flex` — legitimate hidden desktop copies. Visible mobile card 408×392. |
| QA-COURSE-E1 | "mobile Rating not showing"                   | 440 | E     | BLOCKED-DESIGN | N/A                          | `Solution(Dev):` blank in source doc. Waiting for design specification.                                                           |

---

### Privacy Policy

**Route:** `/privacy-policy`
**Figma:** `NONE` — source doc cites `3633:58383` which resolves to Single Course Page node. Wrong reference.
**Notes:** One issue — line-height, now fixed. No remaining work.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Body copy renders at 150% line-height; page is readable at all widths

#### Issue table

| QA-ID         | Quote                        | BP  | Class | Status | Auto | Manual                                                                                               |
| ------------- | ---------------------------- | --- | ----- | ------ | ---- | ---------------------------------------------------------------------------------------------------- |
| QA-PRIVACY-A1 | "line-height should be 150%" | all | A     | FIXED  | N/A  | `prose-wp p` leading-relaxed 162.5% → leading-normal 150% in `globals.css`. Ships with QA-COURSE-A1. |

---

### FAQ / Help

**Route:** `/help`
**Figma:** `NONE` — no valid Figma node cited.
**Notes:** One issue — hero differs from Figma — but `Solution(Dev):` blank in source doc. `BLOCKED-DESIGN`.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] FAQ accordion opens and closes correctly

#### Issue table

| QA-ID      | Quote                                      | BP  | Class | Status         | Auto | Manual                                                                                     |
| ---------- | ------------------------------------------ | --- | ----- | -------------- | ---- | ------------------------------------------------------------------------------------------ |
| QA-HELP-E1 | "hero section different from Figma design" | all | E     | BLOCKED-DESIGN | N/A  | `Solution(Dev):` blank in source doc. No Figma ref available. Waiting for design guidance. |

---

### Cart

**Route:** `/cart`
**Figma:** `NONE` — no Figma node cited.
**Notes:** Mobile layout — source doc offers two options and picks neither. `BLOCKED-DESIGN`.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Cart items list renders; quantity adjusts line total; checkout CTA reachable

#### Issue table

| QA-ID      | Quote                                                  | BP  | Class | Status         | Auto | Manual                                                                                            |
| ---------- | ------------------------------------------------------ | --- | ----- | -------------- | ---- | ------------------------------------------------------------------------------------------------- |
| QA-CART-E1 | "cart mobile — doc offers two options, neither chosen" | 440 | E     | BLOCKED-DESIGN | N/A  | Source doc presents two layout options without selecting one. Waiting for product/design to pick. |

---

### Checkout

**Route:** `/checkout`
**Figma:** `NONE` — no Figma node cited.
**Notes:** Two shippable Class A items. Class D: Checkout section present in Figma, absent in build — out of round 1.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Checkout form renders; payment fields load; order summary visible

#### Issue table

| QA-ID       | Quote                                                | BP  | Class | Status       | Auto | Manual                                                                                                                                                                          |
| ----------- | ---------------------------------------------------- | --- | ----- | ------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CHECK-A1 | "dropdown right padding not 16px"                    | all | A     | STILL-BROKEN | GAP  | Assert computed right padding on dropdown elements = 16px. Owner: `qa-class-a-design-fidelity §5.5`                                                                             |
| QA-CHECK-A2 | "section header weight and Title Case"               | all | A     | PARTIAL-FIX  | GAP  | Weight fixed: `font-bold` applied to all three checkout section h2s (commit `1c92a4e`). Title Case aspect not yet measured from Figma. Owner: `qa-class-a-design-fidelity §5.5` |
| QA-CHECK-D1 | "checkout section present in Figma, absent in build" | all | D     | STILL-BROKEN | N/A  | Out of round 1. Own OpenSpec change needed.                                                                                                                                     |

#### Tests to write

- `QA-CHECK-A1` — assert dropdown right padding = 16px → `e2e/design-fidelity.spec.ts`
- `QA-CHECK-A2` — assert heading font-weight and Title Case → `e2e/design-fidelity.spec.ts`

---

### Pricing

**Route:** `/pricing`
**Figma:** `NONE` — no Figma node cited.
**Notes:** Two Class E blocked items. Class D: third pricing card may be a render issue (prod already returns 3 plans) — out of round 1.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] All three pricing cards render with correct plan names and CTAs

#### Issue table

| QA-ID       | Quote                                                     | BP  | Class | Status         | Auto | Manual                                                                                                                |
| ----------- | --------------------------------------------------------- | --- | ----- | -------------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| QA-PRICE-E1 | "same background colours — which two sections move where" | all | E     | BLOCKED-DESIGN | N/A  | No target given. Waiting for design to specify which sections swap bg.                                                |
| QA-PRICE-E2 | "remove this section"                                     | all | E     | BLOCKED-DESIGN | N/A  | Product/business decision. Not a design task. Routed separately.                                                      |
| QA-PRICE-D1 | "third pricing card missing"                              | all | D     | STILL-BROKEN   | N/A  | Prod already returns 3 plans — likely a render issue, not a missing build. Out of round 1; investigate in own change. |

---

### Verify Certificate

**Route:** `/verify-certificate`
**Figma:** `6239:110952` — resolved (correct node for this page per plan §2.4).
**Notes:** Field styling already correct on `main`. No remaining work.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Certificate lookup form renders with white bg + subtle border on inputs; submits without error

#### Issue table

| QA-ID        | Quote                                  | BP  | Class | Status | Auto | Manual                                                                        |
| ------------ | -------------------------------------- | --- | ----- | ------ | ---- | ----------------------------------------------------------------------------- |
| QA-VERIFY-A1 | "field needs white bg + subtle border" | all | A     | FIXED  | N/A  | `certificate-form.tsx:43` already `bg-white` + `border-neutral-40` on `main`. |

---

### Cancellations

**Route:** `/cancellations`
**Figma:** `NONE` — source doc cites `6239:110952` which is the Certificate Verification node. Wrong reference (plan §2.4).
**Notes:** One Class A spacing item. Fix against live WP site behaviour only.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Page copy renders; cancellations policy readable at all widths

#### Issue table

| QA-ID        | Quote                                         | BP   | Class | Status       | Auto          | Manual                                                                                     |
| ------------ | --------------------------------------------- | ---- | ----- | ------------ | ------------- | ------------------------------------------------------------------------------------------ |
| QA-CANCEL-A1 | "hero top/bottom spacing not matching design" | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | No valid Figma ref. Compare against live WP site. Owner: `qa-class-a-design-fidelity §5.6` |

---

### Priority Support

**Route:** `/support-request`
**Figma:** `NONE` — source doc cites `6239:110952` which is the Certificate Verification node. Wrong reference (plan §2.4).
**Notes:** One Class A spacing item (dropdown right padding). Fix against live WP site behaviour only.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Support request form renders and submits without error

#### Issue table

| QA-ID         | Quote                             | BP  | Class | Status       | Auto | Manual                                                                                                                                 |
| ------------- | --------------------------------- | --- | ----- | ------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| QA-SUPPORT-A1 | "dropdown right padding not 16px" | all | A     | STILL-BROKEN | GAP  | Assert computed right padding on dropdown = 16px. No Figma ref; measure against live WP site. Owner: `qa-class-a-design-fidelity §5.5` |

#### Tests to write

- `QA-SUPPORT-A1` — assert dropdown right padding = 16px → `e2e/design-fidelity.spec.ts`

---

### Team Training

**Route:** does not exist
**Figma:** `NONE` — no Figma node cited in source doc.
**Notes:** Class D. Page has not been built. Out of round 1. Requires its own OpenSpec change (no scope defined yet).

_No issue rows. No manual sweep. Page section records absence only._

---

## Appendix A — Blocked Ledger

### Class E — awaiting design / product decision

| #   | QA-ID        | Issue                                          | What's needed                            |
| --- | ------------ | ---------------------------------------------- | ---------------------------------------- |
| 1   | QA-HOME-E1   | Homepage search button shape/colour            | Design to specify shape and colour token |
| 2   | QA-HOME-E2   | Homepage section spacing "took too much space" | Design to specify pixel target           |
| 3   | QA-PRICE-E1  | Pricing — same bg colours                      | Design to specify which sections swap    |
| 4   | QA-PRICE-E2  | Pricing — "remove this section"                | Product/business decision; not design    |
| 5   | QA-CART-E1   | Cart mobile — doc offers two options           | Product/design to pick one               |
| 6   | QA-HELP-E1   | FAQ/Help hero differs from Figma               | `Solution(Dev):` blank in source doc     |
| 7   | QA-COURSE-E1 | Single Course mobile "Rating"                  | `Solution(Dev):` blank in source doc     |

Code untouched for all seven. Nothing guessed.

### Divergent Figma node pairs — unresolved

| Page        | Doc node                 | Canvas "Pages" node      | Resolution task                   |
| ----------- | ------------------------ | ------------------------ | --------------------------------- |
| Homepage    | `4571:10560` (1920×7150) | `6013:89909` (1920×7055) | `qa-class-a-design-fidelity §2.1` |
| Blog        | `4900:75788`             | `6015:127034`            | `qa-class-a-design-fidelity §2.2` |
| Blog single | `4040:11134`             | `6015:127141`            | `qa-class-a-design-fidelity §2.3` |
| All Courses | `3306:50109`             | `6015:96163 (v2)`        | `qa-class-a-design-fidelity §2.4` |
| Category    | `3294:42427`             | `6015:108699`            | `qa-class-a-design-fidelity §2.5` |
| About Us    | `6239:102399`            | `6015:129608`            | `qa-class-a-design-fidelity §2.6` |

No valid design reference at all: Cancellations, Privacy Policy, Priority Support (plan §2.4).

---

## Appendix B — Test Backlog Roll-up

All `GAP` rows across all pages, in ship order (RED pages by descending open count).

| QA-ID         | Page             | What to assert                                                   | Spec file                     |
| ------------- | ---------------- | ---------------------------------------------------------------- | ----------------------------- |
| QA-HOME-A3    | Homepage         | `font-weight` and Title Case on section headings at all 3 widths | `e2e/design-fidelity.spec.ts` |
| QA-HOME-A4    | Homepage         | Card title colour at rest vs `:hover`                            | `e2e/design-fidelity.spec.ts` |
| QA-BLOG-A3    | Blog             | Container side padding = 128px at 1280                           | `e2e/design-fidelity.spec.ts` |
| QA-BLOG-A4    | Blog             | Section heading font-weight and Title Case                       | `e2e/design-fidelity.spec.ts` |
| QA-CAT-A1     | Course Category  | Container side padding = 128px at 1280                           | `e2e/design-fidelity.spec.ts` |
| QA-CAT-A3     | Course Category  | Section heading font-weight and Title Case                       | `e2e/design-fidelity.spec.ts` |
| QA-COURSES-A3 | All Courses      | Section heading font-weight and Title Case                       | `e2e/design-fidelity.spec.ts` |
| QA-CHECK-A1   | Checkout         | Dropdown right padding = 16px                                    | `e2e/design-fidelity.spec.ts` |
| QA-CHECK-A2   | Checkout         | Section heading font-weight and Title Case                       | `e2e/design-fidelity.spec.ts` |
| QA-SUPPORT-A1 | Priority Support | Dropdown right padding = 16px                                    | `e2e/design-fidelity.spec.ts` |
