## 1. Measure

- [x] 1.1 Pull frame `3277:44993` section by section and record each section's fill as `section → token → hex → 3277:44993` in `.context/figma/targets.md`. Any section the frame does not bind gets recorded as unbound, not guessed.
- [x] 1.2 Record which breakpoints `3277:44993` actually covers. Assert only those; note the rest as unmeasured (design risk 5).
- [x] 1.3 Load `/contact-us` at the covered widths and record each section's computed `backgroundColor`, so the assertion's "observed" side is real before it is written.
- [x] 1.4 Enumerate every `bg-secondary-500` + `text-white` pair (47 total uses, 39 paired) and record which are interactive controls and which are decorative fills.
- [x] 1.5 Confirm the contrast figures independently in-page rather than from the doc: white on `secondary-500` (expect 4.421), on `secondary-600` (expect 5.165), on `secondary-700`.

## 2. Assert before fixing

- [x] 2.1 Write the contrast helper: read computed `color` and `backgroundColor`, walking ancestors for the first non-transparent background and recording which element supplied it (design D2).
- [x] 2.2 Write the contrast assertion over the design-fidelity suite's covered pages. Failure names page, control text, both colours, observed ratio, and the 4.5 floor.
- [x] 2.3 Write the Contact section-fill assertion against the tokens recorded in 1.1, naming page / section / expected hex / observed hex.
- [x] 2.4 Run both and **watch them fail**. The contrast one must fail on the three Cancellations buttons specifically; if it fails nowhere, the helper is wrong, not the build.
- [x] 2.5 Triage every failure outside Contact/Cancellations from the first full run (design risk 4). **Outcome: no triage needed.** Every failure across all six routes was the same `#FFFFFF on #9E6F21 = 4.421` defect, closed by task 3. The single exception was on `/cancellations` itself — `primary-700` on `primary-50` = 3.895 in `refund-sidebar.tsx:32` — fixed in the same pass, not deferred. The check was not narrowed.

## 3. Fix QA-CANCEL-A2

- [x] 3.1 Repoint the interactive `bg-secondary-500 text-white` surfaces from 1.4 to `bg-secondary-600`, and their `hover:bg-secondary-600` to `hover:bg-secondary-700` (design D1, option B).
- [x] 3.2 Leave decorative `secondary-500` fills untouched. Do not change `--color-secondary-500`.
- [x] 3.3 Re-run 2.2 and confirm it passes across all covered pages.
- [x] 3.4 Check the hover delta is still perceptible at 1920 (design risk 2). If not, move hover to `secondary-800` rather than reverting 3.1.
- [x] 3.5 Screenshot the affected surfaces at 1920 before and after, so the darkened resting gold is a recorded consequence rather than a surprise in review.

## 4. Fix QA-CONTACT-A2

- [x] 4.1 Apply the recorded fills to the Contact page's sections, using tokens — not raw hex — and `cn()` for composition.
- [x] 4.2 Leave any section the frame does not bind exactly as it is, and say so in the row's Manual note.
- [x] 4.3 Re-run 2.3 and confirm it passes at every covered width.

## 5. Verify

- [x] 5.1 `npx playwright test e2e/design-fidelity.spec.ts --project=chromium --project=desktop-1920 --project=mobile-440`
- [x] 5.2 Mutation-check both new assertions: perturb one applied value each, confirm the failure message is actionable, revert. For the contrast check, the mutation is a fill that fails by a fraction — confirm it catches 4.42, not just an obvious failure.
- [x] 5.3 Negative control on the contrast check: point a control at a fill that passes and confirm it does not fire, so it is not asserting "some ratio" against itself.
- [x] 5.4 Full E2E against the known baseline — `auth-flow:15`, `cancellations:11`, `cancellations:28`, `smoke:9`. Note that two baseline failures are on `/cancellations`, the page being changed: confirm they fail for their existing reasons and not for new ones.
- [x] 5.5 `pnpm typecheck && pnpm lint && pnpm test`

## 6. Flip status

- [x] 6.1 `QA-CANCEL-A2` → `FIXED`, `Auto` → the contrast test's name, Manual records the measured before/after ratios and that the brand token was not moved.
- [x] 6.2 `QA-CONTACT-A2` → `FIXED`; change `Auto` from `MANUAL-VISUAL` to the fill test's name and record the reclassification and its reason (design D3) in the Manual column.
- [x] 6.3 Update both pages' "Tests to write" and Appendix B for the reclassification — a row that was `MANUAL-VISUAL` was never in the backlog, so Contact gains and then loses an entry in the same commit.
- [x] 6.4 Page index: Contact and Cancellations `Open` → 0, `Ready` re-assessed by hand, owner change set to this change's name.
- [x] 6.5 `pnpm test` — the doc checker enforces the `GAP` xor `MANUAL-VISUAL` invariant and the index counts.

## 7. Ship

- [x] 7.1 One commit: `fix(qa-contact-cancel): close the report's last two Class A rows` — landed as `8a9b220`.
- [x] 7.2 In the body: state that the brand token was deliberately not moved, name option A as the outstanding design ask, and list anything task 2.5 filed as a new row. Task 2.5 filed nothing — every failure was the same defect, and the one exception was fixed in the pass rather than deferred.
