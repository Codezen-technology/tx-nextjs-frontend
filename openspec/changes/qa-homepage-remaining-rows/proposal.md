## Why

The Homepage's four originally-triaged Class A rows are closed, but a re-read of the
source QA report on 2026-08-12 surfaced three more that had never been given a QA-ID
(`2976254`). `docs/qa/QA_BY_PAGE.md` now reads `Homepage · RED · Open 3 · unowned`, and
all three are `GAP` — no test asserts any of them. They are the only unowned open Class A
rows left in the report, and one of them (`QA-HOME-A6`) is a live 32px horizontal
overflow at 440: the page scrolls wider than the viewport on every phone.

## What Changes

- **`QA-HOME-A6`** — the CPD Certificate section is `flex flex-row` at every width
  (`cpd-certificate.tsx:29`). At 440 that hands the text column 200px and the image box
  152px against the 248px it needs, so the second image ends at x=472 with no
  `overflow-hidden` ancestor to clip it. Stack the row below `lg` so the heading and body
  span the content column and `document.scrollWidth` equals the viewport width.
- **`QA-HOME-A7`** — "View all courses" sits in the categories heading row at every width
  (`categories-grid.tsx:57`). Move it below the grid at 440; desktop placement is
  unchanged and is not in question.
- **`QA-HOME-A5`** — the report's target is that a price's `£` renders in **Inter**. Inter
  is not among the app's loaded families (`--font-suse`, `--font-open-sans` in
  `layout.tsx`), so the face has to be loaded before any class can point at it. The row's
  recorded observation ("prices compute Open Sans") disagrees with the code, which sets
  `font-suse` on `plan-price` — the observed family is re-measured before anything is
  applied, per the measurement-beats-prose rule.
- Three Playwright assertions added to `e2e/design-fidelity.spec.ts`, each **written
  failing first**, each naming page / property / breakpoint / expected / observed.
- `docs/qa/QA_BY_PAGE.md`: three rows flipped to `FIXED` with their test references, the
  three "Tests to write" lines deleted, Appendix B's rows removed, and the page index
  updated to `Open 0` with `Ready` re-assessed. `scripts/qa-doc-check.mjs` enforces all
  but `Ready`.

No Class E row is touched — `E1`, `E2` and `E3` stay `BLOCKED-DESIGN` with the code
untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `homepage-sections`: adds requirements for the two sections' **mobile** layout — the CPD
  Certificate section stacks below `lg` and the page never scrolls wider than the
  viewport; the categories CTA sits below the grid at mobile widths — plus a requirement
  fixing the typeface a price is rendered in. Today the spec describes only section
  presence and order, so none of this is currently asserted at spec level.

## Impact

- `src/components/home/cpd-certificate.tsx` — responsive direction on the section row
- `src/components/home/categories-grid.tsx` — CTA placement at mobile
- `src/app/layout.tsx` — an additional `next/font/google` family, if `A5` is confirmed
- `src/app/globals.css` — the corresponding `--font-*` variable, if `A5` is confirmed
- `e2e/design-fidelity.spec.ts` — three new assertions and their `TARGETS` entries
- `docs/qa/QA_BY_PAGE.md` — three status flips, page index arithmetic, Appendix B
- `.context/figma/targets.md` — any value measured while deriving the above

Risk: adding a third webfont costs a network request and a layout-shift surface on every
page, for one glyph on one page. The design decision (load Inter vs. re-point the price at
an already-loaded family) is settled in `design.md` before `A5` is implemented.
