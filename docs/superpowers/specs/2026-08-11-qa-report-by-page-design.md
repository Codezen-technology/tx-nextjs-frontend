# QA Report — Page-Wise Verification Sheet

**Date:** 2026-08-11
**Branch:** `qa-report-progress-tracker` (target `origin/qa-report-execution-plan`)
**Source report:** [QA Report (Google Doc)](https://docs.google.com/document/d/1jEH8XZCVGtwbOOix-Y2Uk--3FdFks4jOLwNPf3cAl0M/edit)
**Supersedes:** `.context/qa-tracker.md`

---

## 1. Problem

The QA report has three artifacts and none of them answer the question a person
actually asks when they open a page.

| Artifact                                   | Organized by       | Answers                             |
| ------------------------------------------ | ------------------ | ----------------------------------- |
| `.context/attachments/…/QA_REPORT_PLAN.md` | class (A–E)        | how the whole report gets worked    |
| `QA_REPORT_PROGRESS.md`                    | class              | what shipped, and why it was broken |
| `.context/qa-tracker.md`                   | class, then status | which rows are still open           |

Three problems follow from that:

1. **No page-level answer.** "Is the Blog page done?" requires reading five
   tables in three files and cross-referencing by ID prefix. QA re-tests page by
   page, because that is how a browser works.
2. **No auto/manual boundary.** Nothing records which rows a machine already
   guards and which need a human to look. So either everything gets re-checked
   by hand, or coverage is assumed where none exists.
3. **The tracker is gitignored.** `.context/` is working state. A sign-off sheet
   QA reads cannot live there.

## 2. Goal

One committed document, organized by page, that serves two readers:

- **QA** — walk a page, run its manual sweep, tick its issue rows, sign it off.
- **Dev** — see which pages still hold shippable work, and which OpenSpec change
  owns it.

Non-goal: fixing any QA item, writing any missing test, or altering the three
in-flight OpenSpec changes.

## 3. Decisions

| #      | Decision                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| **D1** | One committed file, `docs/qa/QA_BY_PAGE.md`. Not 17 files — greppable, one diff per update.                     |
| **D2** | It **supersedes** `.context/qa-tracker.md`, which is deleted in the same change. Rows migrate; nothing is lost. |
| **D3** | Scope is the 17 pages in the source report (listed below). Every row traces to a QA quote — no invented checks. |
| **D4** | Auto-first: anything mechanically assertable gets a test or a `GAP`. `MANUAL-VISUAL` is reserved for judgement. |
| **D5** | Per page: issue table **plus** a page-level manual sweep. Two different questions, run at different times.      |
| **D6** | The roadmap is a **view over existing OpenSpec changes**, not a rival plan. Each open row names its owner task. |
| **D7** | A checker script enforces the doc against the codebase, so `file:line` refs cannot rot silently.                |

### D3 — the 17 pages

| ID prefix    | Page               | Route                                                                           |
| ------------ | ------------------ | ------------------------------------------------------------------------------- |
| `QA-HOME`    | Homepage           | `/`                                                                             |
| `QA-ABOUT`   | About Us           | `/about-us`                                                                     |
| `QA-BLOG`    | Blog               | `/blog`                                                                         |
| `QA-BLOGS`   | Single Blog        | `/blog/[slug]`                                                                  |
| `QA-CONTACT` | Contact            | `/contact-us`                                                                   |
| `QA-CAT`     | Course Category    | `/course-cat/[slug]`                                                            |
| `QA-COURSES` | All Courses        | `/all-courses`                                                                  |
| `QA-COURSE`  | Single Course      | `/course/[slug]`                                                                |
| `QA-PRIVACY` | Privacy Policy     | `/privacy-policy`                                                               |
| `QA-HELP`    | FAQ / Help         | `/help`                                                                         |
| `QA-CART`    | Cart               | `/cart`                                                                         |
| `QA-CHECK`   | Checkout           | `/checkout`                                                                     |
| `QA-PRICE`   | Pricing            | `/pricing`                                                                      |
| `QA-VERIFY`  | Verify Certificate | `/verify-certificate`                                                           |
| `QA-CANCEL`  | Cancellations      | `/cancellations`                                                                |
| `QA-SUPPORT` | Priority Support   | `/support-request`                                                              |
| `QA-TEAM`    | Team Training      | **does not exist** — Class D, page section records the absence and nothing else |

### D4 rationale

Marking something `MANUAL` that a five-line Playwright assert covers is how a
regression returns. `e2e/qa-round-1.spec.ts` already demonstrates the pattern for
Class B and C.

The counterpart holds too: Class A pixel fidelity stays manual by policy. Plan
§D7 rejected full visual regression across 17 pages × 3 widths — it fails on
every legitimate design change and gets `--update-snapshots`'d into meaninglessness.
The one exception is the target-table fidelity spec already built under
`qa-class-a-design-fidelity` §6, which asserts computed values against measured
Figma numbers rather than pixels. Rows covered by it cite it and are not manual.

### D6 rationale

`qa-class-a-design-fidelity` is 15/43 and its §5 already applies Class A one
commit per page. Its §2 has resolved three of the six divergent Figma pairs by
measurement, so the "six team decisions" blocker recorded in the plan is
partially dissolved and shrinking. Inventing a second page-ordered PR sequence
would fork the work. The doc points at that change instead.

## 4. Structure

```
docs/qa/QA_BY_PAGE.md

  # QA Report — By Page
  ├─ How to use              — QA path vs dev path, when each runs
  ├─ Environment             — the two hosts and which is which (§4.1)
  ├─ Viewports               — 1920 / 1280 / 440 ↔ playwright project names
  ├─ Legend                  — status + coverage vocabulary (§5)
  ├─ Page index              — 17 rows, readiness + owner (§6)
  │
  ├─ 17 × page section       — (§7)
  │     ├─ metadata          — route, Figma node + resolution state, notes
  │     ├─ Manual sweep      — 5 checkboxes, once per page at 3 widths
  │     ├─ Issue table       — one row per QA-ID
  │     └─ Tests to write    — the page's GAP rows; omitted when empty
  │
  ├─ Appendix A — Blocked ledger        — 7 design items + remaining Figma pairs
  └─ Appendix B — Test backlog roll-up  — every GAP, in ship order
```

### 4.1 Environment block

The doc's Environment section states both hosts outright, because the names
invite exactly the wrong reading:

| Host                                        | What it is                                                      | Used for                                                         |
| ------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `https://backend.trainingexcellence.org.uk` | **The deployed headless frontend** — this Next.js app           | QA triage and re-test. Where every issue in the report was filed |
| `https://trainingexcellence.org.uk`         | **WordPress** — the CMS and REST API, also the live legacy site | Behaviour/data reference; the `/wp-json/*` origin                |
| `https://tx-local-site.test`                | Local WordPress, prod-like media (plan §3.2)                    | Local verification while fixing                                  |

Despite the name, `backend.` serves no `/wp-json/*` — every such path there
404s. Plan §3.1 conflated the two and ran its checks against the wrong host;
progress §8 recorded the correction. The Environment block exists so a QA person
opening a page tests the right origin without needing that history.

**Every manual sweep and issue row is verified on `backend.trainingexcellence.org.uk`**
unless the row says otherwise, matching where QA filed it (plan §D2).

## 5. Vocabulary

### Status — unchanged from the tracker, plus one

`STILL-BROKEN` · `FIXED` · `CANT-REPRODUCE` · `BLOCKED-DESIGN` · `CONTENT-GAP` · `RECLASSIFIED`

`RECLASSIFIED` already occurs in practice — the Blog hero moved from Class C to
Class D once it turned out to be a CSS gradient with no `<img>` at all. The
tracker had no word for it.

### Coverage — the `Auto` column, exactly one value

| Value                         | Meaning                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `` `qa-round-1.spec.ts:74` `` | Existing E2E test, `file:line`                                         |
| `` `price.test.ts` ``         | Existing unit test, file only                                          |
| `GAP`                         | Assertable, no test yet. Mirrored into that page's "tests to write"    |
| `MANUAL-VISUAL`               | Judgement call — Figma fidelity, colour, "looks cramped". Never a test |
| `N/A`                         | Row closed as `CONTENT-GAP` or `BLOCKED-DESIGN`; nothing to assert     |

**Invariant:** a row is never both `GAP` and `MANUAL-VISUAL`. The call gets made
when the row is written, not deferred into a fuzzy middle.

## 6. Page index

The roadmap entry point. One row per page:

| Column       | Contents                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------- |
| Page         | Name as it appears in the source report                                                     |
| Route        | Next.js route                                                                               |
| Ready        | `GREEN` all rows closed · `AMBER` only blocked rows left · `RED` shippable work outstanding |
| Open         | Count of rows not `FIXED` / `CANT-REPRODUCE`                                                |
| Blocked      | Count of `BLOCKED-DESIGN` rows                                                              |
| Owner change | OpenSpec change + task number that closes the open rows, or `—`                             |

Ship order = `RED` pages by descending open count. Blocked rows do not count
toward that ordering, since they cannot be worked.

Three pages carry `AMBER — no design ref`: Cancellations, Priority Support and
Privacy Policy (plan §2.4 — the doc cites a wrong or absent node for each). They
are fixed against live behaviour only, and that is recorded rather than treated
as a temporary state.

## 7. Page section

### Metadata line

Route · Figma node and its resolution state (`RESOLVED <id>` / `OPEN <a> vs <b>` /
`NONE`) · any page-specific note carried from the plan or progress doc.

### Manual sweep

Fixed shape, run once per page at all three widths:

```
- [ ] Loads at 1920 / 1280 / 440, no layout break
- [ ] Zero console errors, zero failed network requests
- [ ] No collapsed (0×0) or broken image boxes
- [ ] Header + footer render, nav interactive
- [ ] <page-specific — e.g. filters return results / form submits / player loads>
```

The fifth line is the only one that varies. Four fixed lines keep the sweep
comparable across pages; the fifth is where the page's primary function gets
exercised.

### Issue table

| Column  | Contents                                                                  |
| ------- | ------------------------------------------------------------------------- |
| `QA-ID` | `QA-<PAGE>-<NN>` — existing IDs preserved verbatim, no renumbering        |
| Quote   | Verbatim from the source doc; abridged with `…` only above ~80 characters |
| BP      | `1920` / `1280` / `440` / `all`                                           |
| Class   | A–E                                                                       |
| Status  | §5                                                                        |
| Auto    | §5                                                                        |
| Manual  | One imperative sentence, or `—` when `Auto` holds a real test reference   |

### Tests to write

The page's `GAP` rows, one line each: QA-ID, what to assert, which spec file it
belongs in. Section omitted entirely when the page has no gaps, so its presence
is itself a signal.

## 8. Checker

`scripts/qa-doc-check.mjs`, wired into `pnpm test` as a Vitest case so it runs on
every suite rather than needing to be remembered.

Four assertions:

1. Every `Auto` test reference resolves to an existing file, and for a
   `file:line` reference that line contains `test(` or `it(`.
2. No row is both `GAP` and `MANUAL-VISUAL` (§5 invariant).
3. Every `GAP` row appears in its page's "tests to write" list.
4. Page-index `Open` and `Blocked` counts match the rows beneath them.

Assertion 1 is the one that earns the script. References are `file:line`, and
line numbers move the first time anyone reorders a spec — a stale reference
reads as coverage that does not exist, which is worse than a recorded gap.

Failure messages name the page, the QA-ID and the specific mismatch. A bare
"count mismatch" across 17 pages is not actionable.

## 9. Maintenance

One rule, stated in the doc and enforced at review:

> A PR that changes a QA-ID's status updates its row in the same commit.

Single source of truth for status, so there is no reconciliation step and no
second place to forget. `QA_REPORT_PROGRESS.md` keeps a different job: the
narrative of what shipped and why it broke — the `w-auto` collapse analysis, the
prod-vs-local pricing shapes. Those are not page-scoped and do not move.

## 10. Deliverables

**New**

- `docs/qa/QA_BY_PAGE.md`
- `scripts/qa-doc-check.mjs`
- `src/__tests__/qa-doc-check.test.ts` — runs the checker under Vitest

**Deleted**

- `.context/qa-tracker.md` — rows migrated into the new doc

**Unchanged**

- `QA_REPORT_PROGRESS.md`, the execution plan, and all three in-flight OpenSpec
  changes

## 11. Risks

| Risk                                                                                       | Handling                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The doc drifts from the tracker's rows during migration                                    | Migration is mechanical — every tracker row lands in exactly one page section, and the row count is asserted before the tracker is deleted                                                   |
| `file:line` references rot                                                                 | Checker assertion 1                                                                                                                                                                          |
| Page index counts drift from the rows below                                                | Checker assertion 4                                                                                                                                                                          |
| It becomes a third artifact people update instead of the tracker, rather than replacing it | The tracker is deleted in the same commit. There is nothing else to update                                                                                                                   |
| `qa-class-a-design-fidelity` resolves more Figma pairs while the doc is being written      | Resolution state is a per-page metadata field, not a separate table — one line changes                                                                                                       |
| The source report's ~80 rows exceed what the current tracker holds                         | The tracker's actionable rows migrate; the remainder are transcribed from the source doc during the same pass, which is the outstanding "build the verbatim 80-row grid" item in progress §7 |
