## Why

Two open rows say the same thing on two pages: `QA-BLOGS-A7` ("the FAQ section is not similar to the actual design") and `QA-HELP-A1` ("the FAQ section has to be similar to the figma design").

`A7` was measured in a previous slice and deliberately left open, because `CourseFaq` also renders on the course, category and pricing pages and "applying a blog frame to it needs a scoping decision this row does not carry."

Measuring the Help frame settles that decision. Sampled from `6239:109818` and compared against the blog frame's recorded values: container fill `secondary-50` at 50% alpha, divider **`N30` #EBEDF1** exactly, answer panel `secondary-50` solid, square corners, `+`/`−` toggles. **The two frames specify the identical FAQ design.** It is one design, not a blog-specific one, so applying it to the shared component is convergence rather than overreach.

The build meanwhile has **two** FAQ implementations: `CourseFaq` (five call sites) and a separate hand-rolled accordion on `/help`.

## What Changes

- `CourseFaq` restyled to the frame — all eight properties the measurement names.
- `CourseFaq` rebuilt on `@radix-ui/react-accordion` directly, so it gains the keyboard and ARIA semantics the `/help` accordion has today and `CourseFaq` does not. Built on the primitive rather than the shadcn wrapper, whose trigger hardcodes a `ChevronDown` the frame does not use.
- `/help` switched to `CourseFaq`, deleting the second implementation. Its hardcoded question list is kept as-is.
- The hover affordance shipped by `QA-COURSE-A4` is retained and retuned to the new palette — the frames carry no hover state, so there is nothing to contradict, and removing it would reopen a closed row.
- **Four other pages change appearance**: course detail, course category, pricing, and the course tabs panel. Stated plainly rather than discovered later; course detail is `GREEN` and its existing assertions must keep passing.

## Capabilities

### New Capabilities

- `faq-section`: the site-wide FAQ accordion — its presentation against the measured frames, and its keyboard and screen-reader behaviour.

### Modified Capabilities

_None._

## Impact

- `src/components/courses/course-faq.tsx` — restyled and rebuilt on the accordion primitive
- `src/app/[locale]/(marketing)/help/page.tsx` — bespoke accordion replaced
- `e2e/design-fidelity.spec.ts` — frame-value assertions on both routes
- `e2e/course-detail.spec.ts` — existing FAQ hover assertions must survive
- `docs/qa/QA_BY_PAGE.md` — two rows closed, page index, Appendix B
- `.context/figma/targets.md` — the Help measurement and the two-frame comparison

No API, data-shape or route change.
