## Purpose

A committed QA verification sheet organised by page — one section per page with a manual sweep checklist, an issue-row table with auto/manual coverage classification, and a test-backlog block — that serves as both the sign-off sheet for QA re-testing and the dev roadmap pointing at the OpenSpec change that owns each open row.

## ADDED Requirements

### Requirement: Single committed file for all pages

The verification sheet SHALL exist as one file at `docs/qa/QA_BY_PAGE.md`, committed to the repository. It SHALL NOT be split into per-page files.

#### Scenario: File exists and is committed

- **WHEN** a user clones the repository
- **THEN** `docs/qa/QA_BY_PAGE.md` is present and readable

### Requirement: Page index as roadmap

The document SHALL open with a page index table containing one row per QA-scoped page (17 total). Each row SHALL carry: page name, Next.js route, readiness state (`GREEN` / `AMBER` / `RED`), open row count, blocked row count, and the name of the OpenSpec change that owns the remaining work (or `—` when none).

Readiness states: `GREEN` = all rows closed · `AMBER` = only BLOCKED-DESIGN rows remain · `RED` = shippable work outstanding.

#### Scenario: Page index reflects issue rows beneath

- **WHEN** a page has zero rows that are neither `FIXED` nor `CANT-REPRODUCE`
- **THEN** its index row shows `GREEN` and `Open: 0`

#### Scenario: Blocked rows do not block GREEN

- **WHEN** a page has only `BLOCKED-DESIGN` rows outstanding
- **THEN** its index row shows `AMBER`, not `RED`

### Requirement: Per-page section structure

Each of the 17 page sections SHALL contain, in order:

1. **Metadata line** — route, Figma node with resolution state (`RESOLVED <id>` / `OPEN <a> vs <b>` / `NONE`), and any notes from the plan or progress doc.
2. **Manual sweep** — exactly 5 checkboxes: the four fixed lines (loads at 3 widths without layout break; zero console errors / failed requests; no collapsed or broken image boxes; header + footer render with nav interactive) plus one page-specific line for the page's primary function.
3. **Issue table** — one row per QA-ID with columns: QA-ID · Quote · BP · Class · Status · Auto · Manual.
4. **Tests to write** — one line per GAP row in this page's issue table; section omitted entirely when the page has no GAPs.

#### Scenario: Manual sweep fifth line varies per page

- **WHEN** the manual sweep block is written for any page
- **THEN** the fifth checkbox describes that page's primary function (e.g. "Pricing plans render all three cards and the CTA links work")

#### Scenario: Tests-to-write block absent when no GAPs

- **WHEN** a page section has no rows with `Auto = GAP`
- **THEN** the "Tests to write" block is not present in that section

### Requirement: Issue row schema

Each row in an issue table SHALL carry exactly these fields:

- `QA-ID` — format `QA-<PAGE>-<NN>`, preserved from the tracker verbatim, no renumbering
- `Quote` — verbatim from the source QA doc; abridged with `…` only above ~80 characters
- `BP` — one of: `1920` / `1280` / `440` / `all`
- `Class` — one of: A, B, C, D, E
- `Status` — one of: `STILL-BROKEN` · `FIXED` · `CANT-REPRODUCE` · `BLOCKED-DESIGN` · `CONTENT-GAP` · `RECLASSIFIED`
- `Auto` — exactly one coverage value (see coverage vocabulary requirement)
- `Manual` — one imperative sentence, or `—` when `Auto` holds a real test reference

#### Scenario: Manual field empty when test ref present

- **WHEN** a row's `Auto` column holds a `file:line` or unit-test file reference
- **THEN** that row's `Manual` column is `—`

### Requirement: Coverage vocabulary

The `Auto` column SHALL hold exactly one of the following values per row:

| Value                             | Meaning                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `` `e2e/qa-round-1.spec.ts:74` `` | Existing E2E test at that file and line                                          |
| `` `price.test.ts` ``             | Existing unit test (file only, no line needed)                                   |
| `GAP`                             | Mechanically assertable; no test exists yet                                      |
| `MANUAL-VISUAL`                   | Judgement call — Figma fidelity, colour, visual balance; will never be automated |
| `N/A`                             | Row is `CONTENT-GAP` or `BLOCKED-DESIGN`; nothing to assert                      |

A row SHALL NOT simultaneously carry `GAP` and `MANUAL-VISUAL`.

#### Scenario: GAP invariant enforced

- **WHEN** a row's issue is mechanically assertable but no test exists
- **THEN** `Auto = GAP` and `MANUAL-VISUAL` does not appear on that row

#### Scenario: MANUAL-VISUAL for subjective checks

- **WHEN** a row's issue requires human visual judgement (colour contrast, spacing "looks right", Figma pixel fidelity)
- **THEN** `Auto = MANUAL-VISUAL` and `GAP` does not appear on that row

### Requirement: Homepage section populated first

The Homepage section (`QA-HOME-*`) SHALL be the first page section in the document and SHALL contain all issue rows sourced from the QA report, including Class B rows already marked `FIXED` (with their test reference in `Auto`) and Class E rows marked `BLOCKED-DESIGN`.

#### Scenario: Fixed Class B rows present with test ref

- **WHEN** a homepage issue was fixed in round 1 (e.g. QA-HOME-B1 pricing quantity)
- **THEN** its row appears with `Status = FIXED` and `Auto` citing the specific test

### Requirement: Tracker superseded on completion

When the document is complete and committed, `.context/qa-tracker.md` SHALL be deleted in the same commit. Every row from the tracker SHALL appear in exactly one page section before deletion.

#### Scenario: No data lost during migration

- **WHEN** `.context/qa-tracker.md` is deleted
- **THEN** every QA-ID that existed in the tracker is present in `docs/qa/QA_BY_PAGE.md`
