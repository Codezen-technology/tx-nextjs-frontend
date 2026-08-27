# QA Report — Page-by-Page Execution Runbook

**Companion to:** [`QA_BY_PAGE.md`](./QA_BY_PAGE.md) · **Owner change:** `openspec/changes/qa-class-a-design-fidelity`
**Last updated:** 2026-08-27

---

## What this document is for

`QA_BY_PAGE.md` answers **"what is the state of this page?"**
This document answers **"which page do I open next, and what exactly do I do once I'm there?"**

They do not overlap:

|              | `QA_BY_PAGE.md`                            | `QA_EXECUTION.md` (this file)      |
| ------------ | ------------------------------------------ | ---------------------------------- |
| Owns         | **Status** — every QA-ID's current verdict | **Process** — order, recipe, gates |
| Changes when | A row's status flips                       | The order or the method changes    |
| Read by      | QA signing off a page                      | Whoever is doing the work          |

**A status flips in exactly one place: `QA_BY_PAGE.md`.** Nothing in this file records
a verdict. If you find yourself updating a status here, you are in the wrong file.

### Why a runbook was needed

The owner change's `tasks.md` was ordered by _phase_ (measure everything → derive
everything → apply everything), which means no page is ever finished and no single commit
closes one. This file re-cuts the same work into page slices, one commit each.

