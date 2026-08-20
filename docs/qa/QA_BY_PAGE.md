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

### Provenance (`Ref` column)

| Value                  | Meaning                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `` `R-HOME-1920-04` `` | The item in [`QA_REPORT_ITEMS.md`](./QA_REPORT_ITEMS.md) this row was filed from. Several IDs when one row closes several items             |
| `NONE`                 | No report item behind this row. The `Manual` field says where it came from — usually one page's item generalised onto another during triage |

`scripts/qa-doc-check.mjs` fails a row whose `Ref` names an item that does not exist, **and**
fails an inventory item that no row cites. The second one is the assertion that matters: a
missing row is how this document read `Open 0` on three pages that had open work.

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

## Reconciliation — 2026-08-14

This document was checked against the source report item by item for the first time. The
report's items are now committed as [`QA_REPORT_ITEMS.md`](./QA_REPORT_ITEMS.md) — **91
items** — and every row here cites the item it came from.

Both directions were wrong.

**Missing rows — 38 filed.** The page index read **3 open** before this pass and reads
**35** after it. The gap was not spread evenly: Single Blog had 3 rows against 9 items,
Pricing 3 against 8, Checkout 3 against 5. Nine pages were `GREEN` while holding untriaged
report items.

**Invented rows — 12 marked `NONE`.** Five pages carried a "hero top/bottom spacing" row.
The report files hero spacing **once**, for the Homepage. The other four — Blog, Category,
All Courses, Contact — plus Cancellations were generalised from it during triage, and the
same happened with "section header weight and Title Case" on four pages. Those rows are
kept, because three of them produced real measurements, but they now say plainly that no
report item stands behind them.

**One item was cited by nothing at all** and only surfaced when the new checker assertion
ran: `R-CANCEL-1920-03`, the second instance of the unreadable button label.

The lesson is in the mechanism, not the count: for three months nothing could compare this
document with the report, so nothing did. `scripts/qa-doc-check.mjs` now fails when a row
cites an item that does not exist, **and** when an item is cited by no row.

---

## Page Index

Ship order = `RED` pages by descending open count. `BLOCKED-DESIGN` rows excluded from ordering.

| Page               | Route                 | Ready | Open | Blocked | Owner change                         |
| ------------------ | --------------------- | ----- | ---- | ------- | ------------------------------------ |
| Homepage           | `/`                   | RED   | 2    | 6       | —                                    |
| About Us           | `/about-us`           | RED   | 1    | 0       | —                                    |
| Blog               | `/blog`               | RED   | 2    | 0       | —                                    |
| Single Blog        | `/blog/[slug]`        | RED   | 7    | 0       | —                                    |
| Contact            | `/contact-us`         | GREEN | 0    | 0       | `qa-contact-cancellations-rows`      |
| Course Category    | `/course-cat/[slug]`  | RED   | 2    | 0       | —                                    |
| All Courses        | `/all-courses`        | RED   | 3    | 0       | Class D only — `QA-COURSES-D1`       |
| Single Course      | `/course/[slug]`      | GREEN | 0    | 0       | `fix-single-course-page-qa`          |
| Privacy Policy     | `/privacy-policy`     | RED   | 1    | 0       | —                                    |
| FAQ / Help         | `/help`               | RED   | 1    | 1       | —                                    |
| Cart               | `/cart`               | RED   | 1    | 1       | —                                    |
| Checkout           | `/checkout`           | RED   | 4    | 0       | Class D only — `QA-CHECK-D1`         |
| Pricing            | `/pricing`            | RED   | 6    | 2       | —                                    |
| Verify Certificate | `/verify-certificate` | GREEN | 0    | 0       | —                                    |
| Cancellations      | `/cancellations`      | AMBER | 0    | 1       | `qa-contact-cancellations-rows`      |
| Priority Support   | `/support-request`    | RED   | 1    | 0       | —                                    |
| Team Training      | **does not exist**    | RED   | 0    | 0       | Class D — own OpenSpec change needed |

---

## Pages

---

### Homepage

**Route:** `/`
**Figma:** `RESOLVED 6013:89909` — the canvas node is uniform where the pair differs; evidence in `.context/figma/node-resolution.md`
**Notes:** Largest section (~21 issues). Figma pair resolved by measurement; targets derived. Three Class E items blocked on design input.

`A5`–`A7`, `C4` and `E3` came from a re-read of the source report on 2026-08-12: the page had been triaged to 12 rows while the report lists ~19 homepage items, so five had no QA-ID and the page index read `Open 0` while they were still broken. `C4` is the one worth remembering — it only reproduces **logged in**, and every sweep to date ran logged out. That sweep has since been run; see the checklist above.

**The 440 horizontal overflow is `QA-HOME-A6`, not a separate defect.** The page scrolls 32px wider than the viewport (`scrollWidth` 472 vs 440) in both auth states. Exactly one node overflows without an `overflow-hidden` ancestor to absorb it: the second CPD image. The CPD row is `flex flex-row justify-between gap-10` at every width, so at 440 it hands the text column 200 and the image box **152** — while that box needs `p-10` 80 + 72 + `gap-6` 24 + 72 = **248**. The second image starts at 400 and ends at **472**, 32 past the viewport, and nothing clips it.

> **Corrected while closing `A6`.** The last sentence of that paragraph used to read "one `flex-col` below `lg` closes the overflow and A6's 200px-wide text together." It does not. Stacking fixes 440 and 768 and leaves **1024 scrolling to 1208** — the images never shrink with their box at any width, because a flex item's `min-width: auto` floors them at their declared 280. The row needed `min-w-0` as well. The 440 arithmetic above is right; it just does not generalise. Per-breakpoint measurements are in `.context/figma/targets.md`.
>
> **Out of scope, still open, no QA-ID:** between roughly 1024 and 1207 the _footer_ newsletter column (`lg:w-[360px]`) overflows to 1208 on every page. It is not a homepage section and no tested breakpoint (440 / 1280 / 1920) hits it, so this slice left it alone.

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

