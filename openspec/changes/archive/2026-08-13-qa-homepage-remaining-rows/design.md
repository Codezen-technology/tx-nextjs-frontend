## Context

See `proposal.md — Why`. Three facts about the current state shape the approach.

**1. `A6` and `A7` are one defect class, `A5` is not.** Both `A6` and `A7` are a
horizontal flex row that never had a mobile direction. Both fixes are a Tailwind
responsive prefix on one element. `A5` is a typeface question with no measured target,
and it is the only one of the three that touches a global (the font stack in
`layout.tsx`).

**2. The recorded observation for `A5` is wrong.** `docs/qa/QA_BY_PAGE.md:147` says
"Prices compute `Open Sans` today." The code sets `font-suse` on the price span
(`quantity-selector.tsx:46`, `plan-price` testid) and on the comparison-table price
(`pricing-comparison.tsx:65`). Neither computes Open Sans. A row cannot close against a
false premise, so the observed family is re-measured in the browser before anything is
applied.

**3. The Figma dump carries no typography.** `.context/figma/home-6013-89909.json` has
zero `fontFamily` keys — the extract is geometry only. So unlike `A1`–`A4`, `A5` has no
target already sitting in `targets.md`; one has to be pulled fresh from node
`6013:89909` via the Figma MCP, or the row stays open.

The page's existing grid work is a constraint on `A6`: the CPD section already sits in
`.container`, which is on the `--page-grid-pad*` ramp. The fix must not introduce a
second horizontal inset — the heading spans the **content column**, not the viewport.

## Goals / Non-Goals

**Goals:**

- Close `QA-HOME-A6`, `QA-HOME-A7` and `QA-HOME-A5` with a test reference each, taking
  Homepage to `Open 0`.
- Kill the 32px mobile overflow with the same change that fixes `A6`'s narrow text — the
  report filed them as one item and they have one cause.
- Leave every desktop layout byte-identical. All three fixes are mobile-only or
  typeface-only.

**Non-Goals:**

- The three `BLOCKED-DESIGN` rows (`E1`, `E2`, `E3`). No guessed values.
- A general mobile audit of the homepage. Only the two sections the report names.
- Restyling the pricing cards. `A5` changes which family renders, not size, weight or
  colour.
- `QA-COURSES-D1` ("huge mobile responsive issues"), which is a Class D proposal on a
  different page even though it rhymes with `A6`.

## Decisions

### D1 — `A6`: `flex-col` below `lg`, not a grid rewrite

`cpd-certificate.tsx:29` is `flex flex-row items-center justify-between gap-10
lg:grid-cols-2` — the `lg:grid-cols-2` is dead, since the element is never `grid`. Change
the direction to stack below `lg` and drop the dead class.

**Why over the alternatives:**

- _Rewrite as a grid_ — larger diff, changes desktop's computed gaps, and the section
  already reaches the right desktop layout with flex. The rule is smallest change that
  hits the number.
- _`overflow-hidden` on the section_ — hides the overflow instead of fixing it, and
  leaves `A6`'s actual complaint (200px-wide heading) untouched. It would make the
  scroll-width assertion pass while the row stays broken, which is the failure mode the
  fidelity spec exists to catch.
- _`flex-wrap`_ — the image box would wrap at an unpredictable width rather than at a
  named breakpoint, and the assertion needs a breakpoint to name.

`lg` is the chosen breakpoint because the arithmetic in `QA_BY_PAGE.md:111` — the image
box needs 248px and the row is `justify-between` with `gap-10` — fails for any width
where the text column and 248px do not both fit, and `lg` (1024) is the existing
convention on this page.

**Revised after task 1.1 — the section has two faults, not one.** The measurements in
`targets.md` show the images escape their own grey box at 1280, 1024 and 768, not just at
440, because the box shrinks with the content column and the two `w-70` (280px) images do
not shrink with it. Stacking alone closes 440 and 768 and leaves **1024 overflowing the
viewport by 184px** — the `QA_BY_PAGE.md:111` arithmetic is correct about 440 and does not
generalise. So `A6` takes two edits, not one:

1. Stack the row below `lg` (this decision, unchanged), and move the text column's
   `max-w-104` cap from `md:` to `lg:` so the cap applies only while the row is
   side-by-side.
2. Let the images shrink inside their box. `w-70` stays — its comment records that
   `w-auto` collapses the box to 0×0 when a source fails to decode, which is `QA-HOME-C1`
   — so the fix is to unblock flex shrinking beneath it rather than to change the width.

At 1920 the box's content width is 664 − 80 = 584, and (584 − 24 gap) / 2 = **280** —
exactly the current rendered width, so edit 2 leaves the 1920 layout identical.

`overflow-hidden` is rejected here for the same reason as above: it would make the
scroll-width assertion pass while the images stayed clipped and wrong.

### D2 — `A7`: order the CTA, don't duplicate it

`categories-grid.tsx` renders heading and CTA in one `flex` wrapper above the grid. Move
the CTA to a sibling **after** the grid in DOM order, and pull it back into the heading
row at `md` and above with ordering/positioning utilities — rather than rendering it
twice with `hidden`/`md:block`.

**Why:** two copies means two DOM nodes with the same accessible name and href on every
page load, which a screen reader announces twice, and it doubles the target for any
future assertion. One node that moves is also what the spec scenario asserts — "the CTA's
top edge is below the grid's bottom edge" is meaningless if there are two.

The existing wrapper is already `flex flex-col items-end md:flex-row md:items-center`, so
the mobile column direction is there; what is missing is that the CTA is inside the
heading wrapper rather than below the grid.