> **Updated 2026-08-14.** This file used to open with "15 open Class A rows across 8
> pages". That count is dead. The `qa-report-triage-reconciliation` pass checked
> `QA_BY_PAGE.md` against the source report item by item and found **38 unfiled rows**;
> the index went from 3 open to **35 open across 12 pages**, with 11 blocked. The eight
> slices below are all landed — the order that matters now is the reconciled one, further
> down.
>
> **Updated 2026-08-27.** Seven changes have since worked that reconciled order down to
> **12 open across 10 pages, with 12 blocked** — 8 Class A rows and 4 Class D builds. Go to
> [The remaining order](#the-remaining-order--2026-08-27); everything above it is history.

---

## Before you start: three findings

These were established by measurement and are inputs, not work items.

### 1. The three "unresolved" Figma pairs are resolved

All six divergent pairs from execution plan §2.3 are now settled — see
`.context/figma/node-resolution.md` for evidence per pair.

| Page        | Verdict                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Homepage    | `6013:89909` — canvas node is the uniform one                                                                        |
| Blog        | Either — **geometrically identical**                                                                                 |
| Blog single | `6015:127141` — canvas measured, rival sampled out                                                                   |
| All Courses | Either — **geometrically identical** ("v2" is a naming artefact)                                                     |
| Category    | Either — **geometrically identical**                                                                                 |
| About Us    | **`6239:102399`** — the doc node is a _section_ holding all three widths; the canvas node is the Desktop frame alone |

The grid invariants — 1296 content, 312 side padding, 80 rhythm, 24 gutter, 306 card —
now hold across **eight** independently measured nodes. Nothing is gated on a Figma
decision any more.

### 2. Heading weight is per token, not per role

The About Us frame carries both `Heading/Medium/H2` (SUSE 32/**500**) and
`Heading/Bold/H2` (SUSE 32/**700**), and picks by size: 48px → Bold, 40px → **Medium**,
32px → Bold.

**"Section headings are bold" is false as a global rule.** Commit `1c92a4e` set three
40px About Us headings to `font-bold`, which contradicts the frame. That is carried as
an open decision into the About Us slice below — it is not pre-emptively reverted.

> **Rule:** measure the heading's token at each page and each size. Never generalise a
> weight, colour or spacing value across pages.

### 3. Three pages will never get a Figma target

Cancellations, Priority Support and Privacy Policy cite wrong nodes (plan §2.4).
Leaving their rows `MANUAL-VISUAL` indefinitely is how they stay open forever. They get
a defined fallback instead:

> **Measure the live WP page at the same breakpoint and record the URL + value as the
> source**, exactly as a Figma node would be recorded. A measured target from a
> legitimate source is still a target.

---

## The order

Eight slices, one commit each. Ordering is **unblock first, then descending open count,
with pages that share a single fix kept adjacent.**

| #   | Slice                                  | Rows                               | Why here                                                         |
| --- | -------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| 0   | **Unblock** — record the pair verdicts | —                                  | Ungates 6 rows. Docs only, no code                               |
| 1   | **Homepage**                           | `A1` `A2` `A3` `A4`                | 4 rows, most of any page; node resolved, targets already derived |
| 2   | **Blog**                               | `A2` `A3` `A4`                     | Pair identical, 128px already applied — largely verify-and-close |
| 3   | **Course Category**                    | `A1` `A2` `A3`                     | Unblocked by slice 0                                             |
| 4   | **All Courses**                        | `A2` `A3`                          | Shares the heading measurement with slice 3                      |
| 5   | **Checkout + Priority Support**        | `CHECK-A1` `CHECK-A2` `SUPPORT-A1` | One dropdown-padding fix closes both pages                       |
| 6   | **Contact + Cancellations**            | `CONTACT-A1` `CANCEL-A1`           | Same shape (hero spacing, no design ref), same fallback          |
| 7   | **About Us**                           | —                                  | Resolve the 40px heading-weight contradiction from finding 2     |
| 8   | **Close-out**                          | —                                  | Re-issue the Class E ledger, file Class D proposals, final gate  |

**All eight landed.** Slices 0–4 and 6 shipped between 2026-08-12 and 2026-08-13; slice 5
(Checkout + Priority Support) shipped with the dropdown fix; slice 7 (About Us) settled the
heading-weight contradiction. Single Course was worked separately as
`fix-single-course-page-qa`. What follows replaces this table, not supplements it.

### The reconciled order — 2026-08-14 (spent)

The reconciliation's order was Single Blog 7, Pricing 6, Homepage 6, Checkout 4, All
Courses 3, Course Category 2, Blog 2, then five pages at 1 — **35 open across 12 pages**.
Seven changes have landed against it since:

| Change                        | Closed | What                                                                                                                                                                                                               |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa-homepage-nav-footer-rows` | 4      | 4 Homepage rows; `QA-HOME-A10` moved to the blocked ledger rather than closing                                                                                                                                     |
| `qa-single-blog-rows`         | 5      | 5 of Single Blog's 7                                                                                                                                                                                               |
| `qa-pricing-rows`             | 4      | 4 of Pricing's 6                                                                                                                                                                                                   |
| `qa-checkout-rows`            | 3      | 3 of Checkout's 4                                                                                                                                                                                                  |
| `qa-all-courses-rows`         | 1      | `QA-COURSES-A4`, the CTA copy duplication                                                                                                                                                                          |
| `qa-course-category-rows`     | 4      | Both Category rows, **plus `QA-BLOG-D2` and `QA-COURSES-D2`** — measuring the category gradient proved the Blog and All Courses hero gradients `CANT-REPRODUCE` too. Filed `QA-CAT-A6` in passing, already `FIXED` |
| `qa-homepage-team-cta`        | 1      | Homepage's last non-blocked row                                                                                                                                                                                    |

**23 closed, 35 → 12.** The 6th Homepage row is the ledger move, not a fix.

Homepage, Course Category and Contact are now closed out. `QA-HOME-A10` moved to the blocked
ledger rather than closing, which is why Homepage reads `AMBER 0 open / 7 blocked` and not
`GREEN`.

### The remaining order — 2026-08-27 (spent)

That order listed **12 open across 10 pages**, of which 8 were Class A. All eight are now
closed, by three further changes:

| Change                    | Closed | What                                                                                                             |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `qa-faq-section-fidelity` | 2      | `QA-BLOGS-A7` + `QA-HELP-A1` — one FAQ design across two pages, and the site's second FAQ implementation deleted |
| `qa-final-class-a-rows`   | 4      | `QA-ABOUT-A1`, `QA-BLOG-A5`, `QA-PRIVACY-A2`, `QA-SUPPORT-A2` — the last four needing no ruling                  |
| `qa-cart-pricing-rows`    | 2      | `QA-CART-A1` + `QA-PRICE-A3`                                                                                     |

### What is left — 2026-08-27

**No Class A row is open. Nothing on the board can be closed by writing code against a
measurement.** Both remaining categories need something from outside this repo.

| Class | Count | What it needs                                                              |
| ----- | ----- | -------------------------------------------------------------------------- |
| **D** | 4     | Sizing as their own OpenSpec changes — these are net-new builds, not fixes |
| **E** | 12    | A design or product decision (Appendix A carries the specific ask per row) |

The four Class D items:

| Row             | Page        | What                                                 |
| --------------- | ----------- | ---------------------------------------------------- |
| `QA-BLOGS-D1`   | Single Blog | Mobile table-of-contents drawer (`4146:87332`)       |
| `QA-PRICE-D1`   | Pricing     | The third pricing card                               |
| `QA-COURSES-D1` | All Courses | Mobile responsive rebuild — unbounded as written     |
| `QA-CHECK-D1`   | Checkout    | A section present in Figma and absent from the build |

Plus **Team Training**, which has no route at all and no row, because a page that does not
exist cannot carry one.

**Two of the three "Done" conditions are met:** Appendix B is empty, and no `RED` page holds
a non-blocked open row that is not Class D. The third — every open row `FIXED` with
evidence — cannot be met until Class D is sized and Class E is answered.

---

## The recipe

The same eight steps for every slice.

### 1. Scope

Open the page's section in `QA_BY_PAGE.md`. Work **only** rows whose status is
`STILL-BROKEN` or `PARTIAL-FIX`. Do not re-verify closed rows — that is what the page's
manual sweep is for, and it runs separately.

Then check the page against [`QA_REPORT_ITEMS.md`](./QA_REPORT_ITEMS.md): every item for
that page must have a row. `pnpm test` enforces this, but read it anyway — a row whose
`Ref` is `NONE` may be someone else's item generalised onto your page, and working it
means fixing something the report never asked for. That happened on five pages.

### 2. Measure

Read the authoritative node from `.context/figma/node-resolution.md`. Pull only the
properties the open rows name. Append to `.context/figma/targets.md` as:

```
property → breakpoint → value → source node
```

No valid node for this page? Measure the live WP page at that breakpoint and record the
URL as the source (finding 3).

### 3. Derive

Add the target to the `TARGETS` map in `e2e/design-fidelity.spec.ts`, with a
per-breakpoint tolerance and a comment citing the source node. Follow the existing
shape — the 1920 row already documents its wider tolerance and _why_ (the
`max-width:1400px` deviation owned by the `site-page-grid` change). Recording a known
deviation as tolerance rather than as the target keeps the design value honest and the
deviation visible.

### 4. Assert before fixing

**Write the test first and watch it fail.** The failure message must name page,
property, breakpoint, expected and observed — a bare `expected 80 got 64` is not
actionable across 27 items.

A test written after the fix proves nothing about the fix.

### 5. Apply

Smallest change that hits the number.

- Shared across more than one page → a token or utility in `src/app/globals.css`. The
  `--page-grid-pad*` variables are the precedent.
- Single page → the component's own class, composed with `cn()` from
  `src/lib/utils/cn.ts`.

### 6. Verify

```bash
npx playwright test e2e/design-fidelity.spec.ts \
  --project=chromium --project=desktop-1920 --project=mobile-440
```

### 7. Flip status

In `QA_BY_PAGE.md`, for each row closed:

- Status → `FIXED`
- `Auto` → the new `file:line`
- Delete the row from that page's **Tests to write** list
- Decrement the page-index `Open` count, and update `Ready` if it changed

`scripts/qa-doc-check.mjs` enforces the first three and the count. It does **not** check
`Ready` — that one is on you.

### 8. Gate and commit

```bash
pnpm typecheck && pnpm lint && pnpm test
```

`pnpm test` runs the doc checker. Then one commit per slice:

```
fix(qa-<page>): <rows closed>
```

---

## Rules

| Rule                                      | Why                                                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Measurement beats prose**               | The report says hero spacing is "80–100px"; the frame says 80. The frame wins. This is the `design-token-fidelity` rule, restated because it is the one most often skipped under time pressure |
| **Never generalise a value across pages** | Finding 2 is what happens when you do                                                                                                                                                          |
| **No row goes `FIXED` without evidence**  | A test reference in `Auto`, or a measured value in `Manual`. "Looks right" is not a status                                                                                                     |
| **`GAP` xor `MANUAL-VISUAL`**             | Never both. The call is made when the row is written, not deferred into a fuzzy middle                                                                                                         |
| **Blocked stays untouched**               | Class E rows get no guessed values, no partial fixes, no code                                                                                                                                  |
| **One commit per slice**                  | A page's fix, its test and its status flip land together or not at all                                                                                                                         |

---

## Slices

### Slice 0 — Unblock

**No code.** Record the three pair verdicts in `.context/figma/node-resolution.md` and
the derived targets in `.context/figma/targets.md`. Closes owner-change tasks 2.4–2.8.

**Exit:** no page section in `QA_BY_PAGE.md` cites "pending Figma pair resolution".

---

### Slice 1 — Homepage

**Route** `/` · **Node** `6013:89909` · **Open** 4

| Row          | What                               | Notes                                                                                                                                                                     |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QA-HOME-A1` | Hero top/bottom spacing @1920      | Measured **80**, not the report's "80–100". Entangled with the deferred `max-width` decision — apply padding only                                                         |
| `QA-HOME-A2` | Mobile section spacing @440        | **Settled at 40.** The 32 is intra-section card-block pitch, not rhythm — see `targets.md`. Closed by `--spacing-section` across all four pages that share these sections |
| `QA-HOME-A3` | Section header weight + Title Case | Weight applied (`1c92a4e`). **Casing still unmeasured** — read it off the frame, do not assume Title Case                                                                 |
| `QA-HOME-A4` | Card title colour on hover         | Record both the resting and the hover token                                                                                                                               |

---

### Slice 2 — Blog

**Route** `/blog` · **Node** either (identical) · **Open** 3

| Row          | What                               | Notes                                                                               |
| ------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `QA-BLOG-A2` | Hero top/bottom spacing @1920      | Frame: hero band y=172 h=320                                                        |
| `QA-BLOG-A3` | Laptop side padding 128px @1280    | Already applied and verified in-browser — expect verify-and-close, not a fix        |
| `QA-BLOG-A4` | Section header weight + Title Case | `/blog` headings are already `font-bold`; the casing half may be the only real work |

---

### Slice 3 — Course Category

**Route** `/course-cat/[slug]` · **Node** either (identical) · **Open** 3

| Row         | What                               | Notes                                                                         |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `QA-CAT-A1` | Laptop side padding 128px @1280    | Same shared container fix as Blog                                             |
| `QA-CAT-A2` | Hero top/bottom spacing @1920      | Category hero is **480** tall, not All Courses' 320 — do not share the target |
| `QA-CAT-A3` | Section header weight + Title Case | Weight applied to `course-faq` h2 (`1c92a4e`); casing outstanding             |

---

### Slice 4 — All Courses

**Route** `/all-courses` · **Node** either (identical) · **Open** 2

| Row             | What                               | Notes                                                           |
| --------------- | ---------------------------------- | --------------------------------------------------------------- |
| `QA-COURSES-A2` | Hero top/bottom spacing @1920      | Hero band **320**                                               |
| `QA-COURSES-A3` | Section header weight + Title Case | Measure alongside slice 3 — same token question, different page |

Sidebar geometry for reference: 306 + 24 gutter + 966 grid = 1296 ✓

---

### Slice 5 — Checkout + Priority Support

**Routes** `/checkout`, `/support-request` · **Node** `NONE` for both · **Open** 3

| Row             | What                               | Notes                                                                                                                                                                     |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QA-CHECK-A1`   | Dropdown right padding 16px        | Currently `pr-10` (40px) on GF selects, because a custom chevron sits at `right-3`. Reducing padding without moving the chevron will overlap the text — fix both together |
| `QA-CHECK-A2`   | Section header weight + Title Case | Weight applied to all three checkout h2s (`1c92a4e`); those are `text-2xl` (24px), a size with **no measured token** — verify before closing                              |
| `QA-SUPPORT-A1` | Dropdown right padding 16px        | Same fix as `QA-CHECK-A1`; closes with it                                                                                                                                 |

Neither page has a Figma ref → derive the 16px from the live WP site per finding 3.

---

### Slice 6 — Contact + Cancellations

**Routes** `/contact-us`, `/cancellations` · **Node** `NONE` for both · **Open** 2

| Row             | What                          |
| --------------- | ----------------------------- |
| `QA-CONTACT-A1` | Hero top/bottom spacing @1920 |
| `QA-CANCEL-A1`  | Hero top/bottom spacing @1920 |

Both use the live-WP fallback. Record the URL and the measured value as the source, so
these rows can close rather than sitting `MANUAL-VISUAL` forever.

---

### Slice 7 — About Us

**Route** `/about-us` · **Node** `6239:102399` · **Open QA rows** 0

No QA-ID is open — both rows are `CONTENT-GAP`. This slice exists to settle finding 2.

**The decision:** the frame says 40px section headings are SUSE **Medium (500)**.
Commit `1c92a4e` set three of them to `font-bold`:

- `src/components/about/about-commitment-section.tsx:13`
- `src/components/about/about-team-section.tsx:24`
- `src/components/about/about-values-grid.tsx:10`

Options:

1. **Revert to `font-medium`** — matches the measured frame. The default, per the
   measurement-beats-prose rule.
2. **Keep bold** — requires a design ruling that supersedes the frame, recorded in
   `node-resolution.md` as an intentional deviation with its justification.

Do not leave it undecided: an unexplained contradiction between the frame and the code
is exactly the drift the fidelity spec exists to catch.

This slice is also where About Us's measured **1280 and 440** targets (the only page
that has them) get folded into the shared breakpoint ramp if they disagree with what
`globals.css` currently ships.

---

### Slice 8 — Close-out

1. **Class E ledger** — re-issue Appendix A's **12** blocked items to design/product, each
   with what specifically is missing. Anything still unanswered ships as
   `BLOCKED-DESIGN` with the code untouched, called out in the PR description.
2. **Class D** — file the outstanding proposals as their own OpenSpec changes. **Five as of
   2026-08-27**, down from the seven this list carried: Team Training page (no route at
   all), All Courses mobile (`QA-COURSES-D1`), Checkout section (`QA-CHECK-D1`), Single Blog
   mobile ToC drawer (`QA-BLOGS-D1`), Pricing third card (`QA-PRICE-D1`). Two left the list
   without a proposal — Category FAQ (`QA-CAT-D2`) was built since the report and is
   `FIXED`; the Blog and All Courses hero gradient (`QA-BLOG-D2`, `QA-COURSES-D2`) is
   `CANT-REPRODUCE` at 1920.
3. **Full gate** — see Verification below.
4. **PR description** — state which items measurement resolved, which stayed blocked,
   and what specifically is still needed for each.

---

## Verification

### Per slice

```bash
pnpm typecheck && pnpm lint && pnpm test          # pnpm test runs scripts/qa-doc-check.mjs
npx playwright test e2e/design-fidelity.spec.ts \
  --project=chromium --project=desktop-1920 --project=mobile-440
```

### Before the final commit

1. **Mutation-test the fidelity spec** — change one applied value, confirm it fails with
   the page/property/breakpoint/expected/observed message, revert. This is the only
   evidence the spec is not asserting a stylesheet against itself.
2. **Negative control** — change an _uncovered_ property on a covered page and confirm
   the spec still passes. Proves it has not drifted into de-facto visual regression.
3. **Checker** — delete a `GAP` row's "Tests to write" line and confirm `pnpm test`
   fails naming the page and QA-ID. Proves assertions 1–4 are live.
4. **Baseline** — **six** pre-existing E2E failures at `--project=chromium`, all unrelated
   to any open QA row: `smoke:9`, `auth-flow:15`, `cancellations:11`, `cancellations:28`,
   and the two `course-detail` head-tag tests (canonical, JSON-LD). Compare against that,
   not against zero.

   > Revised twice. `auth-flow:22` was on this list and now passes — it was flaky, not
   > broken. The two `course-detail` rows joined on 2026-08-14: both `test.skip` when no
   > course slug resolves, and the suite had been run without `NEXT_PUBLIC_WP_API_URL` in
   > the environment, so they skipped rather than failed. Both wait on a `<script>` /
   > `<link>` becoming _visible_, which a head or JSON-LD tag never is.
   >
   > **Restart the dev server before a full run, and use `--workers=2`.** On 2026-08-20 a
   > full run reported twelve failures — the six above plus six more, including three
   > "section headings use the bold H2 token" on three different pages, the homepage
   > overflow check, a card-hover check and `unknown slug returns 404`. All six passed
   > individually. Lowering the worker count did **not** fix it; **restarting `pnpm dev`
   > did**, and they passed at two workers afterwards.
   >
   > The cause is server state, not parallelism: a dev server that has hot-reloaded
   > through a session of CSS edits serves stale styles. The same thing bit the
   > `QA-COURSE-A7` marker fix earlier the same day — the browser kept reporting the old
   > `opacity: 0.6` until the server was restarted, which cost an hour of chasing a fix
   > that was already correct on disk.
   >
   > So: `pkill -f "next dev"`, start it fresh, then run. A stale-CSS failure looks
   > exactly like a regression in the summary line, and it lies in the direction that
   > wastes the most time — it says your correct change is broken.

   > **Load `.env.local` before an E2E run** (`set -a; . ./.env.local; set +a`) or the run
   > silently under-reports by skipping every test that needs a course.

   > **Superseded 2026-08-27: `playwright.config.ts` loads `.env.local` itself.** The
   > prefix above was a rule humans had to remember, and forgetting it was invisible —
   > **53 tests had been skipping in every full run**, including the three `QA-CHECK-*`
   > assertions whose rows read `FIXED` with a test reference, and the two `course-detail`
   > head-tag tests. A skip and a pass look identical in the summary line. Existing
   > environment still wins, so CI and one-off overrides are unaffected.

   > **The baseline is now 0.** Loading the environment took the count from 12 to 18 by
   > un-skipping two genuinely failing tests; fixing six stale specs took it to **1 flake**,
   > and that one (`qa-round-1 > the mega menu opens on hover`, desktop-1920) passed three
   > times out of three when re-run alone. What the six were:
   >
   > | Spec                                | Was asserting                                | Reality                                                                                                        |
   > | ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
   > | `course-detail` canonical + JSON-LD | `waitForSelector` default `state: "visible"` | A `<link>`/`<script>` in `<head>` is never visible — `state: "attached"`                                       |
   > | `auth-flow` login form              | `getByPlaceholder("Email")`                  | The field is labelled "Email or Username"; its placeholder is an example address                               |
   > | `smoke` courses page                | `/courses` is public                         | `/courses` is in the `(student)` group and is protected **by design** — the public catalogue is `/all-courses` |
   > | `cancellations` refund form         | `getByText("Request details")`               | Also matches the H2 "Refund request details" — strict-mode violation                                           |
   > | `cancellations` step 2              | heading "tell us where to reply"             | The wizard labels the reply fields directly; the heading no longer exists                                      |
   >
   > Every one failed on a working application. Compare a full run against **zero**, and
   > treat any failure as real until a re-run says otherwise.

   > **The "six" is a per-project number; `pnpm test:e2e` runs three.** On 2026-08-24 a
   > full run reported **16 failed / 94 skipped / 169 passed** and a warm re-run settled at
   > **12** — `smoke:9`, `auth-flow:15`, `cancellations:11` and `cancellations:28`, each
   > across `chromium`, `desktop-1920` and `mobile-440`. That is the same baseline, counted
   > three times. Compare a full run against **4 specs × 3 projects**, not against six.
   >
   > **Even warm, `page.goto` can time out under default parallelism.** On 2026-08-24 a
   > warm full run reported 16 — the 12 baseline plus four `chromium` design-fidelity
   > cases whose message was `page.goto: Test timeout of 30000ms exceeded`, not an
   > assertion. All four passed at `--workers=1` with no code change. The category and
   > blog routes fetch the whole catalogue server-side, so four workers hitting them at
   > once outruns one dev server. Read the failure's message before its name: a `goto`
   > timeout is contention, an `expect` with expected/observed is a regression.
   >
   > **A wiped `.next` adds cold-compile failures that are not regressions.** The four
   > extras in that run — three "section headings use the bold H2 token" (All Courses and
   > Course Category) and `QA-HOME-A13`, which failed on `#mobile-nav` "element(s) not
   > found" — all passed on a warm re-run with no code change. First hit on a route races
   > the dev server's compile. Either warm the routes first or re-run the failures before
   > believing them; a cold-compile failure reads exactly like the stale-CSS one above.

5. **Page index arithmetic** — every `Open` count matches the rows beneath it (checker
   assertion 4), **and** every `Ready` value reflects them (not machine-checked).

### Done

- Every open row is `FIXED` with evidence — **12 remain as of 2026-08-27**, down from the
  35 the 2026-08-14 reconciliation filed (and never the 15 this file once claimed)
- No `RED` page in the index has a non-blocked open row
- Appendix B's test backlog is empty — **2 tests owed** as of 2026-08-27, down from the 16
  the reconciliation filed
- Every item in `QA_REPORT_ITEMS.md` is cited by a row, and `pnpm test` proves it

---

## Maintenance

One rule, same as `QA_BY_PAGE.md`:

> A PR that changes a QA-ID's status updates its row in the same commit.

This file changes only when the **order** or the **method** changes — not when a page's
state does.
