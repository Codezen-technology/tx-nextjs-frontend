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
- **`QA-HOME-A5`** — **outcome: `BLOCKED-DESIGN`, no code changed.** The report's target
  is that a price's `£` renders in **Inter**. The frame binds the price to
  `Heading/Bold/H2` = SUSE, which the build already computes, so the token agrees. But
  rendering the frame's `£29` beside SUSE Bold shows the digits pixel-identical and the
  `£` visibly not — the frame's is narrow with a thin crossbar, SUSE's is boxy with a
  crossbar heavy enough to read as a strikethrough. The design and the build show
  different pound signs, which is the reported symptom. Which face the symbol takes is a
  design ruling and is not guessed here. Evidence in `.context/figma/targets.md`.
- Three Playwright assertions added to `e2e/design-fidelity.spec.ts` for `A6` and `A7`,
  each **written failing first**, each naming page / property / breakpoint / expected /
  observed. `A5` gets none — a blocked row gets no assertion.
- `docs/qa/QA_BY_PAGE.md`: `A6` and `A7` flipped to `FIXED` with their test references and
  their backlog lines deleted; `A5` reclassified Class E `BLOCKED-DESIGN` with its
  evidence, keeping one backlog line pending the ruling. Page index goes
  `RED / Open 3 / Blocked 3` → `AMBER / Open 0 / Blocked 4`.

No Class E row is touched — `E1`, `E2` and `E3` stay `BLOCKED-DESIGN` with the code
untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `homepage-sections`: adds requirements for the two sections' **mobile** layout — the CPD
  Certificate section stacks below `lg` and the page never scrolls wider than the
  viewport; the categories CTA sits below the grid at mobile widths. Today the spec
  describes only section presence and order, so none of this is currently asserted at
  spec level. **No price-typeface requirement** — an earlier draft carried one, and it
  was withdrawn once the evidence showed the `£` may legitimately need a different face
  from the digits beside it.

## Impact

- `src/components/home/cpd-certificate.tsx` — responsive direction on the section row
- `src/components/home/categories-grid.tsx` — CTA placement at mobile
- `e2e/design-fidelity.spec.ts` — three new assertions
- No font is added. `src/app/layout.tsx` and `src/app/globals.css` are untouched: `A5`
  resolved to a design question, not a missing face
- `docs/qa/QA_BY_PAGE.md` — three status flips, page index arithmetic, Appendix B
- `.context/figma/targets.md` — any value measured while deriving the above

Risk retired: no third webfont is added, because `A5` did not resolve to a missing face.
The open risk is now that `A5` sits blocked until design rules which face the `£` takes.
