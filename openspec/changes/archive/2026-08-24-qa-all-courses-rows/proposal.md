## Why

`QA-COURSES-A4` (report item `R-COURSES-1920-03`, "In the CTA, there are courses written multiple times — remove one course from the CTA") is the only Class A row left open on `/all-courses`. Its cause is now identified: `courses-by-category-section.tsx` composes its two CTAs as `View all {category.name} courses`, and **18 of the 20 course categories the WP API serves already end in the word "Courses"** — so the live page renders "View all Care Certificate Courses courses".

The Figma frame (`3306:50109`, section `3306:50171`) shows the intended copy: heading **"Care Certificate"**, CTA **"View all care certificate courses"** — the category name without its `Courses` suffix, followed by the word once.

## What Changes

- Add a shared label helper that strips a trailing `Course`/`Courses` token from a category name, so the CTA carries the word exactly once.
- Apply it to **both** CTAs in `courses-by-category-section.tsx` (the top-right inline link and the bottom pill button). The frame carries both, so neither is removed — only the duplicated word is.
- Preserve the remaining name's casing rather than lower-casing it as the frame's single sample does. Lower-casing is CMS content transformation and would render "haccp"; the same reasoning already closed `QA-COURSES-A3`. The casing delta is recorded on the row for a design ruling.
- Guard with a unit test over the helper (including the two categories that carry no suffix) and an e2e assertion that no CTA on `/all-courses` contains the word twice.
- Update `docs/qa/QA_BY_PAGE.md`: `QA-COURSES-A4` → `FIXED` with its test reference, page index All Courses `3 open` → `2 open` (both remaining are Class D), Appendix B drops the owed test.

Not in this change: `QA-COURSES-D1` (mobile responsive, unbounded) and `QA-COURSES-D2` (hero pattern, shared with `QA-BLOG-D2` and `QA-PRICE-A1`) — both Class D, each needs its own sized change.

## Capabilities

### New Capabilities

- `all-courses-catalogue`: the `/all-courses` category-section presentation — how a category's CTAs are labelled from CMS-supplied category names.

### Modified Capabilities

_None._

## Impact

- `src/components/courses/courses-by-category-section.tsx` — both CTA labels
- `src/lib/utils/` — new category-label helper
- `src/__tests__/` — new unit test for the helper
- `e2e/qa-round-1.spec.ts` or `e2e/design-fidelity.spec.ts` — one CTA assertion
- `docs/qa/QA_BY_PAGE.md` — row status, page index, Appendix B
- `.context/figma/targets.md` — frame evidence for the row

No API, data-shape or route change. The component is used only by `all-courses-client.tsx`.
