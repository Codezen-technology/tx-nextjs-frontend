## Why

The QA report's **Single Course Page** section lists 10 distinct defects, but
`docs/qa/QA_BY_PAGE.md` only ever triaged 4 of them into QA-IDs (`A1`, `B2`, `C1`, `E1`).
Six report items — breadcrumb removal, curriculum hours, FAQ icon hover, purchase-tab
hover, arrow-icon contrast, mobile bullet wrapping — have no row at all, so the page
index reads `Open 0` while they are still broken on `backend.trainingexcellence.org.uk`.
This is the same undercount that `qa-homepage-remaining-rows` corrected for the homepage.

A re-read of the source doc also unblocks `QA-COURSE-E1`: the report's
`Solution(Dev)` for the mobile rating is **not** blank — it reads "The rating should
match the course card ratings". The row was filed `BLOCKED-DESIGN` on a stale reading.

Code was checked against every report item before writing this proposal; the findings
per item are in `design.md` §1.

## What Changes

Six defects to fix, one row to re-open, two report items to close as already-satisfied.

**Fix (verified broken in code):**

- Remove the visual breadcrumb bar from `/course/[slug]` — keep the `BreadcrumbList`
  JSON-LD, which is SEO structure and not the thing QA flagged
- Remove course-curriculum durations at all three render sites (summary line, section
  header, unit row) in `course-flat-curriculum.tsx`
- Add a hover affordance to the FAQ accordion `+`/`−` control (`course-faq.tsx` has
  none today)
- Add a hover state to the "For me" / "For teams" purchase tabs, including the
  **active** tab, which has no hover rule at all
- Bring the "Related Courses" heading onto the same token as the page's other section
  headings (`font-suse text-[32px] leading-[1.2] font-bold`) — currently missing
  `font-suse`/`leading`, and its loading skeleton still ships `text-xl font-medium`
- Raise the contrast of the low-visibility arrow/chevron icons on the page (target
  located during the measure step — candidates are the curriculum `ChevronDown` at
  `text-neutral-500` and the `prose-wp` list marker at `opacity: 0.6`)

**Re-open and resolve:**

- `QA-COURSE-E1` (mobile rating) — `BLOCKED-DESIGN` → open, class **B**. Both surfaces
  read the same normalized `rating` / `ratingCount` fields, so the mismatch is a display
  or rounding difference, not missing data
- Mobile 440 bullet-list text breaking mid-line — measure at 440 and fix the wrapping

**Close without code:**

- "Remove the hero background image" — already satisfied; `course-banner.tsx` paints a
  gradient overlay plus `HeroWave`, and uses the featured image only as the sidebar
  thumbnail
- "Hero body text should be longer" — no body text exists in the banner; this is a CMS
  content item, filed `CONTENT-GAP`

**Doc:** add the new rows to `docs/qa/QA_BY_PAGE.md` with QA-IDs, update the page-index
`Open`/`Blocked`/`Ready` values and Appendix A/B, per the recipe in `QA_EXECUTION.md`.

## Capabilities

### New Capabilities

- `single-course-page`: composition and interaction rules for `/course/[slug]` — no
  visual breadcrumb trail, curriculum listed without durations, hover affordance on
  every interactive control in the page's accordions and purchase tabs, section headings
  on one token, and rating parity between the course card and the course header

### Modified Capabilities

- `qa-by-page-verification`: none of its requirements change — the doc edits are data,
  not behaviour. Listed here only to record that the checker's assertions gate this
  change's doc updates

## Impact

**Code**

- `src/app/[locale]/(marketing)/course/[slug]/page.tsx` — drop `<CourseBreadcrumb />`
- `src/components/courses/course-breadcrumb.tsx` — becomes unused on this route; delete
  if no other route imports it
- `src/components/courses/course-flat-curriculum.tsx` — remove three duration renders
- `src/components/courses/course-faq.tsx` — hover on the toggle
- `src/components/courses/course-purchase-card.tsx` — hover on both tab states
- `src/components/courses/course-related.tsx` — heading token, both states
- `src/components/courses/course-banner.tsx` — mobile rating display (pending measure)
- `src/app/globals.css` — only if the arrow-contrast fix lands on `prose-wp`

**Tests**

- `e2e/course-detail.spec.ts` — new assertions per closed row (preferred home; it is
  already scoped to this route)
- `e2e/qa-round-1.spec.ts` — existing `QA-COURSE-*` CTA test stays as is

**Docs**

- `docs/qa/QA_BY_PAGE.md` — Single Course section, page index, Appendix A and B

**Not affected:** the `BreadcrumbList` JSON-LD in `page.tsx`, cart/checkout behaviour,
the WordPress API contract.
