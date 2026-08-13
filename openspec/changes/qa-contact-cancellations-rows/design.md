## Context

See `proposal.md — Why`. Four facts constrain the approach.

**1. The contrast gap is tiny and the blast radius is not.** White on `secondary-500`
#9E6F21 is **4.421:1** against AA's 4.5 — a 0.08 shortfall, invisible to the eye and
fatal to the check. `bg-secondary-500` appears in **47 places**, **39** of them alongside
`text-white`. So the defect is one token wide and the whole site long.

**2. It is not a button variant.** `src/components/ui/button.tsx`'s `secondary` variant
uses `bg-secondary`, a different token. Every failing surface applies
`bg-secondary-500 text-white` directly as a call-site `className`. There is no single
component seam to fix — which is exactly why the row records "a token decision, not a
page edit".

**3. `secondary-600` already clears AA, and is already the hover state.** #90651E measures
**5.165:1**. The three Cancellations buttons are `bg-secondary-500 hover:bg-secondary-600
text-white` — so today the control becomes compliant only once you point at it, which is
the inversion the spec's second scenario names.

**4. `secondary-500` is a measured brand token.** `globals.css:619` records it against
Figma node `83:4218`. Under the `design-token-fidelity` rules that governs this repo, a
measured value does not move because a downstream check is inconvenient — it moves when
design rules that it should.

Contact is unrelated mechanically and shares only the slice: frame `3277:44993` binds
five fills that the build renders as one white section.

## Goals / Non-Goals

**Goals:**

- Close both rows with evidence, taking the report's open Class A count to zero.
- Fix the contrast defect wherever it occurs, not only on the page that filed it.
- Keep the resting/hover relationship intact — a button that no longer visibly responds
  to hover is a new defect traded for an old one.

**Non-Goals:**

- Redefining `--color-secondary-500`. That is option A below, and it is rejected here
  pending a design ruling rather than taken quietly.
- A general accessibility audit. Contrast of brand-filled interactive labels only —
  not body text, not focus rings, not non-text contrast (WCAG 1.4.11).
- The three Class D rows, which need their own changes.

## Decisions

### D1 — `QA-CANCEL-A2`: shift the surfaces, not the brand token

| Option | What                                                                                           | Verdict                                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | Redefine `--color-secondary-500` to the nearest AA-passing value (#9B6D20, **4.563:1**)        | **Rejected for now.** One line, fixes all 47, visually imperceptible — and it silently edits a token measured from `83:4218`. Recorded as the design ask, not taken unilaterally |
| **B**  | Repoint the 39 white-text surfaces to `secondary-600`, and move their hover to `secondary-700` | **Chosen.** Uses tokens that already exist, changes no measured value, and passes at 5.165:1 with headroom rather than by 0.06                                                   |
| **C**  | New semantic token (`--color-secondary-interactive`) that the 39 point at                      | Deferred. Right long-term seam, but it introduces a token this change cannot measure against any frame — the same mistake `A5` just cost us                                      |
| **D**  | Darken the label instead of the fill                                                           | Rejected. White-on-gold is what the frame specifies; changing the label changes the design to satisfy a checker                                                                  |

Option B's cost is honest and worth stating: **the resting gold gets visibly darker** on
every affected surface. That is a real visual change, and it is the price of the rows
being right. Option A is cheaper visually and more expensive in governance; if design
rules for A, B reverts to a one-line change and the assertion is unaffected — which is
the point of asserting the _ratio_ rather than the token name.

Hover moves 500→600 today; under B it becomes 600→700 so the affordance survives.
`secondary-700` #704F17 exists already.

### D2 — Assert the computed ratio, never the class

The check reads `getComputedStyle(el).color` and `backgroundColor`, converts both to
relative luminance and computes the WCAG ratio in the page. It must not assert
`className.includes("secondary-600")`.

Two reasons. A class-name assertion passes if the token behind it is later redefined to
something failing — the exact regression the row describes. And it would have to be
rewritten if design later takes option A, when nothing about the requirement changed.

`backgroundColor` may be `rgba(0,0,0,0)` on a control whose fill is on an ancestor, so
the measurement walks up for the first non-transparent background and records which
element it came from.

### D3 — `QA-CONTACT-A2`: reclassify to `GAP`, then assert the fills

The row sits `MANUAL-VISUAL` on the grounds that section colour is "a colour-matching
judgement". Frame `3277:44993` binds five _named tokens_ — `primary-50` #E6F8FE,
`primary-100` #B0EAFA, `primary-500` #00BBF0, `secondary-500` #9E6F21, `N30` #EBEDF1.
Reading a named token off a frame and comparing it to a computed fill is a measurement.
Rule D4 of the QA doc's design reserves `MANUAL-VISUAL` for judgement, and the doc's own
invariant forbids a row being both — so the row is reclassified `GAP` and gets a test.

The judgement that genuinely remains is **which section takes which fill**, and that is
settled once by reading the frame section by section during task 1, then recorded in
`targets.md` as `section → token → hex → 3277:44993`. After that it is arithmetic.

If the frame turns out not to bind a fill for a section the build paints, that section is
recorded and left alone rather than guessed — the same rule that put `A5` on the blocked
ledger.

## Risks / Trade-offs

- **The resting brand gold visibly darkens on ~39 surfaces** → Stated up front as the
  cost of option B; a screenshot pass at 1920 over the affected pages before the flip,
  and the option-A ask recorded for design so the visual can be restored by ruling.
- **Hover becomes 600→700, a smaller perceptual step than 500→600** → Verify the hover
  delta is still perceptible; if it is not, hover moves to 800 rather than reverting the
  resting fix.
- **Sweeping 39 call sites risks catching a surface where the fill is decorative, not a
  control** → The sweep is driven by `bg-secondary-500` _paired with_ `text-white`, and
  the assertion only covers interactive elements, so a decorative fill is out of scope
  either way.
- **The contrast check runs site-wide and may fail on pages outside this slice** → That
  is the requirement's intent, but it can make the slice unshippable. Triage on first
  run: anything failing outside Contact/Cancellations is either fixed by the same token
  shift, or recorded as a new QA row and the check scoped to the covered pages until it
  is worked. Do not silently narrow the check without recording it.
- **Contact's frame may not cover 1280/440** → Assert only the widths it binds; record
  the others as unmeasured rather than assuming the 1920 fills ramp.

## Open Questions

- Should option A (redefining `--color-secondary-500` by 3/2/1 hex steps) go to design as
  a formal ask alongside this change, or wait until the Class E ledger is re-issued in
  the close-out slice? Deferrable — B ships either way and A becomes a one-line
  simplification whenever the ruling lands.
