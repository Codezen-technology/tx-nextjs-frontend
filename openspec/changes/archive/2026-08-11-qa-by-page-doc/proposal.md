## Why

The QA report's three existing artifacts (plan, progress checklist, gitignored tracker) are all organised by issue class (A–E), so answering "is the Homepage done?" requires reading five tables across three files. Nothing records which rows a machine already guards and which need a human eye, and the tracker that holds live status is gitignored — unusable as a sign-off sheet.

## What Changes

- Create `docs/qa/QA_BY_PAGE.md` — one committed file with 17 page sections, each containing a metadata line, a 5-checkbox manual sweep, an issue table (QA-ID · Quote · BP · Class · Status · Auto · Manual), and a per-page "tests to write" backlog when gaps exist.
- Create `scripts/qa-doc-check.mjs` — a validator that asserts test `file:line` refs resolve, enforces the GAP/MANUAL-VISUAL invariant, mirrors GAP rows into the backlog, and checks page-index counts; wired into `pnpm test` via Vitest.
- Create `src/__tests__/qa-doc-check.test.ts` — runs the checker under Vitest so it executes on every suite.
- Delete `.context/qa-tracker.md` — all rows migrated verbatim into the new doc in the same commit.
- Add a page index (17 rows: page, route, GREEN/AMBER/RED readiness, open count, blocked count, owner OpenSpec change) as the dev roadmap entry point.
- Populate the Homepage section first (largest page, ~21 issues, highest priority per plan §4 Class A ship order), then all remaining 16 pages in a single pass.

## Capabilities

### New Capabilities

- `qa-by-page-verification`: Committed QA verification sheet organised by page — manual sweep, issue rows with auto/manual coverage classification, and a test-backlog block per page. Serves as both the sign-off sheet for QA re-testing and the dev roadmap pointing at the OpenSpec change that owns each open row.
- `qa-doc-checker`: Script and Vitest wrapper that asserts structural invariants of `QA_BY_PAGE.md` against the codebase on every test run — ref resolution, GAP↔backlog parity, and page-index count accuracy.

### Modified Capabilities

## Impact

- New files: `docs/qa/QA_BY_PAGE.md`, `scripts/qa-doc-check.mjs`, `src/__tests__/qa-doc-check.test.ts`
- Deleted: `.context/qa-tracker.md`
- `pnpm test` suite grows by the checker test; no production code changes
- All 17 QA-report pages covered; Homepage section is the first and most detailed — it carries ~21 issue rows including the 2 Class E blocked items and the 2 still-open Figma-pair decisions (plan §2.3)
- Does not alter `QA_REPORT_PLAN.md`, `QA_REPORT_PROGRESS.md`, or any in-flight OpenSpec change
