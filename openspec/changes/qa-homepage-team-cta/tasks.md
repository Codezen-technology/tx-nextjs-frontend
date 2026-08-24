## 1. Evidence

- [x] 1.1 Record `QA-HOME-A8` in `.context/figma/targets.md` — the CTA's classes, resting fill, `transition-property: opacity`, and the `elementFromPoint` result naming the backdrop; note that Playwright's `.hover()` times out with "intercepts pointer events"
- [x] 1.2 Record `QA-HOME-A10` — the frame footer `3306:50227` carries the identical 149-character sentence, quoted from both sources side by side
- [x] 1.3 Record the five-route pointer-interception sweep, its one real finding, and the closed-dropdown false positive with its cause

## 2. Failing tests first

- [x] 2.1 Restart `pnpm dev` and warm `/` before any browser run
- [x] 2.2 Add the hit-test assertion to `e2e/design-fidelity.spec.ts`: the element at the CTA's centre is the link; watch it fail naming `img.absolute.inset-0.object-cover`
- [x] 2.3 Add the hover assertion: hovering the CTA changes its background colour, read through the existing `settled()` helper; watch it fail (it cannot hover at all today)
- [x] 2.4 Add the transition assertion: every property the hover alters is covered by `transition-property`; watch it fail reporting `opacity` alone

## 3. Implementation

- [x] 3.1 `transform-team.tsx` — `pointer-events-none` on the decorative backdrop
- [x] 3.2 `transform-team.tsx` — content wrapper to `relative z-10`, matching `category-hero` and `all-courses-hero`
- [x] 3.3 `transform-team.tsx` — CTA transition widened to cover the colour it changes
- [x] 3.4 Re-run 2.2–2.4 green

## 4. Mutation check

- [x] 4.1 Remove `pointer-events-none`, confirm the hit-test fails naming the backdrop, restore
- [x] 4.2 Remove `z-10`, confirm the hit-test still fails (paint order alone), restore — if it passes, record that and keep the class with the reason stated
- [x] 4.3 Narrow the transition back, confirm the transition assertion fails reporting the property it lost, restore

## 5. Docs

- [x] 5.1 `QA-HOME-A8` → `FIXED` with its test references and the note that the CTA was unclickable, not merely un-hoverable
- [x] 5.2 `QA-HOME-A10` → `BLOCKED-DESIGN`, both sources quoted, and the reason it is a product decision
- [x] 5.3 Appendix A — add `QA-HOME-A10` with the conflict stated
- [x] 5.4 Page index — Homepage `Open 2` → `Open 0`, `Blocked 6` → `7`; `Ready` recomputed
- [x] 5.5 Appendix B — no change expected; confirm

## 6. Gate

- [x] 6.1 `pnpm typecheck` clean
- [x] 6.2 `pnpm lint` — no new errors
- [x] 6.3 `pnpm test` — green including the doc checker's 6 assertions
- [x] 6.4 Restart `pnpm dev`, warm the touched route, then full `pnpm test:e2e`; compare against the corrected baseline (4 specs × 3 projects) and re-run extras before believing them
- [x] 6.5 `openspec validate qa-homepage-team-cta --strict`
- [ ] 6.6 Commit
