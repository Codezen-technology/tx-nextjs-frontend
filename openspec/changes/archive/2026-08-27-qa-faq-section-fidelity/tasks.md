## 1. Evidence

- [x] 1.1 Record the Help FAQ measurement in `.context/figma/targets.md` — `6239:109818`, the sampled points, and the alpha arithmetic that identifies the half-alpha container
- [x] 1.2 Record the two-frame comparison against `QA-BLOGS-A7`'s recorded blog values, property by property, and state that this is what settles A7's scoping question
- [x] 1.3 Record the two build implementations side by side, including what `/help` has that `CourseFaq` does not (keyboard, `aria-controls`, answer region)

## 2. Failing tests first

- [x] 2.1 Restart `pnpm dev`, warm `/help` and a blog post
- [x] 2.2 Add frame-value assertions to `e2e/design-fidelity.spec.ts`, run against **both** routes: container half-alpha fill and square corners, divider `N30`, question weight/colour, icon size, open answer panel solid `secondary-50`
- [x] 2.3 Watch them fail on both routes and record what each reported
- [x] 2.4 Add the semantics assertions: each question is a button with `aria-expanded`, the open answer is associated with its question, and focus can reach and toggle a question by keyboard
- [x] 2.5 Watch the semantics assertions fail on the blog route (today's `CourseFaq`) and pass on `/help` (today's Radix accordion) — that contrast is the regression the convergence must not create

## 3. Implementation

- [x] 3.1 Rebuild `course-faq.tsx` on `@radix-ui/react-accordion`, `type="single" collapsible`, first item open by default
- [x] 3.2 Apply the measured container: half-alpha `secondary-50`, square, no border
- [x] 3.3 Apply the measured rows: `N30` divider, question Open Sans 400/16/1.5 in `N500`, 24px toggle
- [x] 3.4 Apply the measured answer panel: outer 24 padding, inner solid `secondary-50`, 24 padding, 14px/1.5 `N500`
- [x] 3.5 Retune the `QA-COURSE-A4` hover to the new palette, keeping it on the active row
- [x] 3.6 Switch `/help` to `CourseFaq`, delete the bespoke accordion, keep its question list
- [x] 3.7 Re-run 2.2 and 2.4 green on both routes

## 4. Mutation check

- [x] 4.1 Revert the container to solid `secondary-50`, confirm the fill assertion fails with expected/observed on both routes, restore
- [x] 4.2 Revert the divider to `secondary-50`, confirm the divider assertion fails, restore
- [x] 4.3 Remove the hover classes, confirm the `QA-COURSE-A4` assertions in `e2e/course-detail.spec.ts` fail, restore

## 5. Regression gate for the pages nobody filed

- [x] 5.1 Run `e2e/course-detail.spec.ts` in full — the FAQ hover rows there were signed off and must still pass
- [x] 5.2 Screenshot the FAQ on course detail, category and pricing before and after; record them, so the four unfiled pages' change is visible rather than asserted
- [x] 5.3 Confirm `my-orders` is untouched — the shadcn `Accordion` wrapper must not have changed

## 6. Docs

- [x] 6.1 `QA-BLOGS-A7` → `FIXED`, noting that the Help frame is what unblocked it
- [x] 6.2 `QA-HELP-A1` → `FIXED`, with its test reference
- [x] 6.3 Record the second implementation's removal and the four pages that changed with it
- [x] 6.4 Page index — Single Blog and FAQ/Help recounted; `Ready` recomputed
- [x] 6.5 Appendix B — confirm no owed test is added or orphaned
- [x] 6.6 Note `/help`'s hardcoded questions as a follow-up, unfiled by the report

## 7. Gate

- [ ] 7.1 `pnpm typecheck` clean
- [ ] 7.2 `pnpm lint` — no new errors
- [ ] 7.3 `pnpm test` — green including the doc checker's 6 assertions
- [ ] 7.4 Restart `pnpm dev`, warm the touched routes, full `pnpm test:e2e`; compare against the baseline of 4 specs × 3 projects and re-run extras before believing them
- [ ] 7.5 `openspec validate qa-faq-section-fidelity --strict`
- [ ] 7.6 Commit
