## 1. Measure

- [x] 1.1 Start `pnpm dev` and load `/` at 440. Record `document.documentElement.scrollWidth`, the rendered width of the CPD `h2` and `p`, and the content column width. Confirms the `472 vs 440` and `200px` figures in `QA_BY_PAGE.md:111` still reproduce.
- [x] 1.2 At 440, record the bounding boxes of the categories grid and the "View all courses" CTA. Confirms `A7` still reproduces and gives the assertion its expected relationship.
- [x] 1.3 At 1920 and 440, read the computed `font-family` of `[data-testid="plan-price"]`. Record it — the doc's "Open Sans" claim is expected to be wrong (design D3, step 1).
- [x] 1.4 Pull the pricing card's text token from Figma node `6013:89909` (`get_variable_defs` / `get_design_context`). Append what it yields to `.context/figma/targets.md` as `property → breakpoint → value → source node`.
- [x] 1.5 Take the D3 branch: frame says Inter → task group 5 runs; frame says an already-loaded family → task group 5 runs without the font load; frame carries no typography for this node → `A5` is `BLOCKED-DESIGN`, skip group 5, and adjust group 7's index arithmetic to `Open 0 · Blocked 4`.
- [x] 1.6 Record the 768 observation for the CPD section (design risk: `lg` may be the wrong stacking breakpoint) alongside 1.1.

## 2. Assert before fixing

- [x] 2.1 Add the `A6` targets to the `TARGETS` map in `e2e/design-fidelity.spec.ts` with a 440 tolerance and a comment citing `QA_BY_PAGE.md:111` as the source.
- [x] 2.2 Write the `A6` assertions: at 440 the CPD `h2` and `p` each span the content column, **and** `document.documentElement.scrollWidth` equals 440. Failure message names page / property / breakpoint / expected / observed.
- [x] 2.3 Write the `A7` assertion: at 440 the CTA's top edge is below the grid's bottom edge; at 1920 the CTA is in the heading row.
- [x] 2.4 Write the `A5` assertion against the family recorded in 1.4: the computed family of `plan-price` matches, and the `£` and the digits resolve to the same family. **Written, then removed** — see group 5; it asserted the opposite of what the fix may need.
- [x] 2.5 Run the three and **watch each fail** with an actionable message. A test written after the fix proves nothing — do not proceed past a test that passes here.

## 3. Fix QA-HOME-A6

- [x] 3.1 In `src/components/home/cpd-certificate.tsx:29`, stack the row below `lg` and drop the dead `lg:grid-cols-2` (design D1).
- [x] 3.2 Re-run 2.2 and confirm both halves pass at 440.
- [x] 3.3 Confirm at 1920 and 1280 that the section's computed layout is unchanged from before 3.1.

## 4. Fix QA-HOME-A7

- [x] 4.1 In `src/components/home/categories-grid.tsx`, move the "View all courses" CTA out of the heading wrapper to a sibling after the grid, and return it to the heading row at `md` and above via ordering — one DOM node, not two (design D2).
- [x] 4.2 Re-run 2.3 and confirm both breakpoints pass.
- [x] 4.3 Keyboard pass at 1920: tab through the categories section and confirm the CTA's focus order still reads correctly. If it does not, revise the D2 approach — the spec does not change.

## 5. Fix QA-HOME-A5

_Not run, and correctly so._ Task 1.4 resolved the _token_ to SUSE, which the price already
uses — so no font to add and no class to re-point. `A5` was briefly closed on that basis;
that close was withdrawn. Comparing the frame's rendered `£` with SUSE's shows the digits
identical and the symbol not, so the design and the build display different pound signs —
which is what the row filed. Which face the `£` takes is a design ruling, so `A5` is now
Class E `BLOCKED-DESIGN`, its assertion is removed, and these edits stay undone.

- [ ] 5.1 If the recorded family is not already loaded: add it via `next/font/google` in `src/app/layout.tsx` with `display: "swap"`, expose its `--font-*` variable on `<body>`, and add the matching entry to `src/app/globals.css` beside `--font-suse` / `--font-open-sans`.
- [ ] 5.2 Point the price spans at the recorded family — `quantity-selector.tsx` (`plan-price`, its original-price sibling and unit suffix) and `pricing-comparison.tsx:65`.
- [ ] 5.3 Re-run 2.4 and confirm it passes at both breakpoints.
- [ ] 5.4 If the frame contradicted the report's "Inter", record that in `.context/figma/node-resolution.md` as the evidence for what was applied instead.

## 6. Verify

- [x] 6.1 `npx playwright test e2e/design-fidelity.spec.ts --project=chromium --project=desktop-1920 --project=mobile-440`
- [x] 6.2 Mutation-check the three new assertions: perturb one applied value each, confirm the failure names page / property / breakpoint / expected / observed, revert.
- [x] 6.3 Compare the full E2E run against the known baseline of five failures (`smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`) — not against zero.
- [x] 6.4 `pnpm typecheck && pnpm lint && pnpm test`

## 7. Flip status

- [x] 7.1 In `docs/qa/QA_BY_PAGE.md`, set each closed row to `FIXED`, put the test's name in `Auto`, and write the measured evidence into `Manual`.
- [x] 7.2 Correct the `A5` row's Manual note: the observed family was not Open Sans (design D3, step 1). Record what it actually was, whatever the row's final status.
- [x] 7.3 Delete the closed rows from the Homepage "Tests to write" list and from Appendix B.
- [x] 7.4 Update the page index Homepage line — `Open` per 1.5, `Blocked` per 1.5, `Ready` re-assessed by hand (the checker does not verify `Ready`), and clear `unowned — needs a slice` to this change's name.
- [x] 7.5 `pnpm test` — confirm `scripts/qa-doc-check.mjs` passes on the edited doc.

## 8. Ship

- [x] 8.1 One commit: `fix(qa-home): close the three rows the report re-read surfaced`.
- [x] 8.2 State in the commit body which rows closed against a frame measurement, which against the report, and — if 1.5 took the blocked branch — exactly what design input `A5` still needs.
