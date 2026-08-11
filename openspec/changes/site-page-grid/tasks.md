## 1. Consolidate — safe under any decision (design D2, D3)

Value stays 1400 throughout this section. Behaviour-preserving.

- [x] 1.1 Add a `--page-grid-max` custom property (and side-padding steps) to `@theme` in `globals.css`, set to today's values so nothing moves
- [x] 1.2 Point the `container` utility at the token instead of the literal `1400px`
- [x] 1.3 Replace `max-w-[1400px]` in `src/components/layout/header.tsx` with the token — already done by `3538797`; it uses `container`
- [x] 1.4 Replace `max-w-[1400px]` in `src/components/layout/minimal-header.tsx` — already done by `3538797`; it uses `container`
- [x] 1.5 Replace `max-w-[1400px]` in `src/components/layout/mega-menu.tsx` — now `container`
- [x] 1.6 Rewrite the `calc((100vw-1400px)/2+1rem)` bleed in `src/components/home/trusted-orgs.tsx` in terms of the token — new `grid-inset-start` utility, same ramp as `container`
- [x] 1.7 Grep for any remaining `1400` literal outside the token definition and confirm none remain
- [x] 1.8 Verify byte-identical rendering before and after: measure content width, side padding and header inner edges at 1920 / 1280 / 440 and confirm zero delta against the pre-change values

  Zero delta on the page column and the header at all four widths measured.
  **Two surfaces moved, both because they were already wrong** — that drift is
  what this change exists to remove, not a new visual decision:

  | Surface                       | 1920      | 1440    | 1280     | 440     |
  | ----------------------------- | --------- | ------- | -------- | ------- |
  | page content edge (unchanged) | 292       | 52      | 128      | 24      |
  | header inner edge (unchanged) | 292       | 52      | 128      | 24      |
  | mega menu inner               | 260 → 292 | 20 → 52 | 0 → 128  | n/a     |
  | trusted-orgs bleed            | 276 → 292 | 16 → 52 | 16 → 128 | 16 → 24 |

  The bleed used `+1rem` against a container padding of `2rem`, and applied only
  above `2xl` (1536) — so it was out at every width. The mega menu carried its
  own `max-w-[1400px] px-4 lg:px-0`.

- [ ] 1.9 Commit. This ships regardless of how the width decision lands

## 2. Grid check, green against current values (design D4)

- [x] 2.1 Record the current grid values as targets, each citing whether it comes from the design or from the status quo pending decision — `TARGETS` in `e2e/page-grid.spec.ts`; every row carries a `source`. 1280 and 440 cite design nodes, 1920 is marked STATUS QUO with the 40px/20px gap stated
- [x] 2.2 Add an E2E grid check asserting content width and side padding against the recorded target at 1920 / 1280 / 440 — `e2e/page-grid.spec.ts`
- [x] 2.3 Extend it to assert the header's inner content edges align with the page content column at each breakpoint — exact match, not toleranced
- [x] 2.4 Extend it to the minimal header and the mega menu, which each carried their own copy
- [x] 2.5 Assert the `trusted-orgs` bleed aligns its non-bleeding edge to the grid — start edge only; the end edge bleeds by design
- [x] 2.6 Failure messages must name the surface, the breakpoint, expected, observed and the delta — plus the target's source on the target assertions
- [x] 2.7 Mutation-test: move one surface's width and confirm the check fails naming that surface, then revert

  Two mutations, both reverted:
  1. `max-w-[1200px]` added to the mega menu → _only_ the mega menu test failed:
     `mega menu left edge @1920: expected 292 (the page column), observed 392, delta 100`.
  2. `--page-grid-max: 1400px → 1296px` → the page-column target test failed
     naming the delta and the source, **and the header, mega menu and
     trusted-orgs tests all still passed** — i.e. every surface moved with the
     token off one edit. That is the `page-grid` spec's "The grid value changes"
     scenario, demonstrated rather than asserted.

  Mutation 2 also sized §4: `--page-grid-max: 1296px` yields a _1232_ content
  column, because the token is the outer width and `--page-grid-pad-max` is
  32px each side. To land the design's 1296/312 at 1920 the token wants
  **1360px** with the 32px cap padding kept — see 4.1/4.2.

- [x] 2.8 Confirm green at all three breakpoints, then commit — 14 passed, 1 skipped (mega menu at 440: the mobile nav replaces the trigger). Stable across repeat runs after the opener stopped swallowing its timeout

## 3. The decision

- [ ] 3.1 Present the evidence for a decision: design 1296, code 1368, live WordPress 1366/1300/1216/1200, and the provenance of 1400 (a scaffolding commit, not a design ruling)
- [ ] 3.2 Render a real page at 1920 at both widths and compare — the decision should be made against a rendered page, not a number
- [ ] 3.3 Record the outcome and its rationale, including the case where the outcome is "keep the current width" (design D5)

## 4. Apply the decision — BLOCKED until §3 (design D1)

- [ ] 4.1 Change the token to the decided value
- [ ] 4.2 Extend the side-padding ramp so 1920 matches its target, closing the 20px gap left by the padding-ramp change
- [ ] 4.3 Update the recorded targets, citing the design node or the written decision as appropriate
- [ ] 4.4 Re-run the grid check and confirm green at all three breakpoints
- [ ] 4.5 Sweep the pages the QA report covers at 1920 and 1280 and confirm nothing became cramped or overflowed — particularly the blog card grids, which are sized per breakpoint
- [ ] 4.6 Commit separately from §1 and §2 so the visual diff can be reviewed alone

## 5. Close-out

- [ ] 5.1 Update `.context/figma/node-resolution.md` — replace the recorded discrepancy with the decision
- [ ] 5.2 Update `.context/figma/targets.md` with the resolved 1920 row
- [ ] 5.3 Update `QA_REPORT_PROGRESS.md` if the outcome closes any Class A item
- [ ] 5.4 Full gate: `pnpm typecheck && pnpm lint && pnpm test` plus E2E, compared against the known pre-existing baseline
- [ ] 5.5 PR description stating the decision, its rationale, and that every public page reflows
