## Purpose

A script and Vitest wrapper that asserts structural invariants of `docs/qa/QA_BY_PAGE.md` against the codebase on every test run, so that `file:line` test references cannot rot silently and the GAP/backlog/count invariants cannot drift.

## Requirements

### Requirement: Checker runs on every test suite

The checker SHALL be wired into `pnpm test` via a Vitest test file at `src/__tests__/qa-doc-check.test.ts`. It SHALL execute as part of the normal test suite without requiring a separate command.

#### Scenario: Suite includes checker automatically

- **WHEN** a developer runs `pnpm test`
- **THEN** the qa-doc-check assertions run alongside unit tests and report failures in the same output

### Requirement: Test reference resolution

For every `Auto` cell that holds a `file:line` reference or a bare filename, the checker SHALL assert:

1. The file exists on disk.
2. For a `file:line` reference, the referenced line contains `test(` or `it(`.

#### Scenario: Stale file:line reference detected

- **WHEN** a spec file is reordered and a `file:line` reference no longer points to a `test(` call
- **THEN** the checker fails and names the page, the QA-ID, the stale reference, and the actual content at that line

#### Scenario: Missing file detected

- **WHEN** an `Auto` reference names a file that does not exist in the repository
- **THEN** the checker fails and names the page, the QA-ID, and the missing path

### Requirement: GAP / MANUAL-VISUAL invariant

The checker SHALL assert that no row simultaneously carries `GAP` and `MANUAL-VISUAL` in its `Auto` column.

#### Scenario: Invariant violation detected

- **WHEN** a row's `Auto` column contains both `GAP` and `MANUAL-VISUAL` (malformed)
- **THEN** the checker fails and names the page and the QA-ID

### Requirement: GAP ↔ backlog parity

The checker SHALL assert that every row with `Auto = GAP` appears in that page's "Tests to write" section, and that no QA-ID appears in a "Tests to write" section without a matching `GAP` row in the same page's issue table.

#### Scenario: GAP row missing from backlog

- **WHEN** a row is marked `Auto = GAP` but its QA-ID does not appear in the page's "Tests to write"
- **THEN** the checker fails naming the page and QA-ID

#### Scenario: Backlog entry without matching GAP

- **WHEN** a QA-ID appears in "Tests to write" but the same page has no row with `Auto = GAP` for that ID
- **THEN** the checker fails naming the page and QA-ID

### Requirement: Page index count accuracy

The checker SHALL assert that the `Open` and `Blocked` counts in the page index row match the actual counts of non-closed and `BLOCKED-DESIGN` rows in the page's issue table respectively.

Closed = `FIXED` or `CANT-REPRODUCE`. Open = any other status.

#### Scenario: Index count mismatch detected

- **WHEN** the page index shows `Open: 4` but the issue table has 5 rows that are neither `FIXED` nor `CANT-REPRODUCE`
- **THEN** the checker fails naming the page, the expected count, and the actual count

### Requirement: Actionable failure messages

All checker failures SHALL include: page name, QA-ID (when applicable), the specific invariant that was violated, and the observed vs expected values. A bare "count mismatch" or "assertion failed" is not acceptable output.

#### Scenario: Failure message is actionable

- **WHEN** the checker fails on a count mismatch
- **THEN** the output reads: `[Homepage] page-index Open count: expected 3, found 5 (rows with open status: QA-HOME-E1, QA-HOME-E2, QA-HOME-A1, QA-HOME-A2, QA-HOME-A3)`
