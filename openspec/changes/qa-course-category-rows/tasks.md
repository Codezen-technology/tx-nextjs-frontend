## 1. Evidence

- [x] 1.1 Record the `QA-CAT-A4` pixel comparison in `.context/figma/targets.md` — frame `3294:42433` vs the build at eight normalised x positions, max Δ 1/255, with the declared gradient value and the note that the report reviewed the live WP site
- [x] 1.2 Record the 440 rhythm measurement — three sections at `container py-12`, boundaries 96 against the report's 40, and the `--spacing-section` precedent
- [x] 1.3 Record `QA-CAT-A6` — the three sites that compose `{categoryName} Courses`, and the rendered `"Education Courses Courses"`
- [x] 1.4 Screenshot the blog and all-courses heroes at their own routes and record whether the pattern renders, for the `QA-BLOG-D2` / `QA-COURSES-D2` re-verdict

## 2. Failing tests first

- [x] 2.1 Restart `pnpm dev` before any browser run (stale CSS and cold compile both read as regressions — `QA_EXECUTION.md`)
- [x] 2.2 Add the 440 rhythm assertion to `e2e/design-fidelity.spec.ts`: each boundary between the category page's content sections measures 40px at 440; watch it fail reporting 96
- [x] 2.3 Add the desktop-unchanged assertion at 1280: each content section keeps 48px vertical padding; confirm it passes now, so a later regression is visible
- [x] 2.4 Add the hero-gradient assertion: the computed `background-image` carries the measured start and end colours; confirm it passes now (this is `A4`'s guard, not a red)
- [x] 2.5 Add the heading assertion: the courses section heading says "Courses" exactly once; watch it fail reporting `"Education Courses Courses"`
- [x] 2.6 Add a unit test for the composed metadata title and JSON-LD name; watch it fail

## 3. Implementation

- [x] 3.1 `category-courses.tsx` — section wrapper to `py-section lg:py-12`
- [x] 3.2 `category-why-choose-us.tsx` — same
- [x] 3.3 `course-cat/[slug]/page.tsx` — the FAQ section wrapper, same
- [x] 3.4 `category-courses.tsx` — heading to `` `${categoryCtaLabel(categoryName)} Courses` ``
- [x] 3.5 `course-cat/[slug]/page.tsx` — metadata title and JSON-LD `name` composed the same way
- [x] 3.6 Re-run 2.2, 2.5 and 2.6 green; confirm 2.3 and 2.4 still pass

## 4. Mutation check

- [x] 4.1 Revert one section to `py-12`, confirm the 440 assertion fails naming that boundary and its observed value, restore
- [x] 4.2 Change one gradient stop in `hero-wave.tsx`, confirm the hero assertion fails with expected/observed, restore
- [x] 4.3 Revert the heading to `{categoryName} Courses`, confirm the heading assertion fails with the doubled string, restore

## 5. Docs

- [x] 5.1 `QA-CAT-A4` → `CANT-REPRODUCE` with the pixel table, the guard's test reference, and the note that the report reviewed the live WP site
- [x] 5.2 `QA-CAT-A5` → `FIXED` with its test reference and the `--spacing-section` reasoning
- [x] 5.3 File `QA-CAT-A6` — `Ref = NONE`, origin stated (found while measuring `A5`), `FIXED`, tests referenced
- [x] 5.4 Re-verdict `QA-BLOG-D2` and `QA-COURSES-D2` against 1.4's screenshots — only if the evidence supports it, and stating what was seen at which route
- [x] 5.5 Page index — Course Category `Open 2` → `Open 0`, `Ready` recomputed; adjust Blog and All Courses if 5.4 moves them
- [x] 5.6 Appendix B — drop `QA-CAT-A5`, add nothing (the new row ships with its tests)

## 6. Gate

- [x] 6.1 `pnpm typecheck` clean
- [x] 6.2 `pnpm lint` — no new errors
- [x] 6.3 `pnpm test` — green including the doc checker's 6 assertions
- [x] 6.4 Restart `pnpm dev`, warm the touched routes, then full `pnpm test:e2e`; compare against the corrected baseline (4 specs × 3 projects) and re-run any extras before believing them
- [x] 6.5 `openspec validate qa-course-category-rows --strict`
- [ ] 6.6 Commit