| QA-ID       | Ref              | Quote                                                                    | BP        | Class | Status         | Auto                                                                                                                                       | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | ---------------- | ------------------------------------------------------------------------ | --------- | ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-HOME-B1  | `R-HOME-1920-13` | "quantity increases, amount does not"                                    | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:37`                                                                                                                | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-B4  | `R-HOME-1920-02` | "dropdown opens on click, should open on hover"                          | 1920/1280 | B     | FIXED          | `e2e/qa-round-1.spec.ts:288`                                                                                                               | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-B5  | `R-HOME-1920-14` | "certificate and transcript not rendering"                               | all       | B     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                                                                               | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-C1  | `R-HOME-1920-14` | "certificate image collapsed / missing"                                  | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                                                                               | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-C2  | `R-HOME-1920-14` | "transcript image collapsed / missing"                                   | all       | C     | FIXED          | `e2e/qa-round-1.spec.ts:143`                                                                                                               | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-C3  | `R-HOME-1920-10` | "team collaboration photos not visible"                                  | all       | C     | CONTENT-GAP    | N/A                                                                                                                                        | Prod WP returns `/images/team/collaboration-{1,2,3}.jpg`, all 404. Upload assets or correct CMS paths. Component degrades gracefully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| QA-HOME-C4  | `R-HOME-1920-01` | "the text on the circle is not properly aligned"                         | all       | C     | FIXED          | `user-avatar.test.tsx`                                                                                                                     | The circle is the header user avatar, so it only renders logged in — missed by every logged-out sweep. `UserAvatar` applied `SIZE_CLASS` to the fallback as well as the root, so a caller resizing the root left the fallback at the preset size: 24px circle holding a 32px fallback (`profile-menu.tsx:67`), 40 holding 48 (`:85`), 44 holding 48 (`business-header.tsx:51`). The initial centred in the larger box and `overflow-hidden` clipped it. Fallback now inherits the root's size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| QA-HOME-A1  | `R-HOME-1920-06` | "hero top/bottom spacing — not 80–100px"                                 | 1920      | A     | FIXED          | `e2e/design-fidelity.spec.ts > hero vertical padding matches the measured band`                                                            | Frame `6056:20231`: an 844-tall band around a 577-tall visual column → **133/134** inset. Build was 170/170; now `lg:py-[133px]`. The report's "80–100" matches neither the frame nor the build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| QA-HOME-A2  | `R-HOME-440-04`  | "mobile section spacing not 40px"                                        | 440       | A     | FIXED          | `e2e/design-fidelity.spec.ts > stacks its sections on the measured mobile rhythm`                                                          | **40px**, measured on blog mobile `4115:68390` — three independent section gaps (721→761, 9489→9529, 9790→9830). The 32 in `targets.md` is the gap between card blocks _inside_ a section, not between sections. Build shipped 112–144. Now one token, `--spacing-section` (20px = half the rhythm), on every top-level section of `/`, `/pricing`, `/cancellations` and `/support-request`; each keeps its own `lg:` desktop padding. Heroes excluded — a hero owns its own inset (QA-HOME-A1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| QA-HOME-A3  | `R-HOME-1920-04` | "section header weight and Title Case"                                   | all       | A     | FIXED          | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`                                                                     | Weight: every `main` h2 is 700 (`Heading/Bold/H2`). Casing: **not a defect** — the frame itself mixes cases (`6013:89983` "Explore courses by category" is sentence case), so there is no Title Case rule to assert against. Footer h2 stays 500 per `89:3918`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| QA-HOME-A4  | `R-HOME-1920-07` | "card title colour changes on hover"                                     | all       | A     | FIXED          | `e2e/design-fidelity.spec.ts > course card title colour is stable on hover`                                                                | `group-hover:text-secondary-500` shifted #00204a → #9e6f21 on hover; removed. No static frame can express a hover state, so the report is the recorded source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| QA-HOME-A5  | `R-HOME-1920-12` | "the pound symbol… doesn't feel like a pound symbol"                     | all       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | **Reopened after a visual check — closing this as FIXED was wrong.** The frame does bind the price (`6089:107486`) to `Heading/Bold/H2` = SUSE, and the build does compute SUSE, so the row's old note ("prices compute Open Sans") and the report's "Inter" are both still uncorroborated. But the token was never the complaint. Rendering the frame's own `£29` next to SUSE Bold at the same size: the **digits are pixel-identical** (so Figma is rendering SUSE) while the **`£` is not** — the frame's is a narrow upright glyph with a thin crossbar, SUSE's is wide and boxy with a crossbar heavy enough to read as a strikethrough. Advance widths at 32px: SUSE `£` 19.2, Open Sans 18.3, Inter 20.4; the frame's text node is 57 wide against SUSE `£29` 57.6 and Open-Sans-`£`-plus-SUSE-digits 56.7 — too close to separate on width, decisive on shape. So the design shows one `£` and the build shows another, which is exactly "doesn't feel like a pound symbol". Which face the symbol should take is a design ruling: the report names Inter, the frame's token says SUSE, and the frame's render matches neither cleanly. No value guessed, no code touched. |
| QA-HOME-A6  | `R-HOME-440-06`  | "the header and the body text doesn't cover the full width"              | 440       | A     | FIXED          | `e2e/design-fidelity.spec.ts > the CPD section spans the content column at mobile`, `> the homepage never scrolls wider than the viewport` | Two faults, not one. (1) The row had no mobile direction, so at 440 its h2 and p took **200** of the 392 column; now `flex-col lg:flex-row`, and the text cap moves `md:max-w-104` → `lg:` so it applies only side-by-side. (2) The two `w-70` images never shrank with their grey box — flex `min-width:auto` floored them at 280 — so they escaped it at 1280, 1024 and 768, and past the viewport at 1024 and below; now `min-w-0`. Stacking alone would have left **1024 overflowing by 184**, so the note at the head of this section generalises 440's arithmetic further than it holds. At 1920 the box's 584 of content still divides to exactly 280 each — desktop is unchanged. Measured per breakpoint in `.context/figma/targets.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| QA-HOME-A7  | `R-HOME-440-03`  | "the CTA should be on the bottom of the section"                         | 440       | A     | FIXED          | `e2e/design-fidelity.spec.ts > the categories CTA sits below the grid at mobile`                                                           | The wrapper is now a grid and the CTA carries `order-last md:order-none`, so it drops below the category grid at 440 (CTA top 2723 vs grid bottom 2699) and stays in the heading row at 1280 and 1920. It moves visually only — the DOM order stays heading → CTA → grid, so desktop focus order is unchanged and there is still exactly one CTA node rather than a `hidden`/`md:block` pair with two accessible names.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| QA-HOME-E1  | `R-HOME-1920-03` | "search button — shape and color needs to be fixed"                      | all       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | No target given. Waiting for design to specify shape and colour token.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| QA-HOME-E2  | `R-HOME-1920-09` | "section took too much space… more standard and middle align"            | all       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | No pixel target given. Waiting for design to specify spacing target.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-HOME-E3  | `R-HOME-1920-08` | "the icon color is not visible"                                          | all       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | Why Choose Us icons are `#00BBF0` on `bg-primary-100` #b0eafa — roughly 1.6:1 (`why-choose-grid.tsx:37`). The report assigns this to **Dev & Design** and names no replacement token, the same shape as `E1`. Measure the frame's icon token or get a design ruling and it becomes Class A.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| QA-HOME-A8  | `R-HOME-1920-11` | "the button has no hover effect"                                         | all       | A     | STILL-BROKEN   | MANUAL-VISUAL                                                                                                                              | The report pairs this with the missing section image (`R-HOME-1920-10`, closed as `QA-HOME-C3`), so the button is the one in that section. Identify it against the report screenshot before fixing — several homepage sections carry a single CTA.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-HOME-A9  | `R-HOME-1920-15` | "no need of Force for good, work for us, resources"                      | all       | A     | FIXED          | `e2e/site-nav.spec.ts > QA-HOME-A9: the footer drops Force for Good, Work for us and Resources`                                            | Closed against **prod** data, not the fallback. The three links live in the WordPress menu — prod's `/lms-backend/v1/footer` serves `Work for us` → `/careers`, `Resources` → `/resources` and `Force for Good` → `/force-for-good` — so `REMOVED_FOOTER_PATHS` in `footer.tsx` filters them from every menu shape and `FALLBACK_NAV_LINKS` drops them too. **This row's earlier note was wrong**: "Work for us is already gone" was read off the local fallback while prod still served it. Guarded by `footer-nav.test.ts` against the captured prod payload — the local endpoint returns an empty menu, so the E2E check cannot fail on it. Deleting the three from the WP menu remains the durable fix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| QA-HOME-A10 | `R-HOME-1920-16` | "Certificate Validator has a longer body text"                           | all       | A     | STILL-BROKEN   | MANUAL-VISUAL                                                                                                                              | `footer.tsx:309–312` runs ~150 characters over two lines. The report names no target length, so this closes on a copy decision, not a measurement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-HOME-A11 | `R-HOME-1920-17` | "there is no need of contact us on navbar"                               | all       | A     | FIXED          | `e2e/site-nav.spec.ts > QA-HOME-A11: no Contact us link in the header, on either surface`                                                  | Removed from the desktop nav and the mobile drawer. The footer keeps its Contact us link and `/contact-us` keeps its route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| QA-HOME-A12 | `R-HOME-1920-18` | "no need for a help centre and about us on resource dropdown"            | all       | A     | FIXED          | `e2e/site-nav.spec.ts > QA-HOME-A12: the Resources dropdown lists neither Help Centre nor About Us`                                        | Both were duplicates of the utility row directly above, which still carries them. ⚠️ The dropdown now holds one entry (Blog) — whether it becomes a plain link is a design ruling; `site-header-navigation` describes dropdown hover behaviour that would need revisiting first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| QA-HOME-A13 | `R-HOME-1920-19` | "there is a new option needed on the navbar which is Pricing"            | all       | A     | FIXED          | `e2e/site-nav.spec.ts > QA-HOME-A13: the header carries a Pricing link`                                                                    | Added to the desktop main row after "Training teams" and to the mobile drawer in the matching position — the commercial row, alongside Our courses and Training teams.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| QA-HOME-C5  | `R-HOME-440-02`  | "the company logos are not visible in this section"                      | 440       | C     | CANT-REPRODUCE | N/A                                                                                                                                        | Measured at 440 on `/`: CPD 56×56, UKRLP 75×20 and the rest of the trusted strip all render. 48 images have a non-zero box; the 3 that do not are hidden desktop copies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| QA-HOME-C6  | `R-HOME-440-05`  | "the image of the section is missing"                                    | 440       | C     | CANT-REPRODUCE | N/A                                                                                                                                        | Same measurement as `C5`. No section on `/` at 440 renders an empty image box.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| QA-HOME-C7  | `R-HOME-440-07`  | "the Certificate and the Transcript are missing here"                    | 440       | C     | CANT-REPRODUCE | N/A                                                                                                                                        | Both render at 440 — sample certificate and sample transcript, 144×204 each. Closed at 1920 as `B5`/`C1`/`C2`; this is the mobile half of the same item.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| QA-HOME-E4  | `R-HOME-1920-05` | "the hover effect is so dark and also the text isn't visible properly"   | all       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | Assigned **Dev & Design** with no replacement token — the same shape as `E1` and `E3`. Needs a hover colour from design, or a measured token off the frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| QA-HOME-E5  | `R-HOME-440-01`  | "the text field on the hero section is different from the actual design" | 440       | E     | BLOCKED-DESIGN | N/A                                                                                                                                        | Assigned **Design**. The mobile frame `3268:45687` could yield a height and width, but the report asks for a design change rather than naming the target, so a ruling comes first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

