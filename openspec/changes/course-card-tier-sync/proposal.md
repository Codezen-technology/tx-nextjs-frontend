## Why

The course purchase card's quantity stepper drives two things the buyer reads to decide
what to pay — the active tab and the bulk-discount table — and both drift out of sync
with it.

Raising the quantity above one switches to "For teams", but lowering it back to one only
returns to "For me" when the minus button is the control that got you there: typing `1`
into the field leaves the card claiming a team purchase of a single licence. And the
tier table lists five price bands with no indication of which one the current quantity
has actually bought, so at 21 licences the buyer sees `£512.83` in the header and has to
work out for themselves that the 25% "20 - 49 users" row is the one that produced it.

## What Changes

- Quantity `1` selects the "For me" tab from **every** control that can set it — the
  minus button, typing in the field, and blurring the field — not just the minus button.
- `BulkDiscountTable` takes the current quantity and marks the tier that applies to it
  as active, using the same `resolveBulkTier()` the header price already uses so the
  highlight and the price can never disagree.
- A quantity below the lowest tier's minimum highlights nothing — there is no discount
  to point at.
- The active row is distinguishable without relying on colour alone, and is announced to
  assistive tech rather than being a purely visual cue.

No pricing maths changes. Checkout still re-prices server-side; the table stays
indicative.

## Capabilities

### New Capabilities

None. This changes behaviour already owned by `single-course-page`.

### Modified Capabilities

- `single-course-page`: adds two requirements to the purchase card — the quantity/tab
  invariant now holds for every quantity control, and the bulk-discount table marks the
  tier matching the current quantity.

## Impact

- `src/components/courses/course-purchase-card.tsx` — `commitQuantity()` becomes the one
  place tab selection is derived from quantity; the minus button's duplicated
  `if (next === 1) setTab("me")` branch goes away.
- `src/components/courses/bulk-discount-table.tsx` — new required `quantity` prop;
  row rendering gains an active state.
- `src/lib/utils/bulk-tiers.ts` — unchanged; `resolveBulkTier()` is reused as-is.
- `src/__tests__/course-purchase-card.test.tsx` — extended for both behaviours.

No API, BFF, or backend contract is touched.
