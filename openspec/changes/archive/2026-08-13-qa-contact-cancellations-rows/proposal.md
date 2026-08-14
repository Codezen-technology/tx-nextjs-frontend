## Why

`QA-CONTACT-A2` and `QA-CANCEL-A2` are the **last two open Class A rows in the report**.
Everything else still open is Class D (`QA-COURSES-D1`, `QA-CHECK-D1`, `QA-PRICE-D1`) —
proposals that need their own changes — or Class E, blocked on design. Closing these two
takes the page index to zero shippable Class A work.

Both were filed late, by the same correction that produced the Homepage remainder rows:
the runbook's slice 6 named `QA-CONTACT-A1` and `QA-CANCEL-A1`, and commit `cf5da74`
found neither traces to the source report. Both are now `RECLASSIFIED`. The real filed
issues are the `A2` pair, and they have never been worked.

One of them turns out not to be a page fix at all, which is the substance of this change.

## What Changes

- **`QA-CANCEL-A2`** — "the Button text label is not visible at all". White on
  `secondary-500` #9E6F21 measures **4.421:1**, just under WCAG AA's 4.5 for normal text
  (figure independently recomputed, matches the row). The row is currently unworked
  because "the fix is a token decision, not a page edit" — `bg-secondary-500` appears in
  **41 files**. Two candidate fixes are compared in `design.md`; the leading one needs no
  new colour, because `secondary-600` #90651E — already the hover state on these very
  buttons — measures **5.165:1** and clears AA today.
- **`QA-CONTACT-A2`** — "the section colors are not according to the design". The build
  paints its one section white; frame `3277:44993` binds five named tokens. **Proposed
  reclassification `MANUAL-VISUAL` → `GAP`:** five named tokens from a frame is a
  measurement, not a judgement, and rule D4 of the QA doc's own design reserves
  `MANUAL-VISUAL` for judgement. Reclassifying makes the row testable and removes the
  last excuse for it sitting open.
- Assertions in `e2e/design-fidelity.spec.ts`, written failing first, mutation-checked.
  The contrast one is computed from rendered colours, not read back from a class name.
- `docs/qa/QA_BY_PAGE.md`: both rows flipped with evidence; Contact's `Auto` changes
  `MANUAL-VISUAL` → its test; page index Contact and Cancellations go `RED` → `GREEN` /
  `AMBER`; Appendix B updated.

Explicitly **not** in scope: changing the brand token `--color-secondary-500` itself. It
is measured from Figma node `83:4218` and recorded in `globals.css:619`; moving it is a
design ruling, and `design.md` treats that as the rejected option.

## Capabilities

### New Capabilities

- `interactive-contrast`: the contrast floor every text-on-brand-colour control must
  meet, and where that obligation is enforced. `QA-CANCEL-A2` is one instance of a
  site-wide rule; capturing it per page would leave the other 40 files unguarded and let
  the same defect reappear next to the one being fixed.

### Modified Capabilities

None. Contact and Cancellations have no existing capability spec, and `page-grid` /
`design-token-fidelity` govern geometry and provenance rather than section fills — the
Contact row is asserted against `design-token-fidelity`'s existing rules without changing
them.

## Impact

- `src/components/ui/button.tsx` or the affected call sites — whichever `design.md`'s
  decision selects for the AA fix
- `src/app/[locale]/(marketing)/contact-us/page.tsx` — section fills against the frame
- `e2e/design-fidelity.spec.ts` — new assertions
- `docs/qa/QA_BY_PAGE.md` — two status flips, one `Auto` reclassification, page index,
  Appendix B
- `.context/figma/targets.md` — the Contact section fills, per token, with `3277:44993`
  as source

Risk: the AA fix changes a resting brand colour wherever white text sits on
`secondary-500`. That is a visible change on ~41 files' worth of surfaces, and it is the
reason this row has gone unworked rather than a reason to keep deferring it — the current
state fails AA on every one of them.
