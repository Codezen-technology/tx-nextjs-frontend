## 1. Record the measurements

- [x] 1.1 Append a "Pricing page" section to `.context/figma/targets.md`: the three-frame node, desktop 312/1296 with 80 gaps, mobile 24/392 with 40 gaps, and the hero band 320 with its 112/112 inset
- [x] 1.2 Record the `A2` heading table — eleven headings, all 32px — and the weight-500 outlier on the shared team CTA, which is not a Pricing row
- [x] 1.3 Record the `A3` evidence: one button across the frame's content sections against several in the build, and why that does not name one

## 2. Write the tests first

- [x] 2.1 Create `e2e/pricing.spec.ts`
- [x] 2.2 `A1` — assert the hero's content inset is 112px top and bottom at 1920
- [x] 2.3 `A5` — assert the categories heading starts at the page pad at 440 (24px) and matches the FAQ heading's x at 1920
- [x] 2.4 `A2` — assert no section heading is larger than any other (the `h1` excepted)
- [x] 2.5 `A4` — assert 40px between section boundaries at 440
- [x] 2.6 Got the split, after correcting two of my own assertions first: `A5` compared against the FAQ heading, which sits in a `max-w-4xl` centred wrapper and is not the page column; and the `A1` inset measured the band's direct children, both of which span the full band (the absolute overlay and the padded container), so it read 0 whatever the padding was. Fixed to measure the copy

## 3. Apply

- [x] 3.1 `A1` — `py-16` → `py-[112px]` on the hero's inner container in `pricing-hero.tsx`
- [x] 3.2 `A5` — remove the `container mx-auto` wrapper around `CategoriesGrid` in `pricing/page.tsx`, keeping the section's `py-section` rhythm
- [x] 3.3 Checked: the homepage is the only other `CategoriesGrid` caller and renders it bare

## 4. Verify

- [x] 4.1 Re-run `e2e/pricing.spec.ts` at `chromium`, `desktop-1920`, `mobile-440`
- [x] 4.2 Mutation-check the `A1` assertion: restore `py-16`, confirm the failure names expected and observed, revert
- [x] 4.3 Restarted, then a full run: **7 failed** — the six baseline plus `QA-COURSE-A5`, which failed one run in three. Not flake to shrug at: its message named `rgb(225, 210, 186)` (secondary-100, the hover colour) as the _resting_ value, so the resting read was landing mid-transition after the pointer moved away. Fixed with a `settled()` read; four consecutive runs green
- [x] 4.4 `pnpm typecheck && pnpm lint && pnpm test`

## 5. Flip statuses and commit

- [x] 5.1 `A1` and `A5` → `FIXED` with test references; `A1`'s note records that the wave and pattern are Class D alongside `QA-BLOG-D2` and `QA-COURSES-D2`
- [x] 5.2 `A2` and `A4` → `CANT-REPRODUCE` with their measurements
- [x] 5.3 `A3` — keep `STILL-BROKEN`, attach the frame evidence
- [x] 5.4 Recompute the Pricing index row (`Open` 6 → 2) and its `Ready` value
- [x] 5.5 Clear `A2`, `A4` and `A5` from Appendix B
- [x] 5.6 `pnpm test` — doc checker green
- [x] 5.7 Commit as `fix(qa-pricing): close four of six rows`
