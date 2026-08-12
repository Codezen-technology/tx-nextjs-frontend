# QA Report — By Page

**Source report:** [QA Report (Google Doc)](https://docs.google.com/document/d/1jEH8XZCVGtwbOOix-Y2Uk--3FdFks4jOLwNPf3cAl0M/edit)
**Spec:** `docs/superpowers/specs/2026-08-11-qa-report-by-page-design.md`
**Last updated:** 2026-08-12
**Supersedes:** `.context/qa-tracker.md` (deleted)

---

## How to use

**QA path:** pick a page, run its manual sweep at 1920 / 1280 / 440, then re-test each `STILL-BROKEN` row. Rows with a real `Auto` reference are already guarded by a test — focus your time on `GAP` and `MANUAL-VISUAL` rows. Sign off by ticking the sweep checkboxes and updating row statuses.

**Dev path:** read the page index below. `RED` pages have shippable work; the `Owner change` column names the OpenSpec change and task that closes each one. Open rows with `BLOCKED-DESIGN` or `N/A` cannot be worked — decisions pending.

**Which page next, and how?** → [`QA_EXECUTION.md`](./QA_EXECUTION.md). This file owns **status**; that one owns **order and method**. A status flips here and nowhere else.

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

| Value            | Meaning                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `STILL-BROKEN`   | Reproduced on `backend.`, not yet fixed                                                                           |
| `PARTIAL-FIX`    | One aspect of the row shipped, another has not. **Counts as open** — the Manual column names what still owes work |
| `FIXED`          | Verified fixed; `Auto` holds the test reference                                                                   |
| `CANT-REPRODUCE` | Could not reproduce at the stated breakpoint                                                                      |
| `BLOCKED-DESIGN` | Awaiting a human decision; code untouched                                                                         |
| `CONTENT-GAP`    | CMS content missing; fix is outside this repo                                                                     |
| `RECLASSIFIED`   | Class changed during triage (see row note)                                                                        |

### Coverage (`Auto` column)

| Value                             | Meaning                                                                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `` `e2e/x.spec.ts > test name` `` | **Preferred.** The test that guards the row, named. Survives insertions                                                                                               |
| `` `e2e/qa-round-1.spec.ts:37` `` | Existing E2E test at that file:line. Legacy — a line ref goes stale the moment a test is added above it, which happened four times in one afternoon. Migrate on touch |
| `` `price.test.ts` ``             | Existing unit test (file only)                                                                                                                                        |
| `GAP`                             | Mechanically assertable; no test yet — see page's "Tests to write"                                                                                                    |
| `MANUAL-VISUAL`                   | Judgement call: Figma fidelity, colour, visual balance. Never automated                                                                                               |
| `N/A`                             | Row is `CONTENT-GAP` or `BLOCKED-DESIGN`; nothing to assert                                                                                                           |

**Invariant:** a row is never both `GAP` and `MANUAL-VISUAL`.

---

## Page Index

Ship order = `RED` pages by descending open count. `BLOCKED-DESIGN` rows excluded from ordering.

| Page               | Route                 | Ready | Open | Blocked | Owner change                         |
| ------------------ | --------------------- | ----- | ---- | ------- | ------------------------------------ |
| Homepage           | `/`                   | RED   | 3    | 3       | unowned — needs a slice              |
| About Us           | `/about-us`           | GREEN | 0    | 0       | —                                    |
| Blog               | `/blog`               | GREEN | 0    | 0       | —                                    |
| Single Blog        | `/blog/[slug]`        | GREEN | 0    | 0       | —                                    |
| Contact            | `/contact-us`         | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.7`    |
| Course Category    | `/course-cat/[slug]`  | GREEN | 0    | 0       | —                                    |
| All Courses        | `/all-courses`        | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.5`    |
| Single Course      | `/course/[slug]`      | AMBER | 0    | 1       | —                                    |
| Privacy Policy     | `/privacy-policy`     | GREEN | 0    | 0       | —                                    |
| FAQ / Help         | `/help`               | AMBER | 0    | 1       | —                                    |
| Cart               | `/cart`               | AMBER | 0    | 1       | —                                    |
| Checkout           | `/checkout`           | RED   | 3    | 0       | `qa-class-a-design-fidelity §5.6`    |
| Pricing            | `/pricing`            | RED   | 1    | 2       | —                                    |
| Verify Certificate | `/verify-certificate` | GREEN | 0    | 0       | —                                    |
| Cancellations      | `/cancellations`      | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.7`    |
| Priority Support   | `/support-request`    | RED   | 1    | 0       | `qa-class-a-design-fidelity §5.6`    |
| Team Training      | **does not exist**    | RED   | 0    | 0       | Class D — own OpenSpec change needed |

---

## Pages

---

### Homepage

**Route:** `/`
**Figma:** `RESOLVED 6013:89909` — the canvas node is uniform where the pair differs; evidence in `.context/figma/node-resolution.md`
**Notes:** Largest section (~21 issues). Figma pair resolved by measurement; targets derived. Three Class E items blocked on design input.

`A5`–`A7`, `C4` and `E3` came from a re-read of the source report on 2026-08-12: the page had been triaged to 12 rows while the report lists ~19 homepage items, so five had no QA-ID and the page index read `Open 0` while they were still broken. `C4` is the one worth remembering — it only reproduces **logged in**, and every sweep to date ran logged out. That sweep has since been run; see the checklist above.

**The 440 horizontal overflow is `QA-HOME-A6`, not a separate defect.** The page scrolls 32px wider than the viewport (`scrollWidth` 472 vs 440) in both auth states. Exactly one node overflows without an `overflow-hidden` ancestor to absorb it: the second CPD image. The CPD row is `flex flex-row justify-between gap-10` at every width, so at 440 it hands the text column 200 and the image box **152** — while that box needs `p-10` 80 + 72 + `gap-6` 24 + 72 = **248**. The second image starts at 400 and ends at **472**, 32 past the viewport, and nothing clips it. One `flex-col` below `lg` closes the overflow and A6's 200px-wide text together.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Pricing plans render; quantity stepper updates the line total; certificate section renders images

**Logged in** — run 2026-08-12, the first time this page was swept in an authenticated state. `QA-HOME-C4` is what the omission cost.

- [x] 1920 — profile trigger renders; avatar root and fallback both 24px, initials centred
- [x] 1920 — dropdown opens at 256 wide, inside the viewport, identity avatar 40/40
- [x] 1920 — 9 menu items; "Go to Business Dashboard" correctly hidden for a non-business user
- [x] 440 — burger nav lists the auth links (My Dashboard, Certificates, Purchase History, Edit Profile); no "Log in"
- [ ] 440 — mobile Basket link shows no item count; the 1920 header shows `Basket (n)`. Deliberate or an omission?
- [ ] Real session — user data, basket count and the dashboard routes behind the menu

> **How this was run, and what it does not cover.** The header's auth signal is client-side (`lms-auth` in localStorage plus the `user_logged_in` cookie), so the state was seeded directly rather than by logging in — no credentials exist in the repo and `.env.test.local` is absent. That exercises the **rendering** of every auth-only surface, which is where `C4` lived. It does not exercise anything server-authenticated: `/api/users/me` 401s under a seeded session, so the real user's name, avatar URL, basket count and protected routes are still unverified. The last two boxes need `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`.

#### Issue table

| QA-ID      | Quote                                                         | BP        | Class | Status         | Auto                                                                              | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------- | --------- | ----- | -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA-HOME-B1 | "quantity increases, amount does not"                         | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:37`                                                       | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-B4 | "dropdown opens on click, should open on hover"               | 1920/1280 | B     | FIXED          | `e2e/qa-round-1.spec.ts:288`                                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-B5 | "certificate and transcript not rendering"                    | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-C1 | "certificate image collapsed / missing"                       | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-C2 | "transcript image collapsed / missing"                        | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-C3 | "team collaboration photos not visible"                       | all       | C     | CONTENT-GAP    | N/A                                                                               | Prod WP returns `/images/team/collaboration-{1,2,3}.jpg`, all 404. Upload assets or correct CMS paths. Component degrades gracefully.                                                                                                                                                                                                                                                                                                                                                            |
| QA-HOME-C4 | "the text on the circle is not properly aligned"              | all       | C     | FIXED          | `user-avatar.test.tsx`                                                            | The circle is the header user avatar, so it only renders logged in — missed by every logged-out sweep. `UserAvatar` applied `SIZE_CLASS` to the fallback as well as the root, so a caller resizing the root left the fallback at the preset size: 24px circle holding a 32px fallback (`profile-menu.tsx:67`), 40 holding 48 (`:85`), 44 holding 48 (`business-header.tsx:51`). The initial centred in the larger box and `overflow-hidden` clipped it. Fallback now inherits the root's size.   |
| QA-HOME-A1 | "hero top/bottom spacing — not 80–100px"                      | 1920      | A     | FIXED          | `e2e/design-fidelity.spec.ts > hero vertical padding matches the measured band`   | Frame `6056:20231`: an 844-tall band around a 577-tall visual column → **133/134** inset. Build was 170/170; now `lg:py-[133px]`. The report's "80–100" matches neither the frame nor the build.                                                                                                                                                                                                                                                                                                 |
| QA-HOME-A2 | "mobile section spacing not 40px"                             | 440       | A     | FIXED          | `e2e/design-fidelity.spec.ts > stacks its sections on the measured mobile rhythm` | **40px**, measured on blog mobile `4115:68390` — three independent section gaps (721→761, 9489→9529, 9790→9830). The 32 in `targets.md` is the gap between card blocks _inside_ a section, not between sections. Build shipped 112–144. Now one token, `--spacing-section` (20px = half the rhythm), on every top-level section of `/`, `/pricing`, `/cancellations` and `/support-request`; each keeps its own `lg:` desktop padding. Heroes excluded — a hero owns its own inset (QA-HOME-A1). |
| QA-HOME-A3 | "section header weight and Title Case"                        | all       | A     | FIXED          | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`            | Weight: every `main` h2 is 700 (`Heading/Bold/H2`). Casing: **not a defect** — the frame itself mixes cases (`6013:89983` "Explore courses by category" is sentence case), so there is no Title Case rule to assert against. Footer h2 stays 500 per `89:3918`.                                                                                                                                                                                                                                  |
| QA-HOME-A4 | "card title colour changes on hover"                          | all       | A     | FIXED          | `e2e/design-fidelity.spec.ts > course card title colour is stable on hover`       | `group-hover:text-secondary-500` shifted #00204a → #9e6f21 on hover; removed. No static frame can express a hover state, so the report is the recorded source.                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-A5 | "the pound symbol… doesn't feel like a pound symbol"          | all       | A     | STILL-BROKEN   | GAP                                                                               | Report gives a concrete target: the `£` renders in **Inter**. Prices compute `Open Sans` today. Inter is not among the app's loaded families (`--font-suse`, `--font-open-sans`), so the face has to be added before a class can point at it. The other half of this report item — quantity not updating the amount — is `QA-HOME-B1`, already `FIXED`.                                                                                                                                          |
| QA-HOME-A6 | "the header and the body text doesn't cover the full width"   | 440       | A     | STILL-BROKEN   | GAP                                                                               | The CPD section is `flex flex-row` at every width (`cpd-certificate.tsx:29`), so at 440 the section measures 440 while its h2 and p measure **200**. The images half of this report item is resolved — both render at 440, though squeezed to 72px by the same row.                                                                                                                                                                                                                              |
| QA-HOME-A7 | "the CTA should be on the bottom of the section"              | 440       | A     | STILL-BROKEN   | GAP                                                                               | "View all courses" sits in the heading row at every width (`categories-grid.tsx:57`); the report wants it below the grid on mobile. Desktop placement is not in question.                                                                                                                                                                                                                                                                                                                        |
| QA-HOME-E1 | "search button — shape and color needs to be fixed"           | all       | E     | BLOCKED-DESIGN | N/A                                                                               | No target given. Waiting for design to specify shape and colour token.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| QA-HOME-E2 | "section took too much space… more standard and middle align" | all       | E     | BLOCKED-DESIGN | N/A                                                                               | No pixel target given. Waiting for design to specify spacing target.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| QA-HOME-E3 | "the icon color is not visible"                               | all       | E     | BLOCKED-DESIGN | N/A                                                                               | Why Choose Us icons are `#00BBF0` on `bg-primary-100` #b0eafa — roughly 1.6:1 (`why-choose-grid.tsx:37`). The report assigns this to **Dev & Design** and names no replacement token, the same shape as `E1`. Measure the frame's icon token or get a design ruling and it becomes Class A.                                                                                                                                                                                                      |

#### Tests to write

- `QA-HOME-A5` — assert the computed font-family of a price's `£` contains Inter → `e2e/design-fidelity.spec.ts`
- `QA-HOME-A6` — assert the CPD heading and body span the content column at 440, **and** that `document.scrollWidth` equals the viewport → `e2e/design-fidelity.spec.ts`
- `QA-HOME-A7` — assert the categories CTA sits below the grid at 440 → `e2e/design-fidelity.spec.ts`

---

### About Us

**Route:** `/about-us`
**Figma:** `RESOLVED 6239:102399` — a section holding Desktop 1920 + Laptop 1280 + Mobile 441; the rival is the Desktop frame alone
**Notes:** Class C images are content gaps (CMS returns `null`). Page renders placeholder SVGs gracefully. No QA row is open, but ⚠️ the frame shows 40px section headings are SUSE **Medium (500)** while commit `1c92a4e` set three of them to `font-bold` — open decision, `QA_EXECUTION.md` slice 7.

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
**Figma:** `RESOLVED — either; the two frames are geometrically identical`
**Notes:** QA-BLOG-C1 (blog hero image) reclassified to Class D — `blog-hero.tsx` renders a CSS gradient with no `<img>`. Figma pair resolved: the two frames are identical.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Blog card dates display three-letter months (Jan, Feb, Mar…); no month name overflow

#### Issue table

| QA-ID      | Quote                                  | BP   | Class | Status       | Auto                                                                          | Manual                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | -------------------------------------- | ---- | ----- | ------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-BLOG-B6 | "month names overflow on card"         | 440  | B     | FIXED        | `e2e/qa-round-1.spec.ts:401`                                                  | —                                                                                                                                                                                                                                                                                                                                                                                                              |
| QA-BLOG-A1 | "80px between final CTA and footer"    | all  | A     | FIXED        | N/A                                                                           | Verified: `pb-20` wrapper around `BlogTeamCta`.                                                                                                                                                                                                                                                                                                                                                                |
| QA-BLOG-C1 | "blog hero image missing"              | all  | C     | RECLASSIFIED | N/A                                                                           | Reclassified → Class D. `blog-hero.tsx` renders CSS radial-gradient; no `<img>`. Matches Class D item "Blog hero gradient and bottom pattern".                                                                                                                                                                                                                                                                 |
| QA-BLOG-A2 | "hero top/bottom spacing"              | 1920 | A     | FIXED        | `e2e/design-fidelity.spec.ts > hero vertical inset matches the measured band` | **Fixed.** Band `4900:75793` is 320 tall around content ending at 235 → inset **85**. Build shipped 80 (`md:py-20`); now `2xl:py-[85px]`. The 1280 frame measures **64** and the build still ships 80 there — recorded in `targets.md`, not applied, because the report signs that width off as "Working Fine" and this row is scoped to 1920.                                                                 |
| QA-BLOG-A3 | "laptop side padding not 128px"        | 1280 | A     | FIXED        | `e2e/design-fidelity.spec.ts > blog grid geometry matches its Figma targets`  | **Verify-and-close, no code.** Already correct and already guarded: the existing blog-geometry assertion measures side padding **exactly 128** and content **1024** at 1280. Shipped with the `site-page-grid` ramp; this slice only confirmed it.                                                                                                                                                             |
| QA-BLOG-A4 | "section header weight and Title Case" | all  | A     | FIXED        | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`        | **Weight verified, casing not a defect.** All six `main` h2 are already 700; the new test guards that. Casing: the Blog frame mixes cases on its own evidence — `4900:75816` "Trending Topics" is Title Case while the section-title component it reuses reads "Explore courses by category". Several `/blog` headings are CMS strings anyway, so asserting case would test WordPress content, not the design. |

#### Tests to write

_Empty — both entries closed by slice 2._

---

### Single Blog

**Route:** `/blog/[slug]`
**Figma:** `RESOLVED 6015:127141` — canvas measured; rival sampled out against five held invariants
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

| QA-ID         | Quote                                         | BP   | Class | Status       | Auto          | Manual                                                                                                                                   |
| ------------- | --------------------------------------------- | ---- | ----- | ------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CONTACT-A1 | "hero top/bottom spacing not matching design" | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | No Figma ref. Compare against live WP site at same breakpoint and record the URL as the source. Owner: `qa-class-a-design-fidelity §5.7` |

---

### Course Category

**Route:** `/course-cat/[slug]`
**Figma:** `RESOLVED — either; the two frames are geometrically identical`
**Notes:** "Why Choose Us" image issues `CANT-REPRODUCE` at both widths. Figma pair resolved: identical frames. Class D: FAQ section under courses not in round 1.

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] Course cards render; category filter applies correctly

#### Issue table

| QA-ID     | Quote                                  | BP   | Class | Status         | Auto                                                                          | Manual                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | -------------------------------------- | ---- | ----- | -------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CAT-C1 | "Why Choose Us images not visible"     | 1280 | C     | CANT-REPRODUCE | N/A                                                                           | 14 imgs, 0 broken, 0 collapsed @1280.                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-CAT-C2 | "Why Choose Us images not visible"     | 440  | C     | CANT-REPRODUCE | N/A                                                                           | Same result @440. One issue, not two.                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-CAT-A1 | "laptop side padding not 128px"        | 1280 | A     | FIXED          | `e2e/design-fidelity.spec.ts > page content sits on the page grid at 1280`    | **Fixed.** The page never used the page grid: hero, course grid and "Why Choose Us" each rolled `mx-auto max-w-[1296px] px-4`, so content sat at **16** while the header sat at **128** on the same screen. All four wrappers now use `container`. Widens the 1920 content column from 1288 to 1336 as a side effect — that is the grid the rest of the site already uses.                                             |
| QA-CAT-A2 | "hero top/bottom spacing"              | 1920 | A     | FIXED          | `e2e/design-fidelity.spec.ts > hero vertical inset matches the measured band` | **Fixed.** Band `3294:42433` is 480 around content ending at 374 → inset **106**. The build had a hard `height: 350` with centred content, which gave 105.5 for this one-line title — right by accident, and it shrinks as a title wraps. Now `min-h-[350px]` + `2xl:py-[106px]`, so the inset is the invariant and the band grows with content.                                                                       |
| QA-CAT-A3 | "section header weight and Title Case" | all  | A     | FIXED          | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`        | **Weight verified, casing not a defect.** Both `main` h2 are already 700 (`1c92a4e`), now asserted. Casing measured on this page's own frame, which mixes: `3294:42501` "Why Choose Us?" and `3294:42444` "Frequently Asked Questions…" are Title Case, while the section-title component the frame reuses reads "Explore courses by category" in sentence case. Same verdict as Home and Blog, reached independently. |

#### Tests to write

_Empty — both entries closed by slice 3._

---

### All Courses

**Route:** `/all-courses`
**Figma:** `RESOLVED — either; the two frames are geometrically identical`. "v2" is a naming artefact, not a revision
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
| QA-COURSES-A2 | "hero top/bottom spacing"                                    | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | Compare against Figma — hero band **320**. Owner: `qa-class-a-design-fidelity §5.5`     |
| QA-COURSES-A3 | "section header weight and Title Case"                       | all  | A     | STILL-BROKEN | GAP           | Assert section heading font-weight and casing. Owner: `qa-class-a-design-fidelity §5.5` |
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

| QA-ID       | Quote                                                | BP  | Class | Status       | Auto | Manual                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------- | --- | ----- | ------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CHECK-A1 | "dropdown right padding not 16px"                    | all | A     | STILL-BROKEN | GAP  | Assert computed right padding on dropdown elements = 16px. Currently `pr-10` (40px); the chevron at `right-3` must move too or the text overlaps. Owner: `qa-class-a-design-fidelity §5.6`                                 |
| QA-CHECK-A2 | "section header weight and Title Case"               | all | A     | PARTIAL-FIX  | GAP  | Weight fixed: `font-bold` applied to all three checkout section h2s (commit `1c92a4e`). These are `text-2xl` (24px), a size with no measured Figma token — verify before closing. Owner: `qa-class-a-design-fidelity §5.6` |
| QA-CHECK-D1 | "checkout section present in Figma, absent in build" | all | D     | STILL-BROKEN | N/A  | Out of round 1. Own OpenSpec change needed.                                                                                                                                                                                |

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

| QA-ID        | Quote                                         | BP   | Class | Status       | Auto          | Manual                                                                                                                      |
| ------------ | --------------------------------------------- | ---- | ----- | ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| QA-CANCEL-A1 | "hero top/bottom spacing not matching design" | 1920 | A     | STILL-BROKEN | MANUAL-VISUAL | No valid Figma ref. Compare against live WP site and record the URL as the source. Owner: `qa-class-a-design-fidelity §5.7` |

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

| QA-ID         | Quote                             | BP  | Class | Status       | Auto | Manual                                                                                                                                                          |
| ------------- | --------------------------------- | --- | ----- | ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-SUPPORT-A1 | "dropdown right padding not 16px" | all | A     | STILL-BROKEN | GAP  | Assert computed right padding on dropdown = 16px. No Figma ref; measure against live WP site. Closes with QA-CHECK-A1. Owner: `qa-class-a-design-fidelity §5.6` |

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

### Divergent Figma node pairs — all six RESOLVED

Resolved by measurement, not by a team decision. Evidence per pair in
`.context/figma/node-resolution.md`; derived targets in `.context/figma/targets.md`.

| Page        | Doc node                 | Canvas "Pages" node      | Verdict                                                                                      |
| ----------- | ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| Homepage    | `4571:10560` (1920×7150) | `6013:89909` (1920×7055) | **`6013:89909`** — uniform where they differ                                                 |
| Blog        | `4900:75788`             | `6015:127034`            | **Either** — geometrically identical                                                         |
| Blog single | `4040:11134`             | `6015:127141`            | **`6015:127141`** — canvas measured, rival sampled out                                       |
| All Courses | `3306:50109`             | `6015:96163 (v2)`        | **Either** — identical; "v2" is a naming artefact                                            |
| Category    | `3294:42427`             | `6015:108699`            | **Either** — geometrically identical                                                         |
| About Us    | `6239:102399`            | `6015:129608`            | **`6239:102399`** — a section holding all three widths; the rival is the Desktop frame alone |

The grid invariants — 1296 content, 312 side padding, 80 rhythm, 24 gutter, 306 card —
now hold across eight independently measured nodes. **No Class A row is gated on a
Figma decision.**

### No valid design reference

Cancellations, Privacy Policy and Priority Support (plan §2.4). These do not stay
blocked: per `QA_EXECUTION.md`, they take targets from the **live WP site** measured at
the same breakpoint, with the URL recorded as the source exactly as a node would be.

### Open design contradiction

The About Us frame shows 40px section headings are SUSE **Medium (500)** — the file
carries both `Heading/Medium/H2` (500) and `Heading/Bold/H2` (700) and picks by size.
Commit `1c92a4e` set three 40px headings to `font-bold`. Decide at `QA_EXECUTION.md`
slice 7: revert to match the frame, or record a ruling that supersedes it.

---

## Appendix B — Test Backlog Roll-up

All `GAP` rows across all pages, in ship order (RED pages by descending open count).

| QA-ID         | Page             | What to assert                             | Spec file                     |
| ------------- | ---------------- | ------------------------------------------ | ----------------------------- |
| QA-HOME-A5    | Homepage         | Price `£` renders in Inter                 | `e2e/design-fidelity.spec.ts` |
| QA-HOME-A6    | Homepage         | CPD heading and body span the column @440  | `e2e/design-fidelity.spec.ts` |
| QA-HOME-A7    | Homepage         | Categories CTA sits below the grid @440    | `e2e/design-fidelity.spec.ts` |
| QA-COURSES-A3 | All Courses      | Section heading font-weight and Title Case | `e2e/design-fidelity.spec.ts` |
| QA-CHECK-A1   | Checkout         | Dropdown right padding = 16px              | `e2e/design-fidelity.spec.ts` |
| QA-CHECK-A2   | Checkout         | Section heading font-weight and Title Case | `e2e/design-fidelity.spec.ts` |
| QA-SUPPORT-A1 | Priority Support | Dropdown right padding = 16px              | `e2e/design-fidelity.spec.ts` |
