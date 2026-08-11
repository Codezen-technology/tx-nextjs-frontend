## Context

See proposal.md — Why for motivation.

The existing artifacts:

- `.context/qa-tracker.md` (106 lines, gitignored) — the only place with live per-issue status, but unreachable to QA and GitHub review
- `QA_REPORT_PROGRESS.md` — class-ordered narrative of what shipped and why it broke; stays untouched
- `QA_REPORT_PLAN.md` — the execution plan; stays untouched

The codebase already has three Playwright viewport projects (chromium/1280, desktop-1920, mobile-440) and `e2e/qa-round-1.spec.ts` covering 7 E2E tests × 3 viewports for the 6 Class B bugs and 2 Class C image issues. The tracker has 12 resolved rows and 7 blocked rows; remaining Class A work lives in `qa-class-a-design-fidelity` (15/43 tasks, in-flight).

Homepage (`QA-HOME-*`) carries the most rows (~21 issues), two Class E blocked items (search button, section spacing), and two unresolved Figma pairs — making it both the highest-priority page and the most complex section to populate.

## Goals / Non-Goals

**Goals:**

- Produce `docs/qa/QA_BY_PAGE.md` and the checker as described in the specs
- Populate every row from the tracker verbatim (no status changes during migration)
- Homepage section complete with all known rows; remaining 16 pages complete in a single pass
- Checker wired into `pnpm test` and passing on completion

**Non-Goals:**

- Fixing any QA issue or changing any status
- Writing any missing tests (GAP rows are recorded, not filled)
- Altering `qa-class-a-design-fidelity`, `site-page-grid`, `header-acf-content`, or `fix-seo-audit-followups`
- Full visual regression testing (rejected by plan §D7)

## Decisions

### D1 — One file, not 17

Single `docs/qa/QA_BY_PAGE.md`. Alternatives: one file per page (17 files), or a generated file from a JSON/YAML source.

One file: greppable, one diff per status change, no build step. Per-page files: simpler diffs but no cross-page search; any index must be maintained separately. Generated from structured data: correct long-term but over-engineered for a doc that changes slowly and has one writer at a time. Chosen: one file.

### D2 — Checker is a Vitest test, not a standalone script

The checker logic lives in `scripts/qa-doc-check.mjs` (pure ES module, no deps) and is exercised by `src/__tests__/qa-doc-check.test.ts` which imports it and runs its assertions as a Vitest test case. Alternatives: a pre-commit hook (skippable), a CI-only step (not in `pnpm test`), or inline in the spec runner.

Vitest: runs on every `pnpm test`, failures appear in the same output as unit tests, no new commands to remember. Chosen: Vitest.

### D3 — Checker parses Markdown, not a structured format

`qa-doc-check.mjs` parses `QA_BY_PAGE.md` with regex / line splitting. Alternatives: maintain a JSON/YAML source and generate the Markdown; parse with a full Markdown AST library.

Regex/line split: zero dependencies, straightforward for a document with a fixed structure. AST library: adds a dep, more robust for arbitrary Markdown but the document shape is intentionally rigid. Chosen: regex/line split.

### D4 — Auto column uses `file:line` not test IDs

Existing Playwright tests in `e2e/qa-round-1.spec.ts` do not carry stable IDs — they are referenced by file and line number. Alternatives: add a `// @qa-id: QA-HOME-B1` comment to each test and reference by that; use test titles.

`file:line` is already how the tracker records evidence. Checker assertion 1 validates the line still contains `test(`. Cost: line numbers move when specs are reordered — but the checker catches this immediately, which is the point. Chosen: `file:line`.

### D5 — Homepage first, then one pass for the remaining 16

Populate Homepage completely before starting any other page. Reason: largest section, two blocked items, two Figma-pair decisions — if anything makes the design ambiguous it surfaces on the first page. All remaining 16 pages in a single task pass.

## Risks / Trade-offs

- **Tracker row count may exceed what's in the existing tracker** (plan §7 notes the verbatim 80-row grid was never built). Mitigation: source rows from the tracker for known IDs; for un-transcribed pages, record placeholder rows noting the source doc could not be read in-session. Mark those rows `NOT-YET-TRANSCRIBED` rather than inventing content.
- **`file:line` refs rot on spec reorder** → Checker assertion 1 catches this on the next `pnpm test` run.
- **Page index counts drift from rows** → Checker assertion 4.
- **`qa-class-a-design-fidelity` resolves more Figma pairs while writing** → Resolution state is a single metadata field per page section; update is one line.

## Migration Plan

1. Write `docs/qa/QA_BY_PAGE.md` with all 17 page sections and the page index.
2. Write `scripts/qa-doc-check.mjs` and `src/__tests__/qa-doc-check.test.ts`.
3. Run `pnpm test` — checker must pass before proceeding.
4. Verify row count: every QA-ID in the tracker appears in exactly one page section.
5. Delete `.context/qa-tracker.md` in the same commit that adds the doc.
6. Commit: `docs(qa): add page-wise QA verification sheet and checker`.

Rollback: revert the commit. The tracker is gitignored; its deletion is reversible by restoring the file from the stash captured before deletion.