#### Tests to write

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

| QA-ID       | Ref               | Quote                                                          | BP       | Class | Status       | Auto | Manual                                                                                                                                                                                    |
| ----------- | ----------------- | -------------------------------------------------------------- | -------- | ----- | ------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-ABOUT-C1 | `R-ABOUT-1920-01` | "commitment section images not visible"                        | 1280/440 | C     | CONTENT-GAP  | N/A  | Prod `/about/page` returns `commitment_section.blocks[*].image = null`. Upload assets to CMS. Component renders placeholder.                                                              |
| QA-ABOUT-C2 | `R-ABOUT-1920-03` | "team photos not visible"                                      | 1280/440 | C     | CONTENT-GAP  | N/A  | Prod `/about/page` returns `team_section.photos = null`. Upload assets to CMS. Component renders placeholder.                                                                             |
| QA-ABOUT-A1 | `R-ABOUT-1920-02` | "there is breadcrumbs in the website — no need of breadcrumbs" | all      | A     | STILL-BROKEN | GAP  | `about-us/page.tsx:46` renders `<AboutBreadcrumb />` (`about-breadcrumb.tsx`). Identical to the fix shipped as `QA-COURSE-A2`; keep any `BreadcrumbList` JSON-LD, remove the visible bar. |

#### Tests to write

- `QA-ABOUT-A1` — assert no breadcrumb bar renders on `/about-us`

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

