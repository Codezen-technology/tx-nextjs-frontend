## Context

See `proposal.md` — **Why**. Three facts shape the approach.

**1. The report is not in the repo.** It is a Google Doc, and every triage pass so far has
worked from someone's reading of it. Nothing in CI can see it, so nothing in CI has ever
been able to notice a missing row. That is why the same error recurred three times: it is
not carelessness, it is an unenforceable invariant.

**2. The report's own numbering is broken.** Its Homepage section labels two items "Issue
7" and another two "Issue 4"; Single Course has three items numbered 4; About Us has three
numbered 1. Item identity therefore cannot be taken from the report — it has to be
assigned by position when the inventory is written.

**3. The existing checker is close.** `scripts/qa-doc-check.mjs` already parses every issue
table, every `Auto` cell and the page index, and already runs inside `pnpm test`. The
provenance assertions are a fifth and sixth pass over data it has already collected, not
new machinery.

## Goals / Non-Goals

**Goals:**

- Make the page index true, once, and mechanically hard to falsify afterwards
- File every untracked report item with a status **verified against the code**, not
  transcribed from the report's claim
- Leave the exposed work sized and owned, ready to slice

**Non-Goals:**

- Fixing any of the defects this pass uncovers. The point of a reconciliation is a true
  count; mixing fixes in makes the count move while it is being taken
- Re-verifying rows already closed with evidence. `FIXED` rows with a test reference and
  `CANT-REPRODUCE` rows with measurements are left alone
- Reproducing the report's screenshots or its Figma links in the inventory — the item
  text, its solution and its assignee are what rows are filed from

## Decisions

### D1 — The inventory is a committed extract, not a link

`docs/qa/QA_REPORT_ITEMS.md` holds the report's items verbatim. A link cannot be asserted
against; a committed extract can, and it also survives the doc being edited or access
being lost.

The cost is drift: someone edits the Google Doc and the extract goes stale. Mitigated by
recording the extraction date and the doc revision at the top, and by the extract being
cheap to regenerate — the whole report is ~4k words. Drift makes the inventory _stale_,
which is visible; the current state makes items _invisible_, which is not.

_Alternative considered:_ fetch the doc in the checker. Rejected — it puts a network call
and a Google credential inside `pnpm test`.

### D2 — Status comes from the code, not from the report

Every new row's status is decided by looking at the component, and where the claim is
visual, by measuring the running build. The Single Course pass is the precedent: of its
12 report items, one was already satisfied (`C2`, no background image exists), one was
un-fixable in this repo (`A9`, no such element), one was not reproducible (`A8`, 46 line
boxes measured), and one was the opposite of what the report described (`B3` — the card
was inventing the rating, not the header). Filing those four as `STILL-BROKEN` on the
report's word would have been four wrong rows.

This is the expensive part of the pass and it is the part that makes the count worth
having.

### D3 — Rows with no provenance are marked, not deleted

`QA-CHECK-A2`, `QA-CONTACT-A1` and `QA-CANCEL-A1` trace to no report item. They are not
deleted: `QA-CHECK-A2` produced a real measured finding (checkout headings ship at 24px
where the frame says 32) that would be lost, and a deleted row is invisible to anyone
re-reading the history. Each becomes `Ref = NONE` with its origin stated, and
`RECLASSIFIED` where the row's own premise was wrong.

### D4 — `Ref` is a new column, filled for all ~90 existing rows

Adding a column to every row of a 700-line table is the bulk of the mechanical work. The
alternative — provenance only on new rows — leaves the existing rows unverifiable, which
is where two of the three known errors live. It is done once.

### D5 — The reverse assertion is the one that matters

"Every row cites an item" catches invented rows. **"Every item is cited by a row"** catches
missing rows, which is the failure that has actually happened three times. Both ship, but
the second is the reason for the change.

### D6 — Page ordering and QA-ID numbering are untouched

New rows take the next free number on their page. No renumbering: the schema already
forbids it, and every prior slice's commit messages, `targets.md` entries and test names
cite the existing IDs.

## Risks / Trade-offs

- **The inventory is extracted by hand and could itself miss an item** → it is extracted
  from the full document text in one pass and its per-page counts are stated in this
  design, so a miscount is checkable against the table below rather than being invisible
- **~20 new open rows make the project look worse overnight** → it looked better than it
  was; that was the defect. The `Done` conditions in `QA_EXECUTION.md` were about to be
  met against an undercount
- **The checker's reverse assertion will fail loudly on day one** → intended, and it is
  why the inventory and the rows land in the same commit
- **Verifying ~20 items against the code is slow** → it is, and D2 explains why the
  alternative is worse. Items whose verification needs a running build are grouped so the
  browser is opened once per page

## Expected counts

> **Corrected after extraction.** The table below counted the report's _issue headings_.
> The extract counts _defects_: the report routinely lists two or three separate fixes
> under one heading ("1. Remove these options from the footer 2. Shorten the body text"),
> and each is a distinct defect with its own verdict. Counting headings gave 77; counting
> defects gives **91**. The per-page truth is in `docs/qa/QA_REPORT_ITEMS.md`; the table
> below is kept as the estimate it was, with the extract's number beside it.

| Report page        | Headings (estimate) | **Items (extract)** | Rows today |
| ------------------ | ------------------- | ------------------- | ---------- |
| Homepage           | 17                  | **26**              | 17         |
| About Us           | 3                   | **3**               | 2          |
| Blog               | 5                   | **5**               | 6          |
| Single Blog        | 8                   | **9**               | 3          |
| Contact            | 1                   | **1**               | 2          |
| Category           | 6                   | **6**               | 5          |
| All Courses        | 4                   | **4**               | 4          |
| Single Course      | 12                  | **12**              | 14         |
| Privacy Policy     | 2                   | **2**               | 1          |
| Team Training      | 0                   | **0**               | 0          |
| FAQ / Help         | 2                   | **2**               | 1          |
| Cart               | 2                   | **2**               | 1          |
| Checkout           | 4                   | **5**               | 3          |
| Pricing            | 8                   | **8**               | 3          |
| Verify Certificate | 1                   | **1**               | 1          |
| Cancellations      | 3                   | **3**               | 3          |
| Priority Support   | 2                   | **2**               | 1          |

**91 report items · 67 rows today.** The gap is not 24 — several existing rows map to no
item while several items map to no row, so the reconciliation moves in both directions.
Homepage's 26 items against 17 rows does not mean nine misses: its rows were filed at
heading granularity, so one row legitimately closes several items and cites all of them.

## Migration Plan

Docs and one script. No deploy, no data. Rollback is `git revert`.

The commit lands the inventory, the `Ref` column and the checker assertion together —
each is broken without the other two.
