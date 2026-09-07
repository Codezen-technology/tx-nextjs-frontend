## Why

`globals.css` states one rule for surfaces that have to line up with the page content
column, and gives the reason in the file: the cap branch resolves `100%` against a
full-width ancestor "rather than `100vw` on purpose — `100vw` includes the scrollbar,
which `container`'s centring does not, and the two would disagree by half a scrollbar."

The single-course page now breaks that rule. Moving the purchase card into the hero
(Figma `6239:163263`) put the hero inside the page's centred container, so its navy
backdrop has to escape that container to reach the viewport edges. It does so with
`w-screen -translate-x-1/2`, and the resulting scrollbar-width overhang is contained by
`overflow-x-clip` on the page root. That is the only layout `w-screen` in `src/` — every
other full-bleed surface (`trusted-orgs`, the course-category hero) uses the sanctioned
`grid-inset-start`.

The exception is documented in place rather than hidden, and its measured impact today is
nil. It is still a second way of describing the page grid, which is exactly what the
`container` comment warns produces drift: "five independent copies of `1400px` is how the
header, the mega menu and the trusted-orgs bleed drifted apart from the page column in
the first place."

The constraint that forces it is real: a box that is viewport-wide **and** exactly one row
tall inside a _centred_ grid cannot be expressed without `100vw`. Removing the exception
means changing the structure, not the value.

## What Changes

- The single-course page moves from a centred `container` to a full-width grid, so the
  hero row's backdrop is `100%` of a full-width ancestor and needs no viewport unit.
- Content columns are inset from the same tokens the container reads, via
  `grid-inset-start` and a new mirrored `grid-inset-end` — one definition, both edges.
- `overflow-x-clip` comes off the page root, along with the `w-screen` backdrop and the
  comments marking them as an exception.
- The card column keeps its current width and sticky behaviour; this is a layout
  substrate change, not a visual one, and the rendered result should be unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-grid`: adds the end-edge counterpart to `grid-inset-start`, so a surface can align
  to either edge of the content column from the same tokens.

## Impact

- `src/app/globals.css` — new `grid-inset-end` utility beside `grid-inset-start`.
- `src/app/[locale]/(marketing)/course/[slug]/page.tsx` — container to full-width grid.
- `src/components/courses/course-banner.tsx` — backdrop drops `w-screen`.
- Shared grid tokens are read, not restated, so no other page changes. Because the grid is
  shared, the result must be re-measured against Figma at 1280, 1440 and 1920 before this
  is called done — the padding ramp is a measured ramp, not a formula.

## Notes

Deferred deliberately. Raised by a standards review of the hero-card layout work; the
exception it describes is committed with an in-place comment pointing here.