| QA-ID      | Ref              | Quote                                                                             | BP   | Class | Status       | Auto                                                                          | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ---------------- | --------------------------------------------------------------------------------- | ---- | ----- | ------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-BLOG-B6 | `R-BLOG-1920-04` | "month names overflow on card"                                                    | 440  | B     | FIXED        | `e2e/qa-round-1.spec.ts:401`                                                  | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| QA-BLOG-A1 | `R-BLOG-1920-05` | "80px between final CTA and footer"                                               | all  | A     | FIXED        | N/A                                                                           | Verified: `pb-20` wrapper around `BlogTeamCta`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| QA-BLOG-C1 | `R-BLOG-1920-02` | "blog hero image missing"                                                         | all  | C     | RECLASSIFIED | N/A                                                                           | Reclassified → Class D. `blog-hero.tsx` renders CSS radial-gradient; no `<img>`. Matches Class D item "Blog hero gradient and bottom pattern".                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-BLOG-A2 | `NONE`           | "hero top/bottom spacing"                                                         | 1920 | A     | FIXED        | `e2e/design-fidelity.spec.ts > hero vertical inset matches the measured band` | **Fixed.** Band `4900:75793` is 320 tall around content ending at 235 → inset **85**. Build shipped 80 (`md:py-20`); now `2xl:py-[85px]`. The 1280 frame measures **64** and the build still ships 80 there — recorded in `targets.md`, not applied, because the report signs that width off as "Working Fine" and this row is scoped to 1920. Ref `NONE` — the report files a hero _gradient and pattern_ for Blog (`R-BLOG-1920-01`, now `QA-BLOG-D2`), not hero spacing. This row was generalised from the homepage's `R-HOME-1920-06`. The measured 85px inset it shipped is real and kept. |
| QA-BLOG-A3 | `NONE`           | "laptop side padding not 128px"                                                   | 1280 | A     | FIXED        | `e2e/design-fidelity.spec.ts > blog grid geometry matches its Figma targets`  | **Verify-and-close, no code.** Already correct and already guarded: the existing blog-geometry assertion measures side padding **exactly 128** and content **1024** at 1280. Shipped with the `site-page-grid` ramp; this slice only confirmed it. Ref `NONE` — the report marks Blog laptop "Working Fine". The 128px ramp came from `page-grid`, not from a Blog report item.                                                                                                                                                                                                                 |
| QA-BLOG-A4 | `NONE`           | "section header weight and Title Case"                                            | all  | A     | FIXED        | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`        | **Weight verified, casing not a defect.** All six `main` h2 are already 700; the new test guards that. Casing: the Blog frame mixes cases on its own evidence — `4900:75816` "Trending Topics" is Title Case while the section-title component it reuses reads "Explore courses by category". Several `/blog` headings are CMS strings anyway, so asserting case would test WordPress content, not the design. Ref `NONE` — generalised from the homepage's `R-HOME-1920-04`. The report files no heading issue for Blog.                                                                       |
| QA-BLOG-A5 | `R-BLOG-1920-03` | "when hovered, the button color doesn't change at all"                            | all  | A     | STILL-BROKEN | MANUAL-VISUAL                                                                 | The blog cards' own CTA. `blog-share-card.tsx` buttons do carry hover; the card button the report marks does not. Pin the element against the report screenshot before fixing.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-BLOG-D2 | `R-BLOG-1920-01` | "the hero section will have a gradient color and a pattern bottom of the section" | 1920 | D     | STILL-BROKEN | MANUAL-VISUAL                                                                 | Net-new hero treatment, already on the Class D list in `QA_EXECUTION.md` slice 8. `QA-BLOG-A2` (hero spacing) is **not** this item and traces to no report item at all.                                                                                                                                                                                                                                                                                                                                                                                                                         |

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

| QA-ID       | Ref               | Quote                                                                                                    | BP       | Class | Status         | Auto                         | Manual                                                                                                                                                          |
| ----------- | ----------------- | -------------------------------------------------------------------------------------------------------- | -------- | ----- | -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-BLOGS-B3 | `R-SBLOG-1920-05` | "ToC anchors do not scroll to clicked heading"                                                           | all      | B     | FIXED          | `e2e/qa-round-1.spec.ts:205` | —                                                                                                                                                               |
| QA-BLOGS-A2 | `NONE`            | "headings land under sticky header on direct #id URL"                                                    | all      | A     | FIXED          | N/A                          | `scroll-mt-24` on `prose-wp` headings. Ships with B3. Ref `NONE` — a real defect found while working `B3`, not a report item.                                   |
| QA-BLOGS-C1 | `R-SBLOG-1920-01` | "single blog hero image missing"                                                                         | 1280/440 | C     | CANT-REPRODUCE | N/A                          | Hero renders 572×322 (nat 682) @1280, 400×230 (nat 440) @440.                                                                                                   |
| QA-BLOGS-A3 | `R-SBLOG-1920-02` | "the category name is incorrect"                                                                         | all      | A     | STILL-BROKEN   | GAP                          | `blog/[slug]/page.tsx:171` renders the post's first category. Assert the rendered name equals the post's primary category from the API.                         |
| QA-BLOGS-A4 | `R-SBLOG-1920-03` | "according to the design, there won't be any image in this place"                                        | 1920     | A     | STILL-BROKEN   | MANUAL-VISUAL                | First of two "remove the image" items — `blog/[slug]/page.tsx:205`. Confirm which of the two locations against the frame before deleting either.                |
| QA-BLOGS-A5 | `R-SBLOG-1920-04` | "according to the design, there won't be any image in this place" (second location)                      | 1920     | A     | STILL-BROKEN   | MANUAL-VISUAL                | Second occurrence — `blog/[slug]/page.tsx:241`.                                                                                                                 |
| QA-BLOGS-A6 | `R-SBLOG-1920-06` | "the body text will be 16px regular and the title will be H2 (32px bold)"                                | all      | A     | STILL-BROKEN   | GAP                          | A measured target, not a judgement: assert computed 16/400 on body copy and 32/700 on `h2` inside the article body.                                             |
| QA-BLOGS-A7 | `R-SBLOG-1920-07` | "the FAQ section is not similar to the actual design"                                                    | all      | A     | STILL-BROKEN   | MANUAL-VISUAL                | The page reuses `CourseFaq` (`blog/[slug]/page.tsx:257`). Compare against `4040:11134` before deciding whether this is a component change or a token change.    |
| QA-BLOGS-A8 | `R-SBLOG-1280-01` | "there will be 128px padding on the hero section and the navbar"                                         | 1280     | A     | STILL-BROKEN   | GAP                          | The `page-grid` ramp already specifies 128 at 1280 and Blog and Category were converted; Single Blog was not checked. Measure before assuming it needs the fix. |
| QA-BLOGS-D1 | `R-SBLOG-440-01`  | "the table of contents is sticky on the bottom of the screen and when clicked, it will be open floating" | 440      | D     | STILL-BROKEN   | MANUAL-VISUAL                | Net-new mobile ToC drawer, design at `4146:87332`. On the Class D list in `QA_EXECUTION.md` slice 8, never filed as a row.                                      |

#### Tests to write

- `QA-BLOGS-A3` — assert the rendered category name equals the post's primary category from the API
- `QA-BLOGS-A6` — assert computed 16px/400 body copy and 32px/700 `h2` inside the article body
- `QA-BLOGS-A8` — assert 128px side padding on the hero and header at 1280

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

| QA-ID         | Ref                 | Quote                                                | BP   | Class | Status       | Auto                                                                   | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------- | ---------------------------------------------------- | ---- | ----- | ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA-CONTACT-A1 | `NONE`              | "hero top/bottom spacing not matching design"        | 1920 | A     | RECLASSIFIED | N/A                                                                    | **Does not trace to the report.** The source doc's Contact section files exactly one issue — "The section colors are not according to the design" — and marks laptop and mobile "Working Fine". No hero-spacing item exists for this page at any breakpoint. Replaced by `QA-CONTACT-A2`, which is what the report actually says. Its "No Figma ref" was also wrong: the report links `3277:44993`, a valid Contact frame. Ref `NONE` — generalised from `R-HOME-1920-06`. The report files one Contact item and it is about section colours.                                                                                                                                                                                                                                                                      |
| QA-CONTACT-A2 | `R-CONTACT-1920-01` | "the section colors are not according to the design" | 1920 | A     | FIXED        | `e2e/design-fidelity.spec.ts > section fills match the measured frame` | **Reclassified `MANUAL-VISUAL` → `GAP`.** Frame `3277:44993` binds named tokens to the page's bands, and comparing a named token to a computed fill is a measurement, not the colour judgement the row assumed (QA doc design rule D4). The row's premise was also backwards: it says "the build paints its one section white", but `main` carries `bg-neutral-10`, so the build painted its **hero** white and the other two tinted. The frame is a single hard edge at y=828 — `neutral-0` above, `neutral-10` below. Two real defects: the **cards** section was tinted where the frame is white, and the icon circle was a raw `bg-[#e6f7fe]` one green step off `primary-50` #E6F8FE. Both fixed; 1920 only, since `3277:44993` is a Desktop-only frame and 1280/440 are recorded unmeasured in `targets.md`. |

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

| QA-ID     | Ref             | Quote                                                                                   | BP   | Class | Status         | Auto                                                                          | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | --------------- | --------------------------------------------------------------------------------------- | ---- | ----- | -------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-CAT-C1 | `R-CAT-1920-03` | "Why Choose Us images not visible"                                                      | 1280 | C     | CANT-REPRODUCE | N/A                                                                           | 14 imgs, 0 broken, 0 collapsed @1280.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-CAT-C2 | `R-CAT-440-02`  | "Why Choose Us images not visible"                                                      | 440  | C     | CANT-REPRODUCE | N/A                                                                           | Same result @440. One issue, not two.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-CAT-A1 | `R-CAT-1280-01` | "laptop side padding not 128px"                                                         | 1280 | A     | FIXED          | `e2e/design-fidelity.spec.ts > page content sits on the page grid at 1280`    | **Fixed.** The page never used the page grid: hero, course grid and "Why Choose Us" each rolled `mx-auto max-w-[1296px] px-4`, so content sat at **16** while the header sat at **128** on the same screen. All four wrappers now use `container`. Widens the 1920 content column from 1288 to 1336 as a side effect — that is the grid the rest of the site already uses.                                                                                                                                                                                           |
| QA-CAT-A2 | `NONE`          | "hero top/bottom spacing"                                                               | 1920 | A     | FIXED          | `e2e/design-fidelity.spec.ts > hero vertical inset matches the measured band` | **Fixed.** Band `3294:42433` is 480 around content ending at 374 → inset **106**. The build had a hard `height: 350` with centred content, which gave 105.5 for this one-line title — right by accident, and it shrinks as a title wraps. Now `min-h-[350px]` + `2xl:py-[106px]`, so the inset is the invariant and the band grows with content. Ref `NONE` — generalised from `R-HOME-1920-06`. The Category report item at this position is the hero _background colour_ (`R-CAT-1920-01`, now `QA-CAT-A4`). The measured 106px inset it shipped is real and kept. |
| QA-CAT-A3 | `NONE`          | "section header weight and Title Case"                                                  | all  | A     | FIXED          | `e2e/design-fidelity.spec.ts > section headings use the bold H2 token`        | **Weight verified, casing not a defect.** Both `main` h2 are already 700 (`1c92a4e`), now asserted. Casing measured on this page's own frame, which mixes: `3294:42501` "Why Choose Us?" and `3294:42444` "Frequently Asked Questions…" are Title Case, while the section-title component the frame reuses reads "Explore courses by category" in sentence case. Same verdict as Home and Blog, reached independently. Ref `NONE` — generalised from `R-HOME-1920-04`.                                                                                               |
| QA-CAT-A4 | `R-CAT-1920-01` | "the background color does not match the actual design"                                 | 1920 | A     | STILL-BROKEN   | MANUAL-VISUAL                                                                 | The hero fill against `3294:42427`. `QA-CAT-A2` was filed as hero _spacing_; the report files hero _colour_. Both now exist, and only this one has provenance.                                                                                                                                                                                                                                                                                                                                                                                                       |
| QA-CAT-A5 | `R-CAT-440-01`  | "the spacing between these sections is too much — the spacing here will be 40px"        | 440  | A     | STILL-BROKEN   | GAP                                                                           | The 440 rhythm is already measured at 40 and shipped as `--spacing-section` for the homepage's shared sections. Check whether the category page picked it up.                                                                                                                                                                                                                                                                                                                                                                                                        |
| QA-CAT-D2 | `R-CAT-1920-02` | "there is an FAQ section on the Category page. But in website, there is no FAQ section" | 1920 | D     | FIXED          | N/A                                                                           | Built since the report: `course-cat/[slug]/page.tsx:191–196` renders `CourseFaq` from `category.faq`. Absent only when the CMS returns no FAQ for that category, which is content, not code.                                                                                                                                                                                                                                                                                                                                                                         |

#### Tests to write

- `QA-CAT-A5` — assert 40px between sections at 440

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

| QA-ID         | Ref                 | Quote                                                                        | BP   | Class | Status       | Auto                                                                               | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ------------------- | ---------------------------------------------------------------------------- | ---- | ----- | ------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-COURSES-A1 | `R-COURSES-1920-02` | "unselected checkbox white + border, selected Secondary 500"                 | all  | A     | FIXED        | N/A                                                                                | `course-category-filter.tsx:47` already correct on `main`.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| QA-COURSES-A2 | `NONE`              | "hero top/bottom spacing"                                                    | 1920 | A     | FIXED        | `e2e/design-fidelity.spec.ts > all-courses hero inset matches the measured band`   | **Verify-and-close, no code.** Band `3306:50115` is 320 around content ending at 208 → inset **112**, and the build already shipped `py-[112px]`. Now guarded. Note Blog's band is also 320 but its inset is 85 — the band is sized by its content, so the two do not share a value. Ref `NONE` — generalised from `R-HOME-1920-06`. The All Courses item at this position is the missing hero _pattern_ (`R-COURSES-1920-01`, now `QA-COURSES-D2`). The measured 112px inset is real and kept. |
| QA-COURSES-A3 | `NONE`              | "section header weight and Title Case"                                       | all  | A     | FIXED        | `e2e/design-fidelity.spec.ts > all-courses section headings use the bold H2 token` | **Weight verified, casing not a defect.** All 17 `main` h2 are already 700, now asserted. Casing: this page's headings are WordPress category names, so asserting their case would test CMS content; the frame reuses the same section-title component as Blog and Category, which reads "Explore courses by category" in sentence case. Fourth page to reach this verdict independently. Ref `NONE` — generalised from `R-HOME-1920-04`.                                                       |
| QA-COURSES-D1 | `R-COURSES-440-01`  | "huge mobile responsive issues… needs to be done properly"                   | 440  | D     | STILL-BROKEN | N/A                                                                                | Out of round 1. Unbounded — needs sizing in its own OpenSpec change.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| QA-COURSES-A4 | `R-COURSES-1920-03` | "in the CTA, there are courses written multiple times"                       | 1920 | A     | STILL-BROKEN | GAP                                                                                | A duplicated word in the final CTA copy. Assert the CTA text contains "courses" once.                                                                                                                                                                                                                                                                                                                                                                                                           |
| QA-COURSES-D2 | `R-COURSES-1920-01` | "the marked pattern is missing — add the pattern bottom of the hero section" | 1920 | D     | STILL-BROKEN | MANUAL-VISUAL                                                                      | Same net-new hero treatment as `QA-BLOG-D2`; Class D in `QA_EXECUTION.md` slice 8. `QA-COURSES-A2` (hero spacing) traces to no report item.                                                                                                                                                                                                                                                                                                                                                     |

#### Tests to write

- `QA-COURSES-A4` — assert the final CTA text contains "courses" exactly once

---

### Single Course

**Route:** `/course/[slug]`
**Figma:** `NONE` — no divergent pair noted; source doc links not verified.
**Notes:** Buy CTA fix shipped. Body line-height fix shipped. Owner change: `fix-single-course-page-qa`.

**Re-read of the source report on 2026-08-14 found this page under-triaged.** The report's Single Course section lists 12 items; the table held 4. Eight rows (`A2`–`A8`, `B3`) had no QA-ID, so the page index read `Open 0` while they were still broken — the same undercount that `qa-homepage-remaining-rows` corrected for the homepage.

`QA-COURSE-E1` was also mis-filed. Its `Solution(Dev)` is **not** blank: the report reads "The rating should match the course card ratings". It is re-classified to `QA-COURSE-B3` and leaves the blocked ledger. Both surfaces read the same normalized `rating` / `ratingCount` (`courses.ts:199–201`), so the mismatch is presentation, not missing data.

Two report items close without code: the hero background image (`C2` — the banner paints a gradient, there is no background image to remove) and the short hero body text (`A9` — the banner renders no body paragraph at all, so the fix is CMS-side).

#### Manual sweep

- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] "Buy this course" CTA routes to `/cart`, not `/checkout`

