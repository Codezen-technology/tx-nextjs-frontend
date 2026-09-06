# QA Report — Execution Plan

**Date:** 2026-08-07
**Source:** [QA Report (Google Doc)](https://docs.google.com/document/d/1jEH8XZCVGtwbOOix-Y2Uk--3FdFks4jOLwNPf3cAl0M/edit)
**Figma file:** `VoTEBKr8x4fWlObjkr7RXg` — Training Excellence Website UI/UX
**Scope:** ~80 raw items across 17 page sections, tested at 1920 / 1280 / 440
**Branch:** `qa-report-execution-plan` (Phase 1) → `fix/qa-report-round-1` (Phase 2)

All counts below are provisional. The triage pass in Phase 1 is what makes them real.

---

## 1. Decisions

| #      | Decision                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| **D1** | Write the plan first, then execute. The QA doc is not directly executable — see §2.                            |
| **D2** | Triage on **deployed** → fix and verify on **local** → QA re-tests on **deployed** after merge.                |
| **D3** | Figma-vs-live comparison is the engine, not the QA screenshots. Divergent Figma sets resolved **per page**.    |
| **D4** | Five classes, three tracks: **A+B+C ship**, **D scoped then split out**, **E routed to design**.               |
| **D5** | OpenSpec change per track, plus `.context/qa-tracker.md` as the working grid. IDs `QA-<PAGE>-<NN>`.            |
| **D6** | Rebase onto `main`; cut `fix/qa-report-round-1`. ~6 PRs sequenced by risk. Header lands early.                 |
| **D7** | Tiered verification — tests for Classes B and C, screenshot comparison for Class A.                            |
| **D8** | Resolve token/contrast/Figma-measurable items directly; escalate 7 to design; blocked ⇒ untouched and flagged. |

---

## 2. Why the report needs a triage pass

The QA doc cannot be worked straight through. Six problems, all verified:

### 2.1 Issue numbering collides

Homepage alone contains four `Issue 7`, two `Issue 4`, two `Issue 5`. About Us has two `Issue 1`. Numbers also restart per breakpoint. There is no stable identifier to cite in a commit, a PR, or a sign-off. **IDs are reassigned** — see §5.

### 2.2 Every screenshot is stripped

The doc exports as `[image]`. Roughly 20 issues are only resolvable by seeing the marked area:

> "The marked pattern is missing" · "This section took too much space" · "The icon color is not visible" · "the spacing in the marked area" · "there won't be any Button in the marked area"

Resolved by **D3**: compare the Figma node against the live page rather than decoding the annotation. Escalate only where that genuinely can't disambiguate.

### 2.3 The Figma links are ambiguous

None of the doc's 13 Figma node IDs appear on canvas `20:356` ("Pages"). Verified against the full subtree dump — 4171 lines, closing `</canvas>` present, depth 15, not truncated.

The two sets **duplicate each other**:

| Page        | QA doc links                                                          | Canvas `Pages` has                                    |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Homepage    | `4571:10560` — frame "Homepage - Redesigned", 1920×**7150**           | `6013:89909` — "Homepage - Redesigned", 1920×**7055** |
| Blog        | `4900:75788`, in section "Blog Page responsive" on canvas `3844:4263` | `6015:127034` "Blog page"                             |
| Blog single | `4040:11134`                                                          | `6015:127141`                                         |
| All Courses | `3306:50109`                                                          | `6015:96163` "All Course Pages **v2**"                |
| Category    | `3294:42427`                                                          | `6015:108699`                                         |
| About Us    | `6239:102399`                                                         | `6015:129608`                                         |

Figma node IDs increase monotonically with creation. For Homepage, All Courses, Category, Blog and Blog-single the doc links the **lower-numbered, older** node — suggesting parts of this QA pass measured against superseded designs. But About Us goes the other way (`6239` > `6015`), so the pattern is **mixed**. Hence per-page resolution rather than picking one set wholesale.

### 2.4 Three link errors in the doc

- **`6239:110952` is cited for three different pages.** It resolves to section "Certificate verification page" (Desktop 1920 / Laptop 1280 / Mobile 440). Correct for **Verify Certificate**; wrong for **Cancellations and Refunds** and **Priority Support** — those two have **no valid design reference**.
- **Privacy Policy** cites `3633:58383`, which is the **Single Course Page** node. Its "Page Link" field is also a Figma URL rather than a site URL.
- **About Us** has an issue reading "The images are not visible on this page" whose solution reads "**No need of breadcrumbs**" — copy-pasted from the issue above it.

### 2.5 Two solutions are blank

- **FAQ/Help** — "The hero section is different from the actual figma design." → `Solution(Dev):` empty.
- **Single Course, mobile** — "Rating" → `Solution(Dev):` empty.

### 2.6 Design intent contradicts itself

About Us says _"No need of breadcrumbs."_ The Certificate Verification desktop frame contains a `Breadcrumb` instance (`6239:110995`). Needs one ruling applied site-wide.

---

## 3. Environment findings

### 3.1 Deployed is current with `main`

`https://backend.trainingexcellence.org.uk/course-cat/animal-care-training` returns `<title>Animal Care Courses - Training Excellence</title>` with a real meta description, and the blog post canonical is per-post rather than site root. Those are precisely the two defects `5babf22` fixed.

⇒ deployed ⊇ `main` HEAD, including `046b049`. **Triage on deployed measures against current code**, so "already fixed / can't reproduce" is answerable per issue at no extra cost.

### 3.2 Local WP is prod-like

`GET https://tx-local-site.test/wp-json/lms-backend/v1/courses` returns real courses with featured images on `trainingexcellence-media.s3.eu-west-2.amazonaws.com` — the same media as production. Local verification will not produce false negatives on the image issues.

### 3.3 The image failures are not a config problem

`next.config.mjs:49` already allowlists `trainingexcellence-media.s3.eu-west-2.amazonaws.com` explicitly. Media exists, host is permitted. So each of the ~8 image failures is either a **component bug** (`fill` without a sized parent, wrong field read, conditional render) or a **per-page content gap**. No global fix — each needs its own verdict.

### 3.4 Playwright cannot currently test the reported widths

`playwright.config.ts:13` defines a single project: `chromium` on default Desktop Chrome (1280×720). The QA pass covers 1920, 1280 and 440. **1920 and 440 projects must be added** before any of Phase 2's verification is meaningful.

### 3.5 `header-acf-content` overlaps this work

That OpenSpec change is **0/20 tasks** — proposed, unstarted. It touches the header, as do the QA navbar-dropdown and mega-menu issues. **The QA header fixes land first** (PR 3), so the ACF work rebases onto a fixed header rather than the reverse. Nothing to conflict with while it's at 0/20.

### 3.6 Housekeeping

`fix-seo-metadata-defects` is **41/43 tasks, merged into `main`, not archived**. Archive it before starting or `openspec/changes/` misrepresents what's in flight.

---

## 4. Issue classification

| Class | What                   | Count | Blocker        | Track                  |
| ----- | ---------------------- | ----- | -------------- | ---------------------- |
| **A** | CSS / token fixes      | ~30   | none           | Ships — PRs 5, 6       |
| **B** | Functional bugs        | 6     | none           | Ships — PR 2 (+ PR 3)  |
| **C** | Missing images         | ~8    | none           | Ships — PR 4           |
| **D** | Net-new builds         | ~8    | needs sizing   | Split out, not round 1 |
| **E** | Needs a human decision | 7     | design/product | Escalated              |

### Class A — CSS / token fixes (~30)

`line-height: 150%` (Privacy Policy, Single Course) · hero top/bottom spacing 80–100px · mobile section spacing 40px · laptop side padding 128px (Single Blog, Category) · dropdown right padding 16px (Checkout, Priority Support) · section header weight and Title Case · card title colour stable on hover · unselected checkboxes white + subtle border, selected `Secondary 500` · 80px between final CTA and footer (Blog) · Verify Certificate field white bg + subtle border · related-course section title sizing · Cart card content parity with Figma.

Mechanical, low risk, largest share of the issue count.

### Class B — functional bugs (6)

These are the ones that cost money:

1. **Homepage — quantity increases, amount does not.** Pricing bug.
2. **Single Course — CTA routes to `/checkout`, should route to `/cart`.** Bypasses the cart entirely.
3. **Single Blog — table of contents anchors do not scroll to the clicked heading.**
4. **Navbar dropdown opens on click, should open on hover.** (→ PR 3, with the header.)
5. **Homepage — certificate and transcript not rendering.**
6. **Blog card — month names overflow.** Short form (Jan, Feb, Mar).

### Class C — missing images (~8)

Homepage ×2 · About Us ×2 · Category "Why Choose Us" (desktop + mobile) · Blog hero · Single Blog hero · Single Course. Per §3.3, each gets a **component-bug vs content-gap** verdict during triage. Content gaps leave this repo.

### Class D — net-new builds, mislabelled as fixes (~8)

Not QA defects. Each becomes its own OpenSpec change, proposed but unstarted:

- **Team Training page — does not exist at all.** No Figma link in the doc either.
- **All Courses mobile — "There are huge mobile responsive issues… needs to be done properly."** One doc line; unbounded. Could be a full day. Sized in Phase 1, not committed to here.
- Pricing — add the missing **third pricing card**
- Checkout — add the section present in Figma, absent in build
- Category — add an FAQ section under the courses
- Blog and All Courses — hero gradient and bottom pattern
- Single Blog mobile — sticky bottom ToC opening as a floating drawer (design `4146:87332`)

### Class E — needs a human decision (7)

**Resolvable without a designer** — handled directly, derivation recorded in the tracker:

`globals.css:21-52` carries Figma-sourced tokens (see the comment at `:514` citing Figma node `83:4218`), including `--color-secondary-500: #9e6f21`. That answers the checkbox colour outright. Also self-resolving: the pound symbol (doc already specifies **Inter**), icon colours ×3 (pick the token clearing 4.5:1), the too-dark hover (lighter neutral meeting contrast), the Verify Certificate field (doc already specifies white + subtle border), the mobile hero text field (measure the 440 Figma frame), the Cancellations button label contrast, and the Homepage mobile CTA (`"move to bottom of section"` is unambiguous).

**Genuinely blocked** — escalated as a single numbered list with PR 1:

| #   | Issue                         | What's needed                                                     |
| --- | ----------------------------- | ----------------------------------------------------------------- |
| 1   | Homepage search button        | "shape and color needs to be fixed" — no target given             |
| 2   | Homepage section spacing      | "took too much space… more standard and middle align" — no target |
| 3   | Pricing — same bg colours     | Which two sections move where                                     |
| 4   | Pricing — "remove section"    | **Product call, not design.** Routed separately — see §7          |
| 5   | Cart mobile                   | Doc offers two options and picks neither. Pick one                |
| 6   | FAQ/Help hero                 | `Solution(Dev):` blank                                            |
| 7   | Single Course mobile "Rating" | `Solution(Dev):` blank                                            |

Unanswered at ship time ⇒ **code left untouched**, tracker row `BLOCKED-DESIGN`, called out in the PR description. Nothing gets guessed.

---

## 5. Issue IDs

The doc's numbering is unusable (§2.1). Reassigned as `QA-<PAGE>-<NN>`, sequential per page across all breakpoints:

```
QA-HOME-01 …      QA-ABOUT-01 …     QA-BLOG-01 …      QA-BLOGS-01 …   (single blog)
QA-CONTACT-01 …   QA-CAT-01 …       QA-COURSES-01 …   (all courses)
QA-COURSE-01 …    QA-PRIVACY-01     QA-HELP-01 …      QA-CART-01 …
QA-CHECK-01 …     QA-PRICE-01 …     QA-VERIFY-01 …    QA-CANCEL-01 …
QA-SUPPORT-01 …   QA-TEAM-01        (Team Training — page absent)
```

Each tracker row carries:

| Field      | Contents                                                                       |
| ---------- | ------------------------------------------------------------------------------ |
| `QA-ID`    | stable identifier                                                              |
| Quote      | verbatim from the doc                                                          |
| Breakpoint | 1920 / 1280 / 440                                                              |
| Class      | A–E                                                                            |
| Figma node | resolved per §2.3                                                              |
| Target     | file / component                                                               |
| Status     | `STILL-BROKEN` · `FIXED` · `CANT-REPRODUCE` · `BLOCKED-DESIGN` · `CONTENT-GAP` |
| Evidence   | test name, or before/after screenshot                                          |

**Location:** `.context/qa-tracker.md` — gitignored working state. The full 80-row grid with screenshots is not spec material. The distilled actionable list goes into the OpenSpec change's `tasks.md`.

---

## 6. Phases

### Phase 1 — Triage (no code)

1. Archive `fix-seo-metadata-defects` (§3.6). Rebase onto `main`.
2. Build `.context/qa-tracker.md` — one row per issue, per §5.
3. **Resolve the divergent Figma nodes.** Render each pair side by side; **6 decisions required from the team**. Start with Homepage (`4571:10560` vs `6013:89909`) — it is both the largest section (~21 issues) and a divergent one.
4. Sweep deployed at 1920 / 1280 / 440. Screenshot each reported page. Mark every issue `STILL-BROKEN` / `FIXED` / `CANT-REPRODUCE`.
5. For each Class C image failure, record the component-bug vs content-gap verdict (§3.3).
6. Emit the design-questions list — the 7 items in §4, one line each.
7. Emit Class D scoping and sizing, especially Team Training and All Courses mobile.

**Output — PR 1:** tracker, resolved Figma nodes, design questions, Class D proposals. Documentation only, no code.

### Phase 2 — Fix

Branch `fix/qa-report-round-1` off `main`.

| PR    | Contents                                                                                                                        | Verification                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **2** | **Class B — functional bugs.** Quantity×price; CTA `/checkout`→`/cart`; ToC anchors; month short-form; certificate + transcript | Vitest (pure logic) + Playwright (routing, interaction) |
| **3** | **Header / navbar** — dropdown on hover, mega menu. Lands before `header-acf-content` starts                                    | Playwright                                              |
| **4** | **Class C — images**, component-bug subset only                                                                                 | Playwright: resolves + non-zero layout box              |
| **5** | **Class A — marketing pages**                                                                                                   | Screenshots ×3 widths vs Figma                          |
| **6** | **Class A — shop + account pages**                                                                                              | Screenshots ×3 widths vs Figma                          |

Early in Phase 2, before PR 2 merges: **add 1920 and 440 viewport projects to `playwright.config.ts`** (§3.4).

**Why this split:** it isolates the two things that can actually break production — the pricing/cart bugs and image rendering — from ~30 spacing changes a reviewer should skim in one pass. One PR of 44 issues across 17 pages does not get reviewed honestly.

**Definition of done, per issue:** fixed → verified at its own breakpoint → tracker row carries evidence → QA re-tests on deployed after merge, since deployed is where they filed it.

### Verification tiers (D7)

| Class | Approach                                                  | Rationale                                                         |
| ----- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| **B** | Vitest + Playwright                                       | Assertable logic; these regress silently                          |
| **C** | Playwright — image resolves, non-zero box                 | Catches the real failure without pinning pixels                   |
| **A** | Screenshot vs Figma at the issue's breakpoint, in tracker | Asserting `line-height: 150%` tests the stylesheet against itself |

Full visual-regression across 17 pages × 3 widths is deliberately rejected: it fails on every legitimate design change and gets `--update-snapshots`'d into meaninglessness within a month.

---

## 7. Out of round 1

- **All of Class D** — proposed as separate OpenSpec changes, unstarted.
- **Pricing "remove this section"** — scope removal from a live page is a product/business decision, not a designer's. Routed separately and excluded by default.
- Anything still `BLOCKED-DESIGN` at ship time — code untouched, listed explicitly in the PR description.

---

## 8. Risks

| Risk                                                                                                                  | Handling                                                             |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Phase 1 step 3 blocks Phase 2.** The 6 Figma decisions belong to the team, and Homepage (~21 issues) is one of them | Front-loaded as the first triage action                              |
| **"All Courses mobile done properly"** is one doc line and may be a full day                                          | Sized in Phase 1; not committed to before then                       |
| **Class C may resolve to content gaps** for several issues                                                            | That work leaves this repo; recorded as `CONTENT-GAP` and handed off |
| **Parts of the QA pass may have measured against stale designs** (§2.3)                                               | Per-page Figma resolution before any fix is written                  |
| **Cancellations, Priority Support and Privacy Policy have no valid design reference** (§2.4)                          | Escalate for correct Figma links, or fix against live behaviour only |
