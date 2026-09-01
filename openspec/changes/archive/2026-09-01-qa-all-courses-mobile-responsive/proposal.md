## Why

`QA-COURSES-D1` (report item `R-COURSES-440-01`, "There are huge mobile responsive issues — the mobile responsive needs to be done properly") is the last open row on `/all-courses` and the only one the QA doc still carries as unsized. Measured on the deployed page at 440×956 on 2026-09-01:

- `document.scrollWidth` is **660** against a **440** viewport — **220px of horizontal overflow**, so the whole page pans sideways.
- The filter `aside` renders at its desktop **306px fixed width** beside the content column (`all-courses-client.tsx` composes `flex items-start gap-6` with no breakpoint), leaving the course column roughly 110px wide. Body copy breaks to one word per line and course cards are clipped.
- The hero keeps its desktop geometry unconditionally (`gap-[179px] py-[112px]`, `text-[40px]` title) — the 179px gap alone is 40% of the viewport.

A second defect only becomes visible once the page is usable on a phone: `all-courses-client.tsx` runs `scrollIntoView` in an effect keyed on `selected`, and that effect also fires on mount, so every load jumps the viewport past the hero to the first category section. It is visible on desktop too (the 1920 evidence screenshot opens mid-list) but on mobile it lands the user inside a card grid with no visible page heading.

## What Changes

- **Stack the catalogue below `lg`.** The filter and the course list become a single column at <1024; the current sidebar row is kept from `lg` up, where the 306px rail plus the 3-column grid fits. Desktop geometry at 1280 and 1920 is unchanged.
- **Turn the filter into a disclosure on mobile.** Below `lg` the category list collapses behind a "Course Categories" toggle, closed by default, showing the count of active filters; from `lg` up it renders open and static exactly as today. Nineteen categories at full height above the courses would otherwise push the first course card ~1200px down the page.
- **Make the hero responsive.** Mobile-first base values (column layout, reduced gap and vertical inset, smaller H1), with the measured desktop values re-applied at `lg` so the 1920 inset assertion and the 1280 page-grid assertion keep passing.
- **Fix the mount-time scroll jump.** `scrollIntoView` fires only on a user filter change, not on first render.
- **Guard at 440.** An e2e assertion in the `mobile-440` project that `/all-courses` has no horizontal overflow, plus assertions that the filter is collapsed by default and expands on activation. The existing 1920/1280 assertions stay untouched — this change must not move them.
- Update `docs/qa/QA_BY_PAGE.md`: `QA-COURSES-D1` → `FIXED` with its test reference, page index All Courses `1 open` → `0 open`, page colour re-derived. `QA-COURSES-D2` (hero pattern) is unaffected and stays `CANT-REPRODUCE`.

Not in this change: the page renders **297 course cards** in one document (every course of every category, server-rendered). That is a payload problem, not a layout one, and it needs its own sized change — filtering is client-side today and paginating it changes the data contract.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `all-courses-catalogue`: adds requirements for how the catalogue lays out below the desktop breakpoint — single column, no horizontal overflow at 440, filter collapsed by default on small viewports — and for when the results-scroll happens. Today the capability only covers CTA labelling.

## Impact

- `src/components/courses/all-courses-client.tsx` — responsive wrapper, filter disclosure state, mount-guard on the scroll effect
- `src/components/courses/course-category-filter.tsx` — collapsible header/panel, active-count badge
- `src/components/courses/all-courses-hero.tsx` — mobile-first layout, desktop values gated at `lg`
- `e2e/design-fidelity.spec.ts` — new 440 assertions; existing `all-courses` tests must keep passing unchanged
- `docs/qa/QA_BY_PAGE.md` — `QA-COURSES-D1` row, page index counts

No API, data-shape, route or SEO change. Course card markup and the category CTA labels shipped by `qa-all-courses-rows` are not touched.