**Revised: the CTA moves visually, not in the DOM.** "Sibling after the grid in DOM order"
was the wrong half of the trade. Either arrangement puts focus order at odds with visual
order at one breakpoint:

| Arrangement                                          | Desktop tab order                                             | Mobile tab order                            |
| ---------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| CTA last in DOM                                      | grid's 12 links, **then** the CTA at top-right — a regression | matches visual order                        |
| CTA before the grid in DOM, moved visually at mobile | heading → CTA → grid, unchanged from today                    | CTA announced before the grid it sits below |

Desktop keyboard use is the common case and today's desktop order is correct, so the
mismatch is spent on mobile. Keep the DOM as heading → CTA → grid, make the wrapper a
grid (`grid-cols-1 md:grid-cols-[1fr_auto]`) and give the CTA `order-last md:order-none`.
Reading order at mobile stays sensible — "Explore courses by category", "View all
courses", then the categories — which is what WCAG 1.3.2 asks; only the visual position
moves.

### D3 — `A5`: measure first, and prefer an already-loaded family

Order of operations, and it is not negotiable:

1. Read the computed `font-family` of `[data-testid="plan-price"]` in a real browser at
   1920 and 440. Record it. This corrects the doc's false premise either way.
2. Pull the pricing card's text token from Figma node `6013:89909` via the Figma MCP
   (`get_variable_defs` / `get_design_context`) and record it in `.context/figma/targets.md`
   as `property → breakpoint → value → source node`.
3. Apply.

**If the frame says Inter:** load it via `next/font/google` alongside SUSE and Open Sans,
expose `--font-inter`, and point the price at it. Accept the third-family cost (see
risks).

**If the frame says SUSE or Open Sans:** point the price at that family and record in
`node-resolution.md` that the report's "Inter" was not corroborated by the frame — the
measurement-beats-prose rule cuts against the report as readily as against the code.

**If the frame carries no typography for this node:** the row is `BLOCKED-DESIGN`, not
`FIXED`. It does not get a guessed family, and the page index keeps it in `Blocked`
rather than `Open`. This outcome is explicitly allowed and must not be worked around.

**Why not just add Inter now:** the report is a QA observer's prose, not a measurement.
Finding 2 of the runbook is a record of what generalising an unmeasured typographic value
already cost this project once.

**Resolved by task 1.4, then corrected.** The frame binds the price (`6089:107486`) to
`Heading/Bold/H2` = **SUSE**, and the build already computes `SUSE, "SUSE Fallback"` at
1920 and 440. Inter appears in `6013:89909` only as `Text xs/Medium` (12px), bound to
nothing in the pricing card. On that basis `A5` was closed by verification with an
assertion pinning the family.

**That close was wrong, and is withdrawn.** The token was never what the row complained
about. `A5` says the _pound symbol_ doesn't read as a pound symbol — a claim about glyph
shape, which a token binding cannot answer. Rendering the frame's own `£29` beside SUSE
Bold at matched size settles it: the **digits are pixel-identical** — so Figma is
rendering SUSE, at the same resolution — while the **`£` is not**. The frame's is a narrow
upright glyph with a thin crossbar; SUSE's is wide and boxy with a crossbar heavy enough
to read as a strikethrough. Advance widths at 32px/700 (`£`: SUSE 19.2, Open Sans 18.3,
Inter 20.4; `£29`: SUSE 57.6 vs the frame node's 57) are too close to separate on width
and are decisive on shape.

So the design shows one pound sign and the build shows another. Consequences:

- `A5` is **`BLOCKED-DESIGN`**, Class E. Which face the symbol takes is a ruling: the
  report says Inter, the token says SUSE, the frame's render matches neither cleanly.
- **No assertion ships for it.** The one written under the old conclusion asserted a
  single family across the `£` and the digits — the opposite of what the fix may require —
  so it is removed, along with the `homepage-sections` requirement it was derived from.
- No font is loaded and no class re-pointed. Group 5 does not run.

The lesson is narrower than "measurement beats prose" and worth stating: **a token
binding is not a rendering.** For a row about how a glyph looks, the evidence has to be
the glyph.

The frame's price is 32px against the build's 24px. Still a real delta, still not what
`A5` filed, still no QA-ID — recorded in `targets.md` and raised for triage.

## Risks / Trade-offs

- **Adding a third webfont for one glyph** → Only taken if step 2 of D3 corroborates it.
  If taken, load it with the same `next/font/google` `display: "swap"` treatment as the
  other two so it costs a swap, not a blocking request.
- **The scroll-width assertion is a broad net.** Any future overflow anywhere on `/`
  fails this test, possibly far from whoever caused it → Mitigated by the failure message
  naming the property and the expected/observed widths; a follow-up can add the offending
  selector to the message if it proves noisy.
- **`A5` may end up `BLOCKED-DESIGN`, so the page may not reach `Open 0`.** → Stated up
  front rather than discovered at the gate. `A6` and `A7` close regardless; the index
  would read `Open 0 · Blocked 4`. That is a legitimate outcome of the slice, not a
  failure of it.
- **`lg` may be the wrong stacking breakpoint at 768–1023.** The report only names 440 →
  Check the section at 768 during the manual sweep and record what was observed, so the
  choice is evidenced rather than assumed.
- **Moving the CTA in DOM order changes tab order at desktop** — it would follow the grid
  rather than precede it → Verify with a keyboard pass at 1920; if it reads wrong, the
  ordering approach in D2 changes, not the spec.

## Open Questions

- Does the mobile Basket link's missing item count (the unchecked 440 box in the
  Homepage manual sweep) warrant its own QA-ID? Deferrable — it is a separate row against
  the header, not any of the three in this slice, and answering it changes nothing here.
