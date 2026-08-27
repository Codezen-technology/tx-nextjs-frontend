## Why

Class A is the largest untouched block in the QA report — roughly 27 spacing,
padding, weight and hover items across every public page. It has been held back
because the report links two different Figma nodes per page and the execution
plan recorded six of those pairs as decisions the team had to make. Writing
pixel targets against an unresolved node would be guessing.

That premise no longer holds. Figma is reachable with a Dev seat, and
`get_metadata` returns exact geometry: the canvas node for the homepage is
`Homepage - Redesigned`, 1920×7055, with `y` and `height` on all 662 descendant
nodes. Every Class A target in the report — "hero top/bottom spacing 80–100px",
"mobile section spacing 40px", "laptop side padding 128px" — is a number that
can be read off the frame rather than negotiated. The divergent pairs can be
resolved the same way: render and measure both, and pick by evidence.

So the blocker is smaller than recorded. It is not "six decisions"; it is
"however many of the six are genuine ties after measurement", which is likely
fewer and possibly none.

Two rounds of triage on this report have now each overturned an assumption that
looked safe on paper — the homepage images were a component bug _and_ a content
gap, and five of the six remaining Class C items turned out to be
`CANT-REPRODUCE`. Measuring first is the pattern that keeps working.

## What Changes

- **Resolve the six divergent Figma node pairs by measurement**, recording the
  authoritative node per page and the evidence for it. Escalate only pairs where
  the two candidates genuinely disagree on the values this change needs.
- **Derive every Class A target from the resolved node** rather than from the
  report's prose. The report says "80–100px"; the frame says one number.
- **Apply the resolved values** across the ~27 items: hero vertical rhythm,
  mobile section spacing, laptop side padding, dropdown padding, section header
  weight and casing, card title hover colour, related-course title sizing, and
  cart card parity.
- **Add a token-fidelity check** that compares computed values against the
  recorded Figma targets at 1920 / 1280 / 440 — asserting the number the design
  specifies, not re-asserting the stylesheet against itself.
- **Resolve the Class E items that measurement can answer.** The execution plan
  already identified several as self-resolving from tokens or from the 440
  frame; with Figma access the mobile hero text field and the two "no target
  given" items may join them. Anything still ambiguous stays `BLOCKED-DESIGN`.
- Non-goal, stated explicitly: no Class D builds, and no guesses at the items
  that remain genuinely ambiguous after measurement.

## Capabilities

### New Capabilities

- `design-token-fidelity`: Which Figma node is authoritative for each page, how
  a spacing or typography target is derived from it, and the requirement that
  public pages match those targets at the three supported breakpoints.

### Modified Capabilities

None. Class A changes visual values, not behaviour — the existing page specs
describe what each page renders and in what order, and none of that changes.

## Impact

**Code**

- `src/app/globals.css` — shared spacing and typography utilities
- Hero components across marketing pages — vertical rhythm
- `src/components/courses/*` — related-course title sizing, category padding
- `src/components/cart/*`, `src/components/checkout/*` — card parity, dropdown padding
- Section headers site-wide — weight and Title Case
- Card components — hover colour stability

**Verification**

- `e2e/` — a token-fidelity spec driven from the recorded Figma targets

**Documentation**

- The per-page Figma node resolution, recorded so the next round does not
  re-litigate it. This is the artifact the execution plan asked for and never got.

**Not affected**

- No API contract, no routing, no new dependencies, no data model.

**External dependency**

- Figma file `VoTEBKr8x4fWlObjkr7RXg`, read-only. Rate limits apply on the
  current plan tier, so measurement is batched per page rather than per item.
