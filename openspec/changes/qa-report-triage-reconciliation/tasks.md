## 1. Extract the report inventory

- [x] 1.1 Create `docs/qa/QA_REPORT_ITEMS.md` with a header recording the source doc URL, the extraction date and the reason the extract exists (the checker cannot read the Google Doc)
- [x] 1.2 Transcribe every item, in report order, grouped by the report's page headings and its `Desktop 1920 / Laptop 1280 / Mobile 440` sub-headings, as `R-<PAGE>-<BP>-<NN>` with issue text, `Solution(Dev)` text and assignee
- [x] 1.3 Record the report's own broken numbering where it occurs (duplicate "Issue 4"/"Issue 7"/"Issue 1"), so a reader comparing the two documents is not misled
- [x] 1.4 **The estimate was wrong, not the extract.** The design counted issue _headings_ (77); the report lists several defects under one heading, so counting defects gives **91**. Design table corrected and annotated

## 2. Add the `Ref` column

- [x] 2.1 Add `Ref` to the issue-table header of all 17 page sections in `docs/qa/QA_BY_PAGE.md`, positioned after `QA-ID`
- [x] 2.2 Fill `Ref` for every existing row by matching its `Quote` against the inventory
- [x] 2.3 For rows that match nothing — `QA-CHECK-A2`, `QA-CONTACT-A1`, `QA-CANCEL-A1` and any others found — set `Ref` to `NONE` and state the origin in `Manual`
- [x] 2.4 Update the Legend section to document `Ref` and the `NONE` case

## 3. File the untracked items — one page at a time

Each page: read its inventory items, check each against the code, file a row with a status the code supports. Do **not** file `STILL-BROKEN` from the report's claim alone (design D2).

- [x] 3.1 **Pricing** — 5 untracked (hero vs design, header size consistency, mobile 40px spacing, title/button alignment, and the two `Solution(Design)`-only items)
- [x] 3.2 **Single Blog** — 5 untracked (image crop, wrong category name, two "remove the image" items, ToC anchor behaviour, body/H2 type scale, FAQ section vs design)
- [x] 3.3 **Checkout** — 3 untracked (VISA/JCB logos + "paypal coming soon", the missing section, trust lines)
- [x] 3.4 **About Us** — 1 untracked: "no need of breadcrumbs". Note in `Manual` that this is the same fix shipped as `QA-COURSE-A2`
- [x] 3.5 **Priority Support** — 1 untracked: additional-details textarea height
- [x] 3.6 **FAQ / Help** — 1 untracked: FAQ section vs design
- [x] 3.7 **Cart** — 1 untracked: card content parity with the Figma card
- [x] 3.8 **Privacy Policy** — 1 untracked: email and phone visibility
- [x] 3.9 **Course Category** — 1 untracked; identify which item has no row
- [x] 3.10 **All Courses**, **Blog**, **Contact**, **Cancellations**, **Verify Certificate** — counts agree but mappings may not; verify each row maps to a distinct item and each item to a row

## 4. Correct the ledger

- [x] 4.1 Recompute every page-index `Open` and `Blocked` count from the rows beneath, and set `Ready` to match (`GREEN` all closed · `AMBER` only blocked · `RED` shippable work)
- [x] 4.2 Set each `RED` page's `Owner change` to `—` where no change owns it yet, rather than pointing at a finished change
- [x] 4.3 Re-issue Appendix A from the reconciled `BLOCKED-DESIGN` rows
- [x] 4.4 Re-issue Appendix B from the reconciled `GAP` rows, and add each to its page's **Tests to write** block
- [x] 4.5 Add a short section to `QA_BY_PAGE.md` recording this reconciliation: what was found, in both directions, and the date

## 5. Enforce it

- [x] 5.1 Extend `scripts/qa-doc-check.mjs` to parse `docs/qa/QA_REPORT_ITEMS.md` into a set of item IDs
- [x] 5.2 Assertion 5 — every row's `Ref` resolves to an inventory item or is `NONE`; failure names the page, the QA-ID and the dangling ID
- [x] 5.3 Assertion 6 — every inventory item is cited by at least one row; failure names the item ID and its page
- [x] 5.4 Verify both assertions fail when they should: delete one row's `Ref`, confirm assertion 5 fails; delete a row citing an item, confirm assertion 6 names that item. Revert both
- [x] 5.5 `pnpm test` green with all six assertions live

## 6. Refresh the runbook

- [x] 6.1 Replace `QA_EXECUTION.md`'s "15 open Class A rows across 8 pages" with the reconciled count and date
- [x] 6.2 Mark the slices that have landed (Homepage, Blog, Category, All Courses, Checkout + Priority Support, Contact + Cancellations, Single Course) and re-cut the remaining order from the reconciled counts
- [x] 6.3 Add the reconciliation to the recipe: a slice starts by confirming its page's rows still match the inventory
- [x] 6.4 State the new `Done` conditions — they now include "every inventory item is cited"

## 7. Gate and commit

- [x] 7.1 `pnpm typecheck && pnpm lint && pnpm test`
- [x] 7.2 Confirm no product code changed: `git diff --stat` touches only `docs/qa/`, `scripts/qa-doc-check.mjs` and `openspec/`
- [x] 7.3 Commit as `docs(qa): reconcile QA_BY_PAGE against the source report`
