## 1. Evidence

- [x] 1.1 Record the frame evidence for `QA-COURSES-A4` in `.context/figma/targets.md`: node `3306:50171`, heading `Care Certificate`, both CTAs `View all care certificate courses`, button widths 291/332/332/279 across the four sections
- [x] 1.2 Record in the same entry the two deliberate deviations from the frame — casing preserved (Decision 2) and the section heading left as the CMS name (Non-Goals) — with the `QA-COURSES-A3` precedent named
- [x] 1.3 Capture the live category names as a committed fixture (all 20 from `GET /lms-backend/v1/course-categories?per_page=50`) for the unit test, and note in it that prod could not be sampled (SG captcha on the REST route)

## 2. Failing tests first

- [x] 2.1 Write `src/__tests__/category-label.test.ts` against a not-yet-existing `categoryCtaLabel`: every fixture name yields exactly one `/\bcourses?\b/i` match, `Care Certificate Courses` → `Care Certificate`, `Fire Marshal Course` → `Fire Marshal`, `Groupon` → `Groupon`, `Courses` → `Courses`, `HACCP Courses` → `HACCP` (casing preserved)
- [x] 2.2 Run it and watch it fail on the missing module — record the message
- [x] 2.3 Add the e2e assertion to `e2e/design-fidelity.spec.ts` beside the existing All Courses cases: every `View all …` link on `/all-courses` matches `/\bcourses?\b/gi` exactly once
- [x] 2.4 Restart `pnpm dev` first (stale-CSS/stale-route failures are indistinguishable from real ones — `QA_EXECUTION.md`), then run the e2e and watch it fail reporting the doubled label it actually found

## 3. Implementation

- [x] 3.1 Add `src/lib/utils/category-label.ts` — `categoryCtaLabel(name)` strips a trailing ` Course`/` Courses` (case-insensitive, tolerant of trailing whitespace) only when a non-empty remainder is left, and preserves the remainder's casing
- [x] 3.2 Use it for the inline heading-level link label in `courses-by-category-section.tsx`
- [x] 3.3 Use it for the pill button label below the grid in the same file, from the same call — both surfaces read one value
- [x] 3.4 Re-run 2.1 and 2.3 green

## 4. Mutation check

- [x] 4.1 Revert the inline link to `{category.name}`, confirm the e2e fails naming the doubled word, restore
- [x] 4.2 Revert the pill button the same way, confirm the same, restore
- [x] 4.3 Break the helper's suffix match, confirm the unit test fails on a named fixture, restore

## 5. Docs

- [x] 5.1 `docs/qa/QA_BY_PAGE.md` — `QA-COURSES-A4` → `FIXED`, test reference filled in, note carrying the cause (18/20 CMS names already end in `Courses`), the casing deviation, and the unfiled heading-suffix observation
- [x] 5.2 `docs/qa/QA_BY_PAGE.md` page index — All Courses `Open 3` → `Open 2`, both remaining Class D; owner column updated
- [x] 5.3 `docs/qa/QA_BY_PAGE.md` Appendix B — drop the `QA-COURSES-A4` owed test
- [x] 5.4 Update the board totals wherever `QA_EXECUTION.md` or the index states an open count

## 6. Gate

- [x] 6.1 `pnpm typecheck` clean
- [x] 6.2 `pnpm lint` — no new errors
- [x] 6.3 `pnpm test` — all green including the doc checker's 6 assertions
- [x] 6.4 Restart `pnpm dev`, then full `pnpm test:e2e`; confirm the result equals the documented baseline (6 failed) with no new failure
- [x] 6.5 `openspec validate qa-all-courses-rows --strict`
- [ ] 6.6 Commit
