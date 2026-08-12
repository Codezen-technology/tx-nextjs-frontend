## 1. Scope

- [ ] 1.1 Read the Blog section of `docs/qa/QA_BY_PAGE.md`; confirm the open rows are exactly `QA-BLOG-A2`, `A3`, `A4` and that nothing else on the page is `STILL-BROKEN` or `PARTIAL-FIX`
- [ ] 1.2 Confirm from `.context/figma/node-resolution.md` that the Blog pair is recorded as identical, so "either node" is authoritative and no resolution work is owed

## 2. QA-BLOG-A3 — laptop side padding, verify first

- [ ] 2.1 Run `npx playwright test e2e/design-fidelity.spec.ts --project=chromium` and record whether the existing `TARGETS[1280].sidePadding = 128` assertion passes against `/blog`
- [ ] 2.2 If it passes, close the row by pointing `Auto` at that existing `file:line` and record in Manual that it was **verify-and-close, already correct** — not a fix. Skip 2.3
- [ ] 2.3 If it fails, measure the laptop frame, record the value in `.context/figma/targets.md`, apply the smallest container fix, and re-run

## 3. QA-BLOG-A2 — hero vertical inset at 1920

- [ ] 3.1 Pull the Blog hero band from the authoritative node; record band height, the content column's height and offset, and derive the top/bottom inset the way `QA-HOME-A1` did
- [ ] 3.2 Append the target to `.context/figma/targets.md` as `property → breakpoint → value → source node`
- [ ] 3.3 Add the assertion to `e2e/design-fidelity.spec.ts` in a Blog describe block, skipped at any width other than 1920, with a failure message naming page, property, breakpoint, expected and observed
- [ ] 3.4 Run it and **watch it fail**; record the observed value in the commit body
- [ ] 3.5 Apply the smallest change that hits the measured inset, then re-run until green

## 4. QA-BLOG-A4 — section heading weight and casing

- [ ] 4.1 Assert every `main` h2 on `/blog` is weight 700, mirroring the Homepage test; run it and record whether it passes on the current build
- [ ] 4.2 Read the heading strings off the Blog frame and compare their casing against the rendered page
- [ ] 4.3 If the frame's headings are uniformly Title Case, assert casing and fix what fails. If they mix, close the casing half as **not a defect** citing the specific frame nodes, as `QA-HOME-A3` did
- [ ] 4.4 If 4.2 finds a real Title Case rule, record it as a finding affecting `QA-CAT-A3` and `QA-COURSES-A3` — do not apply it to those pages in this change

## 5. Close out the slice

- [ ] 5.1 Flip all three rows in `docs/qa/QA_BY_PAGE.md`: status → `FIXED`, `Auto` → the new `file:line`, Manual → what evidence closed it, and delete each from the page's "Tests to write"
- [ ] 5.2 Update the page index: Blog `Open 3 → 0`, re-evaluate `Ready`, and clear the `Owner change` cell
- [ ] 5.3 Remove the three Blog rows from Appendix B's test backlog
- [ ] 5.4 Repoint `qa-class-a-design-fidelity` task 5.3 at this change so the page has one owner

## 6. Gate

- [ ] 6.1 `pnpm typecheck && pnpm lint && pnpm test` — `pnpm test` runs `scripts/qa-doc-check.mjs`, which enforces the status flips in 5.1 and the counts in 5.2
- [ ] 6.2 `npx playwright test e2e/design-fidelity.spec.ts --project=chromium --project=desktop-1920 --project=mobile-440`
- [ ] 6.3 Mutation-test each new assertion: change the applied value, confirm it fails naming page/property/breakpoint/expected/observed, revert
- [ ] 6.4 Compare the full E2E run against the known baseline — `smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28` — not against zero
- [ ] 6.5 One commit, `fix(qa-blog): <rows closed>`, stating for each row whether it was fixed or verified already-correct
