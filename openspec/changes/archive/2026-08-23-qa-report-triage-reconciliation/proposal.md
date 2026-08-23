## Why

`docs/qa/QA_BY_PAGE.md` is the sign-off document for the QA report, and its page index
currently reads **3 open rows, all Class D**. That number is wrong, and this is the third
time it has been wrong the same way:

| When       | Page                     | Rows the doc was missing                                                |
| ---------- | ------------------------ | ----------------------------------------------------------------------- |
| 2026-08-12 | Homepage                 | 5 (`A5`–`A7`, `C4`, `E3`) — index read `Open 0`                         |
| 2026-08-14 | Single Course            | 8 (`A2`–`A8`, `B3`) — index read `Open 0`, one row mis-filed as blocked |
| now        | **most remaining pages** | ~20, counted below                                                      |

Counting the source report's items against the filed rows, page by page:

| Page             | Report items | Filed rows                                   | Gap |
| ---------------- | ------------ | -------------------------------------------- | --- |
| Pricing          | 8            | 3                                            | 5   |
| Single Blog      | 8            | 3                                            | 5   |
| Checkout         | 4            | 3 (one of which the report does not contain) | 3   |
| About Us         | 3            | 2                                            | 1   |
| Priority Support | 2            | 1                                            | 1   |
| FAQ / Help       | 2            | 1                                            | 1   |
| Cart             | 2            | 1                                            | 1   |
| Privacy Policy   | 2            | 1                                            | 1   |
| Course Category  | 6            | 5                                            | 1   |

Every `GREEN` in that table is green because nobody filed the row, not because the page
passed. A sign-off document that under-reports is worse than no document: it converts
"untriaged" into "done" silently, and QA signs off on it.

The error also runs the other way. `.context/figma/targets.md` has logged three rows that
exist in the doc but trace to **no report item** — `QA-CHECK-A2`, `QA-CONTACT-A1`,
`QA-CANCEL-A1` — filed by generalising one page's issue onto another during triage. Two
were caught only when someone went to work them.

## What Changes

One reconciliation pass over the source report, page by page, filing what is missing and
striking what was invented. **No product code changes** — this change makes the ledger
true; the work it exposes is filed, sized and left for its own slices.

- **File every untracked report item** as a QA-ID on its page, with a status verified
  against the code at the time of filing — `STILL-BROKEN`, `CANT-REPRODUCE`, `FIXED`,
  `CONTENT-GAP` or `BLOCKED-DESIGN`. No row is filed as broken on the report's word alone
- **Strike or re-classify rows with no report provenance**, recording which report item
  (if any) they were generalised from
- **Correct the page index** — `Open`, `Blocked` and `Ready` for every page touched
- **Re-issue Appendix A** (blocked ledger) and **Appendix B** (test backlog) against the
  reconciled rows
- **Refresh `QA_EXECUTION.md`'s stale framing** — it opens with "15 open Class A rows
  across 8 pages", a count from before four slices landed, and its slice list describes
  work that is finished
- **Commit the report's item inventory** as `docs/qa/QA_REPORT_ITEMS.md` — every item in
  the source doc, verbatim, with a stable ID — and have each QA row cite its item. The
  checker then fails **both** directions: a row citing no item, and an item with no row.
  That is the assertion the last three misses needed and did not have

## Capabilities

### New Capabilities

- `qa-report-provenance`: every QA-ID traces to a named item in the source report, and
  the page index's counts are derived from the rows rather than maintained by hand

### Modified Capabilities

- `qa-by-page-verification`: the document's row schema gains a provenance column, and the
  structural checker gains an assertion that every row carries one

## Impact

**Docs**

- `docs/qa/QA_BY_PAGE.md` — ~20 new rows, corrections to existing ones, index, Appendix A, Appendix B
- `docs/qa/QA_EXECUTION.md` — stale counts and finished slices

**Tooling**

- `scripts/qa-doc-check.mjs` — one new assertion (provenance), runs inside `pnpm test`

**Not affected:** all product code. Any fix this pass exposes gets its own change, sized
against the reconciled count rather than the current one.
