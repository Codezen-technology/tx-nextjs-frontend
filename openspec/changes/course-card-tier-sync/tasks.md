## 1. Tab follows quantity

- [x] 1.1 In `src/components/courses/course-purchase-card.tsx`, move the full rule into `commitQuantity()`: after clamping and `setQty(next)`, set the tab to `"teams"` when `next > 1` and `"me"` otherwise. Replace the comment above it so it states the invariant in both directions.
- [x] 1.2 Replace the decrement button's inline `clampQuantity`/`setQty`/`setQtyText`/`if (next === 1) setTab("me")` block with `applyQuantity(qty - 1)`, so it uses the same funnel as the increment button.
- [x] 1.3 Confirm `selectTab("me")` still resets the quantity to 1 and that clicking "For teams" at quantity 1 is not immediately undone (tab clicks stay the buyer's choice; only quantity commits derive the tab).

## 2. Active tier row

- [x] 2.1 Add a required `quantity: number` prop to `BulkDiscountTable` (`src/components/courses/bulk-discount-table.tsx`) and document in the prop's comment that it drives the active row.
- [x] 2.2 Resolve the active tier with `resolveBulkTier(tiers, quantity)` from `@/lib/utils/bulk-tiers` — the same function the card uses for the header price — and mark a row active by identity (`tier === activeTier`), not by re-comparing `min`/`max`.
- [x] 2.3 Style the active row: raised background against the `bg-neutral-20` group, label in `text-neutral-900`, and a non-colour cue (semibold label plus a leading marker) so it survives greyscale.
- [x] 2.4 Add `aria-current="true"` to the active row and a visually hidden phrase naming it as the current tier; leave inactive rows with no `aria-current`.
- [x] 2.5 Pass `quantity={qty}` from `CoursePurchaseCard` at the existing `<BulkDiscountTable ... />` call site.

## 3. Tests

- [x] 3.1 In `src/__tests__/course-purchase-card.test.tsx`, add: typing `1` into the quantity field while on "For teams" selects "For me"; stepping down from 2 to 1 selects "For me"; clearing the field and blurring selects "For me".
- [x] 3.2 Add a test that raising the quantity above 1 from any control selects "For teams" (guards against 1.1 inverting the rule).
- [x] 3.3 Add a test that at quantity 21 against tiers 10–19/20–49/50–100 the "20 - 49 users" row is the only row with `aria-current`, and that quantity 1 leaves every row without it.
- [x] 3.4 Add a test with two overlapping tiers where the higher percentage wins, asserting the highlighted row is the tier that produced the header price.

## 4. Verify

- [x] 4.1 `pnpm typecheck` — confirms the new required prop has no other unpatched call site.
- [x] 4.2 `pnpm test` and `pnpm lint` clean.
- [x] 4.3 Check the card in the browser on a course page: step 1 → 2 → 1 and type values directly, confirming the tab and the highlighted row track the quantity and the highlighted row's per-person price matches the header total divided by the quantity.
