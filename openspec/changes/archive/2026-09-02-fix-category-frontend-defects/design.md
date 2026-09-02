## Context

See `proposal.md` — Why. Two facts shape the approach:

- `CategoryWhyChooseUs` renders its image inside
  `hidden shrink-0 … lg:block lg:h-[312px] lg:w-[526px]`. The wrapper is the only
  sizing authority: the `next/image` inside it is `fill`, so removing the `hidden`
  gate without giving the wrapper a sub-`lg` height produces a zero-height box — the
  same collapse `cms-image-resilience` was written to prevent.
- `TrustedOrgs` already takes its payload as a prop and already returns `null` for an
  empty list. `/pricing` renders it from `serverApi.home.get().catch(() => null)`.
  There is a working precedent for using this band off the homepage; nothing new has
  to be built.

The category page currently fetches with `Promise.allSettled` over categories,
courses and Rank Math SEO, and calls `notFound()` when the category is missing.

## Goals / Non-Goals

**Goals:**

- One sizing authority for the "Why Choose Us" image across widths, so the mobile
  case cannot collapse the way `QA-HOME-C1` did.
- Reuse the existing trusted-organisations band and its existing data source rather
  than introducing a second logo list.
- A `GET /home` failure degrades the band only — it must not take down the category
  page, which today renders fine without any home data.

**Non-Goals:**

- The trusted **strip** beneath the header (copy divergence, site-wide, unraised).
- The FAQ section and the image _source_ for "Why Choose Us" — both blocked on
  `GET /course-categories` returning `faq` and `why_choose_us`, which it does not for
  any of the 20 categories.
- Any change to `TrustedOrgs` itself, or to the homepage and pricing pages that
  render it.

## Decisions

**Aspect-ratio box below `lg`, fixed box from `lg`.**
The wrapper becomes `relative w-full aspect-[16/9] … lg:aspect-auto lg:h-[312px]
lg:w-[526px]`. An aspect ratio, not a fixed pixel height, because the mobile column
width varies with the viewport and the desktop box is 526×312 — a 1.69 ratio, which
16/9 (1.78) tracks closely enough that the crop does not change character between
widths. Alternative considered: a fixed `h-[205px]`, matching the 440 frame exactly.
Rejected — it is correct at 440 and wrong at every other sub-`lg` width, and 440 is a
QA measurement point, not the only phone.

**`order` rather than a second markup copy.**
The image keeps its single DOM node and follows the reason list in source order; the
`lg:flex-row` on the existing wrapper already puts it to the right at desktop. The
Single Course page's duplicated desktop/mobile purchase cards are what produced 14
false-positive zero-box images in the E2E image sweep — not a pattern to repeat.

**Fetch `home` in the existing batch, not a separate await.**
`serverApi.home.get()` joins the page's `Promise.allSettled` array. `allSettled`
already gives per-promise failure isolation, so a `GET /home` outage yields
`status: "rejected"`, the band is skipped, and the rest of the page is untouched.
Alternative considered: a nested Suspense boundary streaming the band in. Rejected as
disproportionate — the call is already cached (`revalidate: 300`, tag `home`) and
shares its cache entry with the homepage, so on a warm cache it costs nothing.

**Band placement below `CategoryWhyChooseUs`, outside its `bg-white` wrapper.**
The band carries its own `bg-secondary-50` and its own `py-section lg:py-12`, and
bleeds off the right edge via `grid-inset-start`. Nesting it inside the white section
wrapper would inset it by a second page-pad — the defect `QA-PRICE-A5` records.

**Fallback treatment stays the existing gradient block.**
The section already renders a navy→teal gradient when no image is supplied. That path
just becomes reachable below `lg` too. No new placeholder art is introduced, and no
`FallbackImage` swap is needed: the source here is a single CMS field that is either
set or null, not a URL that might 404 — and today it is null for every category, so
the gradient is what mobile will actually show until the backend catches up.

## Risks / Trade-offs

- **The mobile image ships invisible.** Every category currently returns
  `why_choose_us: null` and `image: null`, so at 440 this change makes the _gradient_
  appear where nothing was before. → Intended: the QA row asks for the section to be
  complete on mobile, and the gradient is the section's defined empty state. Verify
  the image path with a locally stubbed category rather than against live data.
- **A 16/9 mobile crop may cut a subject the designer centred for 526×312.** →
  `object-cover` centres the crop; the ratios are within 5%. Revisit only if the
  backend ships artwork that breaks under it.
- **The band adds a fourth network call to a page that renders fine with three.** →
  `allSettled` plus the shared 300s cache entry bounds the cost; a rejection is a
  no-op for everything but the band.
- **Two QA rows on this page stay open after this change.** → Stated in the proposal
  and in the tasks, so the change is not mistaken for closing the category page.

## Migration Plan

Not applicable — presentation-only, no data model, no stored state. Rollback is a
revert of the two files.

## Open Questions

None. The two candidate Figma frames (`3294:42427`, `6015:108699`) were compared and
agree on both the image and the band's position, so the node-divergence question
tracked for this page does not gate this work.
