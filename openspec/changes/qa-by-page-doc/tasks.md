## 1. Scaffold

- [ ] 1.1 Create `docs/qa/` directory and `docs/qa/QA_BY_PAGE.md` with the header block (How to use, Environment §4.1, Viewports, Legend, and a placeholder page index table)
- [ ] 1.2 Write the page index table — 17 rows with route, readiness `RED`/`AMBER`/`GREEN` per current tracker state, open count, blocked count, owner change
- [ ] 1.3 Write Appendix A (blocked ledger — 7 Class E items + remaining Figma-pair decisions) and Appendix B (test backlog roll-up placeholder, to be filled as pages are written)

## 2. Homepage section (`QA-HOME-*`)

- [ ] 2.1 Write Homepage metadata line: route `/`, Figma node `OPEN 4571:10560 vs 6013:89909`, note that `qa-class-a-design-fidelity` §2.1 is the resolution task
- [ ] 2.2 Write Homepage manual sweep (4 fixed checkboxes + page-specific: "Pricing plans render, quantity stepper updates the line total, certificate section renders images")
- [ ] 2.3 Populate Homepage issue table — all `FIXED` Class B rows (QA-HOME-B1, QA-HOME-B4, QA-HOME-B5) with `file:line` test refs from `e2e/qa-round-1.spec.ts`
- [ ] 2.4 Populate Homepage issue table — Class C rows (QA-HOME-C1/C2 `FIXED`, QA-HOME-C3 `CONTENT-GAP`)
- [ ] 2.5 Populate Homepage issue table — Class A rows outstanding, marked `STILL-BROKEN` with `Auto = MANUAL-VISUAL` or `GAP` per issue type; owner `qa-class-a-design-fidelity §5.2`
- [ ] 2.6 Populate Homepage issue table — Class E rows (QA-HOME-E1, QA-HOME-E2) marked `BLOCKED-DESIGN`, `Auto = N/A`
- [ ] 2.7 Write Homepage "Tests to write" block from all GAP rows in the Homepage issue table

## 3. Remaining 16 page sections

- [ ] 3.1 About Us (`QA-ABOUT-*`) — metadata (Figma `OPEN 6239:102399 vs 6015:129608`), sweep, rows from tracker (`CONTENT-GAP` ×2 for images), owner `qa-class-a-design-fidelity §5.6`
- [ ] 3.2 Blog (`QA-BLOG-*`) — metadata (Figma `OPEN 4900:75788 vs 6015:127034`), sweep, rows (QA-BLOG-B6 `FIXED`, QA-BLOG-A1 `FIXED`, remaining Class A), page-specific sweep: "Blog card dates display three-letter months"
- [ ] 3.3 Single Blog (`QA-BLOGS-*`) — metadata (Figma `OPEN 4040:11134 vs 6015:127141`), sweep, rows (QA-BLOGS-B3 `FIXED`, QA-BLOGS-A2 `FIXED`), page-specific sweep: "ToC link scrolls to correct heading with header clearance"
- [ ] 3.4 Contact (`QA-CONTACT-*`) — metadata (no Figma pair conflict noted), sweep, rows from source doc
- [ ] 3.5 Course Category (`QA-CAT-*`) — metadata (Figma `OPEN 3294:42427 vs 6015:108699`), sweep, rows (Category Why Choose Us `CANT-REPRODUCE`), page-specific sweep: "Course cards filter by category"
- [ ] 3.6 All Courses (`QA-COURSES-*`) — metadata (Figma `OPEN 3306:50109 vs 6015:96163 v2`), sweep, rows (QA-COURSES-A1 `FIXED`, remaining Class A, Class D mobile noted as out-of-round-1), page-specific sweep: "Filter checkboxes white unselected, Secondary-500 selected"
- [ ] 3.7 Single Course (`QA-COURSE-*`) — metadata, sweep, rows (QA-COURSE-B2 `FIXED`, QA-COURSE-A1 `FIXED`, QA-COURSE-E1 `BLOCKED-DESIGN`), page-specific sweep: "Buy CTA routes to /cart, not /checkout"
- [ ] 3.8 Privacy Policy (`QA-PRIVACY-*`) — metadata (`NONE` — plan §2.4, wrong Figma cited), sweep, rows (QA-PRIVACY-A1 `FIXED`)
- [ ] 3.9 FAQ / Help (`QA-HELP-*`) — metadata, sweep, rows (QA-HELP-E1 `BLOCKED-DESIGN` — blank Solution(Dev))
- [ ] 3.10 Cart (`QA-CART-*`) — metadata, sweep, rows (QA-CART-E1 `BLOCKED-DESIGN` — two options, none chosen), page-specific sweep: "Cart items list renders, total reflects quantity"
- [ ] 3.11 Checkout (`QA-CHECK-*`) — metadata, sweep, rows (dropdown right padding Class A, Checkout section Class D out-of-round-1)
- [ ] 3.12 Pricing (`QA-PRICE-*`) — metadata, sweep, rows (QA-PRICE-E1 `BLOCKED-DESIGN`, QA-PRICE-E2 `BLOCKED-DESIGN`), note Class D: third card may be render issue not missing build
- [ ] 3.13 Verify Certificate (`QA-VERIFY-*`) — metadata, sweep, rows (QA-VERIFY-A1 `FIXED`)
- [ ] 3.14 Cancellations (`QA-CANCEL-*`) — metadata (`NONE` — plan §2.4, wrong Figma cited), sweep, rows
- [ ] 3.15 Priority Support (`QA-SUPPORT-*`) — metadata (`NONE` — plan §2.4, wrong Figma cited), sweep, rows (dropdown right padding Class A)
- [ ] 3.16 Team Training (`QA-TEAM-*`) — metadata (route **does not exist**, Class D), section records absence only; no issue rows; no manual sweep

## 4. Checker

- [ ] 4.1 Write `scripts/qa-doc-check.mjs` — parse `docs/qa/QA_BY_PAGE.md`, implement assertion 1 (file:line resolution), assertion 2 (GAP/MANUAL-VISUAL invariant), assertion 3 (GAP↔backlog parity), assertion 4 (page-index count accuracy)
- [ ] 4.2 Write `src/__tests__/qa-doc-check.test.ts` — import and run the checker as a Vitest test; failure messages must name page, QA-ID, invariant, expected vs observed
- [ ] 4.3 Run `pnpm test` — checker must pass with zero failures before proceeding to task 5

## 5. Finalise

- [ ] 5.1 Verify row count: every QA-ID in `.context/qa-tracker.md` appears in exactly one page section of `QA_BY_PAGE.md`
- [ ] 5.2 Update Appendix B (test backlog roll-up) from all GAP rows across all 17 pages, in ship order (RED pages by descending open count)
- [ ] 5.3 Update page index readiness and counts to match the populated rows
- [ ] 5.4 Delete `.context/qa-tracker.md`
- [ ] 5.5 Run `pnpm typecheck && pnpm lint && pnpm test` — all pass
- [ ] 5.6 Commit: `docs(qa): add page-wise QA verification sheet and checker`
