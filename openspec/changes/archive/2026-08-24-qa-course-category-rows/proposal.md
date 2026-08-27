## Why

`/course-cat/[slug]` holds the last two open Class A rows on any page tied at the top of the board: `QA-CAT-A4` (hero background colour) and `QA-CAT-A5` (40px between sections at 440). Both were measured before this proposal was written, and the measurements split them:

- **`QA-CAT-A4` does not reproduce.** The frame's hero gradient (`3294:42433`) and the build's, sampled at eight points across the full width, differ by **at most 1/255 on any channel** — `rgb(0,32,74) → rgb(0,79,101)`, matching. The frame's plus-pattern along the band's bottom edge is present too. The report reviewed the **live WordPress site** (`backend.trainingexcellence.org.uk/course-cat/animal-care-training`), so the defect was real there and the headless rebuild already carries the design's fill.
- **`QA-CAT-A5` is real.** All three of the page's sections use `container py-12` (48px), so a boundary at 440 measures **96px** against the report's 40. The homepage already solved this: `--spacing-section` is 20px, each boundary owns half, and `lg:py-*` keeps desktop untouched. The category page never picked it up.

Measuring also turned up a defect the report does not carry, on the page being worked: the courses section heading renders `{categoryName} Courses`, and category names already end in "Courses" — so the page shows **"Education Courses Courses"**. This is the same defect `QA-COURSES-A4` just closed on `/all-courses`, one page over, and it also reaches the SEO title and the JSON-LD `name`.

## What Changes

- **`QA-CAT-A5`** — the three category-page sections adopt `py-section lg:py-12`, so a 440 boundary reads 40 and desktop keeps its current 48. Guarded by an assertion that measures the boundaries at 440.
- **`QA-CAT-A4`** — closed `CANT-REPRODUCE` with the pixel comparison recorded, plus a regression guard asserting the hero's computed gradient still equals the measured design value. The row is closed on evidence, not on inspection.
- **New row `QA-CAT-A6` (`Ref = NONE`, origin stated)** — the duplicated "Courses" in the section heading, the metadata title and the JSON-LD name, fixed with the `categoryCtaLabel` helper shipped by `qa-all-courses-rows`.
- **Re-verdict two Class D rows if the evidence holds.** `QA-BLOG-D2` and `QA-COURSES-D2` both say the hero pattern is missing. The pattern is `HeroWave`, which the category, all-courses, blog, certificate and course-detail heroes all render — visible in the category hero screenshot taken for `A4`. Both rows will be checked at their own routes and re-verdicted with screenshots. Pricing's hero genuinely lacks it (already recorded on `QA-PRICE-A1`), so this is not a blanket close.

## Capabilities

### New Capabilities

- `course-category-page`: the `/course-cat/[slug]` page's band presentation — hero fill, section rhythm, and how the category name is used in headings and metadata.

### Modified Capabilities

_None._

## Impact

- `src/components/courses/category-courses.tsx` — section padding, heading label
- `src/components/courses/category-why-choose-us.tsx` — section padding
- `src/app/[locale]/(marketing)/course-cat/[slug]/page.tsx` — FAQ section padding, metadata title, JSON-LD `name`
- `e2e/design-fidelity.spec.ts` — 440 rhythm, hero gradient, heading assertions
- `docs/qa/QA_BY_PAGE.md` — two rows closed, one filed, two Class D rows re-verdicted, page index, Appendix B
- `.context/figma/targets.md` — the pixel comparison and the rhythm measurements

`src/lib/utils/category-label.ts` is reused as-is. No API, data-shape or route change.