#### Issue table

| QA-ID        | Ref                | Quote                                                                                                 | BP  | Class | Status            | Auto                                                                                                     | Manual                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------ | ----------------------------------------------------------------------------------------------------- | --- | ----- | ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA-COURSE-B2 | `R-COURSE-1920-06` | "buy CTA goes to checkout, should go to cart"                                                         | all | B     | FIXED             | `e2e/qa-round-1.spec.ts:187`                                                                             | —                                                                                                                                                                                                                                                                                                      |
| QA-COURSE-A1 | `R-COURSE-1920-03` | "body copy line-height should be 150%"                                                                | all | A     | FIXED             | N/A                                                                                                      | `prose-wp p` leading-relaxed 162.5% → leading-normal 150% in `globals.css`.                                                                                                                                                                                                                            |
| QA-COURSE-C1 | `NONE`             | "single course images not visible"                                                                    | 440 | C     | CANT-REPRODUCE    | N/A                                                                                                      | 14 zero-box imgs @440 all inside `hidden … lg:block` / `lg:flex` — legitimate hidden desktop copies. Visible mobile card 408×392. Ref `NONE` — raised during a 440 sweep, not filed by the report.                                                                                                     |
| QA-COURSE-E1 | `R-COURSE-440-01`  | "mobile Rating not showing"                                                                           | 440 | E     | RECLASSIFIED → B3 | N/A                                                                                                      | Filed `BLOCKED-DESIGN` on a stale reading of the source doc. The report's `Solution(Dev)` reads "The rating should match the course card ratings" — populated, not blank. Continues as `QA-COURSE-B3`.                                                                                                 |
| QA-COURSE-A2 | `R-COURSE-1920-07` | "there is no need for breadcrumbs — remove the breadcrumbs"                                           | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A2: no breadcrumb bar renders, BreadcrumbList JSON-LD survives`   | Removed from `course/[slug]/page.tsx`; component deleted. The `BreadcrumbList` JSON-LD is untouched and asserted alongside.                                                                                                                                                                            |
| QA-COURSE-A3 | `R-COURSE-1920-08` | "the hours are unnecessary — remove the hours from the course curriculum"                             | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A3: the curriculum lists lectures without durations`              | All three duration renders removed from `course-flat-curriculum.tsx`. `durationSeconds` stays on the payload — the player and the purchase card still read it.                                                                                                                                         |
| QA-COURSE-A4 | `R-COURSE-1920-09` | "there is no hover on the FAQ plus/minus icon"                                                        | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A4: the FAQ toggle responds to hover`                             | Toggle now `hover:bg-secondary-100` with the icon on `group-hover:text-secondary-600`.                                                                                                                                                                                                                 |
| QA-COURSE-A5 | `R-COURSE-1920-10` | "there is no hover on the for me and for teams options"                                               | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A5: both purchase tabs respond to hover in both states`           | Both states answer the pointer: active `hover:bg-secondary-100`, inactive `hover:bg-neutral-10`. The active tab previously had no hover rule at all.                                                                                                                                                   |
| QA-COURSE-A6 | `R-COURSE-1920-05` | "the related course section title is too short in size"                                               | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A6: Related Courses uses the page's section-heading token`        | Loaded and loading headings both `font-suse text-[32px] leading-[1.2] font-bold`. Measured before: `ui-sans-serif` at 48px line-height against the peers' SUSE at 38.4.                                                                                                                                |
| QA-COURSE-A7 | `R-COURSE-1920-04` | "the arrow icons are almost invisible"                                                                | all | A     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-A7: the prose list marker clears the 3:1 non-text contrast floor` | Measured: chevron 6.70:1, unit icon 6.36:1, **list marker 2.94:1** — only the marker failed the 3:1 non-text floor. `prose-wp` marker opacity 0.6 → 0.75 (4.14:1). Ratios in `.context/figma/targets.md`.                                                                                              |
| QA-COURSE-A8 | `R-COURSE-440-02`  | "the body texts are broken (bullet point) — lines need to be completed before going to the next line" | 440 | A     | CANT-REPRODUCE    | N/A                                                                                                      | Measured at 440 on two courses: 46 line boxes, **zero** early breaks and zero mid-word breaks; computed `word-break: normal`, `overflow-wrap: normal`, `hyphens: manual`. The one line with slack breaks before an 11-character word that does not fit. Numbers in `.context/figma/targets.md`.        |
| QA-COURSE-B3 | `R-COURSE-440-01`  | "rating doesn't match with the course card"                                                           | 440 | B     | FIXED             | `e2e/course-detail.spec.ts > QA-COURSE-B3: no rating renders unless the course carries one`              | Root cause was the **card**, not the header: `course-card.tsx` fell back to `course.id % 2 === 0 ? "4.7" : "4.9"` when a course had no rating, so every card showed an invented score while the detail page correctly showed none. Fallback removed — a rating renders only when the data carries one. |
| QA-COURSE-C2 | `R-COURSE-1920-01` | "there is a background image on the hero section — remove it"                                         | all | C     | CANT-REPRODUCE    | N/A                                                                                                      | No background image exists. `course-banner.tsx:56–65` paints `BANNER_OVERLAY_GRADIENT` plus `HeroWave`; the featured image renders only as the 306px sidebar thumbnail (`:74–83`).                                                                                                                     |
| QA-COURSE-A9 | `R-COURSE-1920-02` | "the body text's length is shorter than the other body texts"                                         | all | A     | CONTENT-GAP       | N/A                                                                                                      | The banner renders title, rating and two feature lists — no body paragraph exists to lengthen. Fix is CMS-side, outside this repo.                                                                                                                                                                     |

#### Tests to write

_Empty — all eight rows closed by `fix-single-course-page-qa`; `A8` closed `CANT-REPRODUCE` with measurements rather than a test._

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

| QA-ID         | Ref                 | Quote                                      | BP  | Class | Status       | Auto          | Manual                                                                                                                                                                                                           |
| ------------- | ------------------- | ------------------------------------------ | --- | ----- | ------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-PRIVACY-A1 | `R-PRIVACY-1920-01` | "line-height should be 150%"               | all | A     | FIXED        | N/A           | `prose-wp p` leading-relaxed 162.5% → leading-normal 150% in `globals.css`. Ships with QA-COURSE-A1.                                                                                                             |
| QA-PRIVACY-A2 | `R-PRIVACY-1920-02` | "Email & Numbers are not properly visible" | all | A     | STILL-BROKEN | MANUAL-VISUAL | `privacy-policy-content.ts:74,88–89` renders them as `mailto:`/`tel:` links inheriting body colour — no link treatment at all. Assigned **Design & Dev**; a contrast measurement can settle it without a ruling. |

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

| QA-ID      | Ref              | Quote                                                   | BP  | Class | Status         | Auto          | Manual                                                                                                                         |
| ---------- | ---------------- | ------------------------------------------------------- | --- | ----- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| QA-HELP-E1 | `R-HELP-1920-01` | "hero section different from Figma design"              | all | E     | BLOCKED-DESIGN | N/A           | `Solution(Dev):` blank in source doc. No Figma ref available. Waiting for design guidance.                                     |
| QA-HELP-A1 | `R-HELP-1920-02` | "the FAQ section has to be similar to the figma design" | all | A     | STILL-BROKEN   | MANUAL-VISUAL | Compare against `6239:109818`. Unlike `E1`, this item **does** carry a `Solution(Dev)`, so it is workable rather than blocked. |

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

| QA-ID      | Ref              | Quote                                                              | BP   | Class | Status         | Auto          | Manual                                                                                                   |
| ---------- | ---------------- | ------------------------------------------------------------------ | ---- | ----- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| QA-CART-E1 | `R-CART-440-01`  | "cart mobile — doc offers two options, neither chosen"             | 440  | E     | BLOCKED-DESIGN | N/A           | Source doc presents two layout options without selecting one. Waiting for product/design to pick.        |
| QA-CART-A1 | `R-CART-1920-01` | "the card will have all the contents available on the design card" | 1920 | A     | STILL-BROKEN   | MANUAL-VISUAL | Content parity against `6239:113878` — enumerate the frame's card fields and diff against `CartItemRow`. |

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

| QA-ID       | Ref               | Quote                                                                       | BP   | Class | Status       | Auto                                                             | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ----------------- | --------------------------------------------------------------------------- | ---- | ----- | ------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA-CHECK-A1 | `R-CHECK-1920-04` | "dropdown right padding not 16px"                                           | all  | A     | FIXED        | `e2e/design-fidelity.spec.ts > dropdowns keep 16px on the right` | **Fixed** in the component Checkout shares with Priority Support (`forms/gravity-form.tsx`), which sat at **12** — `px-3` with a flush native arrow, which is what "almost no padding" describes. Now 16. The other dropdown implementation (`gf-fields/select-field.tsx`) had its chevron at `right-3`, also 12, now `right-4`. Asserted on `/support-request`: `/checkout` redirects to `/cart` when empty, and seeding a cart inside a fidelity spec would make it a checkout test.                                                                                                                                                                                                                                                                                                                                                                             |
| QA-CHECK-A2 | `NONE`            | "section header weight and Title Case"                                      | all  | A     | FIXED        | MANUAL-VISUAL                                                    | **Weight verified, casing not a defect.** All three h2 are 700 (`checkout/page.tsx:104,110,119`, commit `1c92a4e`). Frame `6239:134592` mixes case itself — `6239:134602` "Billing Details" and `6239:134619` "Order Summery" are Title, `6239:134664` "Payment method" is sentence — and the build mirrors that exactly. **Finding, not applied:** the frame's headings measure h=38 (32px), the build ships `text-2xl` (24px). Size is not what this row names, and the report's Checkout section files no heading issue at all, so this row looks generalised in during triage — see `targets.md`. `MANUAL-VISUAL` because the page cannot be reached without a cart. Ref `NONE` — generalised from `R-HOME-1920-04`; the report files no heading issue for Checkout. The 24px-vs-32px finding it produced is real and recorded in `.context/figma/targets.md`. |
| QA-CHECK-D1 | `R-CHECK-1920-03` | "checkout section present in Figma, absent in build"                        | all  | D     | STILL-BROKEN | N/A                                                              | Out of round 1. Own OpenSpec change needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| QA-CHECK-A3 | `R-CHECK-1920-01` | "the logos of the VISA, JCB etc. are not actual logos"                      | 1920 | A     | STILL-BROKEN | GAP                                                              | `SecurePaymentBadge.tsx:12` and `PaymentMethodSelector.tsx:201` render the strings "VISA", "MC", "AMEX", "DISC", "JCB" as text, not brand marks. Assert an image or SVG per scheme.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-CHECK-A4 | `R-CHECK-1920-02` | "the paypal coming soon is not needed here"                                 | 1920 | A     | STILL-BROKEN | GAP                                                              | `PaymentMethodSelector.tsx:234–238` still renders the PayPal "coming soon" block.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| QA-CHECK-A5 | `R-CHECK-1920-05` | "add trusted lines like money back guarantee, secure payment etc for trust" | 1920 | A     | PARTIAL-FIX  | MANUAL-VISUAL                                                    | One line exists — "Guaranteed safe & secure checkout" (`SecurePaymentBadge.tsx:8`). The money-back guarantee the report names does not, though the course page shows a 14-day one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

#### Tests to write

- `QA-CHECK-A3` — assert each card scheme renders an image or SVG, not a text label
- `QA-CHECK-A4` — assert no PayPal "coming soon" block renders

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

| QA-ID       | Ref               | Quote                                                                               | BP   | Class | Status         | Auto          | Manual                                                                                                                                                           |
| ----------- | ----------------- | ----------------------------------------------------------------------------------- | ---- | ----- | -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-PRICE-E1 | `R-PRICE-1920-02` | "same background colours — which two sections move where"                           | all  | E     | BLOCKED-DESIGN | N/A           | No target given. Waiting for design to specify which sections swap bg.                                                                                           |
| QA-PRICE-E2 | `R-PRICE-1920-03` | "remove this section"                                                               | all  | E     | BLOCKED-DESIGN | N/A           | Product/business decision. Not a design task. Routed separately.                                                                                                 |
| QA-PRICE-D1 | `R-PRICE-1920-05` | "third pricing card missing"                                                        | all  | D     | STILL-BROKEN   | N/A           | Prod already returns 3 plans — likely a render issue, not a missing build. Out of round 1; investigate in own change.                                            |
| QA-PRICE-A1 | `R-PRICE-1920-01` | "the hero section is different from the actual design"                              | 1920 | A     | STILL-BROKEN   | MANUAL-VISUAL | Against `6239:135726`. Measure the frame before deciding what "different" means — the report does not say.                                                       |
| QA-PRICE-A2 | `R-PRICE-1920-04` | "the header of this section is bigger than the other section headers"               | 1920 | A     | STILL-BROKEN   | GAP           | A consistency assertion, not a Figma one: compare the computed size of this heading against the page's other section headings, the same shape as `QA-COURSE-A6`. |
| QA-PRICE-A3 | `R-PRICE-1920-06` | "in this section, there won't be any Button in the marked area — remove the button" | 1920 | A     | STILL-BROKEN   | MANUAL-VISUAL | Pin which section against the report screenshot; the pricing page carries several CTAs.                                                                          |
| QA-PRICE-A4 | `R-PRICE-440-01`  | "the spacing of this marked area is too much — there will be 40px spacing"          | 440  | A     | STILL-BROKEN   | GAP           | The measured 440 rhythm is 40 and ships as `--spacing-section`. Check whether the pricing sections use it.                                                       |
| QA-PRICE-A5 | `R-PRICE-440-02`  | "the title and the button are not horizontally aligned"                             | 440  | A     | STILL-BROKEN   | GAP           | Assert the two share a horizontal centre or edge at 440.                                                                                                         |

#### Tests to write

- `QA-PRICE-A2` — assert this heading's computed size equals the page's other section headings
- `QA-PRICE-A4` — assert 40px between the marked sections at 440
- `QA-PRICE-A5` — assert the title and the button share a horizontal alignment at 440

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

| QA-ID        | Ref                | Quote                                  | BP  | Class | Status | Auto | Manual                                                                        |
| ------------ | ------------------ | -------------------------------------- | --- | ----- | ------ | ---- | ----------------------------------------------------------------------------- |
| QA-VERIFY-A1 | `R-VERIFY-1920-01` | "field needs white bg + subtle border" | all | A     | FIXED  | N/A  | `certificate-form.tsx:43` already `bg-white` + `border-neutral-40` on `main`. |

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

| QA-ID        | Ref                                   | Quote                                                       | BP   | Class | Status         | Auto                                                             | Manual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------- | ----------------------------------------------------------- | ---- | ----- | -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QA-CANCEL-A1 | `NONE`                                | "hero top/bottom spacing not matching design"               | 1920 | A     | RECLASSIFIED   | N/A                                                              | **Does not trace to the report.** The source doc's Cancellations section files button-label contrast and icon colour, and marks laptop and mobile "Working Fine". No hero-spacing item exists. Replaced by `QA-CANCEL-A2` and `QA-CANCEL-E1`. Ref `NONE` — generalised from `R-HOME-1920-06`. The report files three Cancellations items, none about spacing.                                                                                                                                                                                                                                                                                                                                                                                                |
| QA-CANCEL-A2 | `R-CANCEL-1920-01` `R-CANCEL-1920-03` | "the Button text label is not visible at all"               | all  | A     | FIXED          | `e2e/design-fidelity.spec.ts > filled controls meet AA contrast` | Measured white on `secondary-500` #9E6F21 = **4.421:1** against WCAG AA's 4.5 — confirmed in-page, not from the report. The fix does **not** move the brand token: `--color-secondary-500` is measured from Figma `83:4218`, so the 39 white-label surfaces across 35 files were repointed to `secondary-600` #90651E (**5.165:1**) and their hover to `secondary-700`. The hover step got _more_ visible, not less (ΔE 12.89 vs 5.58). Redefining `secondary-500` to #9B6D20 would be one imperceptible line at 4.563:1 and is recorded as a design ask instead. The check found one further failure on this page — `Get help →` `primary-700` on `primary-50` = **3.895:1** (`refund-sidebar.tsx:32`) — fixed to `primary-800` (5.873:1) in the same pass. |
| QA-CANCEL-E1 | `R-CANCEL-1920-02`                    | "the icons background and the icons color do not stand out" | all  | E     | BLOCKED-DESIGN | N/A                                                              | Measured **1.49:1** — `rgb(225,210,186)` on white. Report assigns this one to **Dev & Design** and names no replacement token, so it blocks the same way `QA-HOME-E1` does.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

#### Tests to write

_Empty — `A2` closed by `qa-contact-cancellations-rows`. `E1` is blocked and carries no test._

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

| QA-ID         | Ref                 | Quote                                                            | BP   | Class | Status       | Auto                                                             | Manual                                                                                                                                                                                                                                                                                                               |
| ------------- | ------------------- | ---------------------------------------------------------------- | ---- | ----- | ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-SUPPORT-A1 | `R-SUPPORT-1920-01` | "dropdown right padding not 16px"                                | all  | A     | FIXED        | `e2e/design-fidelity.spec.ts > dropdowns keep 16px on the right` | **Fixed**, and this is the page the assertion runs against. The live-WP fallback was attempted and had nothing to measure — WP renders no equivalent dropdown — so the source of record is the report's own explicit 16px. Was 12 (`px-3`, native arrow flush). Closes with `QA-CHECK-A1`: one component, two pages. |
| QA-SUPPORT-A2 | `R-SUPPORT-1920-02` | "the height of the text box in Additional Details is not enough" | 1920 | A     | STILL-BROKEN | GAP                                                              | `gf-fields/textarea-field.tsx:10` ships `rows={3}`. The report asks for a box that "will cover all the text in it" — either a larger fixed height or auto-grow.                                                                                                                                                      |

#### Tests to write

- `QA-SUPPORT-A2` — assert the Additional Details textarea renders taller than 3 rows, or grows with its content

---

### Team Training

**Route:** does not exist
**Figma:** `NONE` — no Figma node cited in source doc.
**Notes:** Class D. Page has not been built. Out of round 1. Requires its own OpenSpec change (no scope defined yet).

_No issue rows. No manual sweep. Page section records absence only._

---

## Appendix A — Blocked Ledger

### Class E — awaiting design / product decision

Re-issued 2026-08-14 from the reconciled rows. **11 blocked**, up from 8 — the
reconciliation added three that had never been filed.

| #   | QA-ID        | Ref                | Issue                                                  | What's needed                                                                                                            |
| --- | ------------ | ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | QA-HOME-E1   | `R-HOME-1920-03`   | Homepage search button shape/colour                    | Design to specify shape and colour token                                                                                 |
| 2   | QA-HOME-E2   | `R-HOME-1920-09`   | Homepage section "took too much space"                 | Design to specify a pixel target                                                                                         |
| 3   | QA-HOME-E3   | `R-HOME-1920-08`   | Homepage "Why Choose Us" icon colour                   | A replacement token, or the frame's icon token measured                                                                  |
| 4   | QA-HOME-E4   | `R-HOME-1920-05`   | Homepage hover "so dark", label unreadable             | **New.** A hover colour; the report names none                                                                           |
| 5   | QA-HOME-E5   | `R-HOME-440-01`    | Homepage hero field at 440 "different from the design" | **New.** Assigned to Design; `3268:45687` could yield a target if design confirms the frame is current                   |
| 6   | QA-HOME-A5   | `R-HOME-1920-12`   | Homepage price `£` glyph                               | A ruling on which face the symbol takes — the report says Inter, the token says SUSE, the frame's render matches neither |
| 7   | QA-HELP-E1   | `R-HELP-1920-01`   | FAQ/Help hero differs from Figma                       | `Solution(Dev)` blank in the report                                                                                      |
| 8   | QA-CART-E1   | `R-CART-440-01`    | Cart mobile — the report offers two options            | Product/design to pick one                                                                                               |
| 9   | QA-PRICE-E1  | `R-PRICE-1920-02`  | Pricing — two sections share a background              | Design to say which sections swap                                                                                        |
| 10  | QA-PRICE-E2  | `R-PRICE-1920-03`  | Pricing — "remove this section"                        | Product decision, not design                                                                                             |
| 11  | QA-CANCEL-E1 | `R-CANCEL-1920-02` | Cancellations icon background and colour               | Design to specify both                                                                                                   |

Code untouched for all eleven. Nothing guessed.

`QA-COURSE-E1` left this ledger on 2026-08-14: it was filed on the reading that its
`Solution(Dev)` was blank, and it is not. It shipped as `QA-COURSE-B3`.

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

| QA-ID         | Ref                 | Page             | What to assert                                                                   |
| ------------- | ------------------- | ---------------- | -------------------------------------------------------------------------------- |
| QA-ABOUT-A1   | `R-ABOUT-1920-02`   | About Us         | No breadcrumb bar renders on `/about-us`                                         |
| QA-BLOGS-A3   | `R-SBLOG-1920-02`   | Single Blog      | The rendered category name equals the post's primary category                    |
| QA-BLOGS-A6   | `R-SBLOG-1920-06`   | Single Blog      | Computed 16px/400 body copy and 32px/700 `h2` in the article body                |
| QA-BLOGS-A8   | `R-SBLOG-1280-01`   | Single Blog      | 128px side padding on the hero and header at 1280                                |
| QA-CAT-A5     | `R-CAT-440-01`      | Course Category  | 40px between sections at 440                                                     |
| QA-COURSES-A4 | `R-COURSES-1920-03` | All Courses      | The final CTA text contains "courses" exactly once                               |
| QA-CHECK-A3   | `R-CHECK-1920-01`   | Checkout         | Each card scheme renders an image or SVG, not a text label                       |
| QA-CHECK-A4   | `R-CHECK-1920-02`   | Checkout         | No PayPal "coming soon" block renders                                            |
| QA-PRICE-A2   | `R-PRICE-1920-04`   | Pricing          | The heading's computed size equals the page's other section headings             |
| QA-PRICE-A4   | `R-PRICE-440-01`    | Pricing          | 40px between the marked sections at 440                                          |
| QA-PRICE-A5   | `R-PRICE-440-02`    | Pricing          | The title and the button share a horizontal alignment at 440                     |
| QA-SUPPORT-A2 | `R-SUPPORT-1920-02` | Priority Support | The Additional Details textarea is taller than 3 rows, or grows with its content |

**12 tests owed** — 16 filed by the reconciliation, four closed by `qa-homepage-nav-footer-rows` — against an empty table before the reconciliation. The table was empty
because the rows were missing, not because the work was done — the same illusion the page
index carried.

A row returning to `GAP` — a new QA pass, or a blocked row unblocking — adds a line here.
Emptying it is one of the three "Done" conditions in `QA_EXECUTION.md`; the other two are
the open rows being `FIXED` with evidence, and no `RED` page holding a non-blocked open
row.
