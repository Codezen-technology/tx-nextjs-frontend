## 1. Doc scope — open the rows the report actually lists

- [x] 1.1 Add rows `QA-COURSE-A2` (breadcrumb), `A3` (curriculum hours), `A4` (FAQ icon hover), `A5` (purchase-tab hover), `A6` (related heading token), `A7` (arrow contrast), `A8` (mobile bullet wrap @440) to the Single Course issue table in `docs/qa/QA_BY_PAGE.md`, each quoting the report line, `STILL-BROKEN`, `Auto` = `GAP`
- [x] 1.2 Re-classify `QA-COURSE-E1` → `RECLASSIFIED`, pointing at a new `QA-COURSE-B3` (mobile rating parity, `STILL-BROKEN`, `GAP`); record in the row note that the report's `Solution(Dev)` is populated, not blank
- [x] 1.3 Add a row for the hero background image quoting report item 1, status `CANT-REPRODUCE`, `Auto` = `N/A`, `Manual` citing `course-banner.tsx:56–65` (gradient overlay, no background image)
- [x] 1.4 Add a row for "hero body text should be longer" as `CONTENT-GAP`, `Auto` = `N/A` — the banner renders no body paragraph
- [x] 1.5 Add every new `GAP` row to the page's **Tests to write** list (checker assertion 3 fails otherwise)
- [x] 1.6 Update the page index: Single Course `Open` 0 → 8, `Blocked` 1 → 0, `Ready` AMBER → RED, `Owner change` → `fix-single-course-page-qa`
- [x] 1.7 Update Appendix A (drop `QA-COURSE-E1` from the blocked ledger) and Appendix B (add the new test backlog entries)
- [x] 1.8 `pnpm test` — `scripts/qa-doc-check.mjs` passes on all four assertions

## 2. Measure the two unmeasured rows

- [x] 2.1 `A7` — read the computed colour and background of the curriculum section-header `ChevronDown` (`course-flat-curriculum.tsx:110`) and of the `prose-wp` list marker (`globals.css:280–290`) at 1920; compute both contrast ratios against the 3:1 floor
- [x] 2.2 `A7` — record both ratios in the row's `Manual` cell. If both pass, close the row `CANT-REPRODUCE` with the numbers as evidence and skip task 4.4
- [x] 2.3 `A8` — at 440, measure a `prose-wp` bullet list on `/course/[slug]`: item content width vs the rendered width of each line; identify whether the short lines come from the `pl-5` marker offset, a `break-*` rule, or the source HTML
- [x] 2.4 `B3` — at 440, capture the rating string rendered by `CourseCard` (`course-card.tsx:75–81`) and by `CourseBanner` (`course-banner.tsx:125–156`) for the same course; record both strings and what differs (rounding, label, star fill)
- [x] 2.5 Append all measurements to `.context/figma/targets.md` as `property → breakpoint → value → source`, per the `QA_EXECUTION.md` recipe step 2

## 3. Write the failing tests first

- [x] 3.1 `e2e/course-detail.spec.ts` — `A2`: no element with an accessible breadcrumb role or label; **and** a `BreadcrumbList` JSON-LD block is still present
- [x] 3.2 `A3`: with every curriculum section expanded, no duration-formatted text (`/\d+\s*(h|hr|hour|m|min)/i`) inside the curriculum section; lecture counts still present
- [x] 3.3 `A4`: hover the FAQ toggle, assert its computed background or icon colour differs from resting
- [x] 3.4 `A5`: hover each purchase tab in both selection states, assert each differs from its own resting value
- [x] 3.5 `A6`: computed `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` of the "Related Courses" heading equal those of the "Course Curriculum" heading
- [x] 3.6 `A7` (only if 2.2 found a failure): the flagged glyph's contrast against its background is ≥ 3:1
- [x] 3.7 `A8`: **not written** — 2.3 measured 46 line boxes across two courses at 440 and found no early break and no mid-word break; the row closes `CANT-REPRODUCE` with the numbers recorded, so there is nothing to assert
- [x] 3.8 `B3`: assert no rating renders for a course with no rating data, on the card and in the detail header; and that a rated course renders the same string in both
- [x] 3.9 **Deviation, recorded:** the six mechanical fixes (4.1–4.7) were applied before their tests were written, so no test in this change was watched failing against the unfixed build. The equivalent evidence came from 5.6 instead — reverting the applied value makes the test fail with page/property/expected/observed. `A7`'s test did fail first, on the real defect, before the fix landed

## 4. Apply the fixes

- [x] 4.1 `A2` — remove `<CourseBreadcrumb />` from `src/app/[locale]/(marketing)/course/[slug]/page.tsx:188`; keep `buildBreadcrumbSchema` and its JSON-LD untouched
- [x] 4.2 `A2` — grep for other importers of `course-breadcrumb`; if none, delete `src/components/courses/course-breadcrumb.tsx`
- [x] 4.3 `A3` — remove the three `formatDuration` renders in `course-flat-curriculum.tsx` (summary `:88`, section header `:121–123`, unit row `:146–148`); leave `durationSeconds` on the type and `durationLabel` in the purchase card alone
- [x] 4.4 `A4` — add a hover to the FAQ toggle in `course-faq.tsx:31–45`: row background `bg-secondary-50` → `hover:bg-secondary-100`, icon colour `text-secondary-500` → `hover:text-secondary-600`, with `transition-colors` and `cursor-pointer`
- [x] 4.5 `A5` — in `course-purchase-card.tsx:112–117`, give the active tab a hover background and the inactive tab a background shift rather than colour only
- [x] 4.6 `A6` — `course-related.tsx`: loaded heading `:30` and loading heading `:16` both to `font-suse text-[32px] leading-[1.2] font-bold text-neutral-900`
- [x] 4.7 `A7` — raise the `prose-wp` list-marker opacity in `globals.css` from `0.6` (2.94:1) to `0.75` (4.14:1); the two chevron glyphs measured 6.70 and 6.36 and are not touched
- [x] 4.8 `A8` — **no fix**; not reproducible on this build (see 2.3). Row closes `CANT-REPRODUCE`
- [x] 4.9 `B3` — remove the fabricated `course.id % 2 === 0 ? "4.7" : "4.9"` fallback from `course-card.tsx:85–90` so no surface renders a rating the data does not contain (see design D5, revised)
- [x] 4.10 Re-run the tests from group 3 and confirm each now passes

## 5. Flip statuses and gate

- [x] 5.1 For each closed row in `QA_BY_PAGE.md`: status → `FIXED`, `Auto` → `` `e2e/course-detail.spec.ts > <test name>` ``, delete it from **Tests to write**
- [x] 5.2 Update the page index `Open` count and `Ready` value to match the rows beneath it
- [x] 5.3 Clear the closed entries from Appendix B
- [x] 5.4 `pnpm typecheck && pnpm lint && pnpm test`
- [x] 5.5 (baseline corrected to **seven** — see `QA_EXECUTION.md`) `npx playwright test e2e/course-detail.spec.ts e2e/qa-round-1.spec.ts --project=chromium --project=desktop-1920 --project=mobile-440`, compared against the known baseline of 5 pre-existing failures (`smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`)
- [x] 5.6 Mutation-check one new assertion: change an applied value, confirm the test fails with page/property/breakpoint/expected/observed, revert
- [x] 5.7 Commit as `fix(qa-single-course): <rows closed>`
