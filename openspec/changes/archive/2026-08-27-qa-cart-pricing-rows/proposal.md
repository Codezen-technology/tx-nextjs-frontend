## Why

The last two Class A rows on the board, both resolved by reading their frames:

**`QA-CART-A1`** — "the card will have all the contents available on the design card." Frame `6239:113878` was rendered at 3235px and its cart row enumerated against `CartItemRow`. Everything matches except one field: the frame labels the unit price **`Price: £24.99`**, the build renders a bare `£24.99`. That is the whole gap.

**`QA-PRICE-A3`** — "in this section, there won't be any Button in the marked area — remove the button." This row was left open because an earlier read found the frame's sections did not map one-to-one onto the build's, so no button could be named. Reading the frame's **categories section across its full width** settles it: the heading row is `Explore courses by category` with **nothing to its right**, and the grid runs straight into the FAQ heading. The build's `CategoriesGrid` renders a "View all courses" link in that heading row.

The button is therefore named, and the earlier read was inconclusive only because it had been cropped to the left third of the frame.

## What Changes

- **`QA-CART-A1`** — the cart row's unit price gains its `Price:` label, matching the frame.
- **`QA-PRICE-A3`** — `CategoriesGrid` takes a flag for its "View all courses" link, and the Pricing page renders it without one. **The link is not deleted**: `CategoriesGrid` is shared with the Homepage, whose frame keeps it — `QA-HOME-A7` measured its position there and recorded the heading row as correct. Removing it outright would break a page that is already signed off.
- Both rows get an assertion; the Pricing one asserts _both_ sides — absent on Pricing, present on the Homepage — so a later "simplification" cannot quietly delete it everywhere.

## Capabilities

### New Capabilities

- `cart-line-item`: what a cart row shows about the product it represents.

### Modified Capabilities

- `pricing-page-layout`: the categories section on this page carries no call-to-action link.

## Impact

- `src/components/cart/CartItemRow.tsx` — the unit-price label
- `src/components/home/categories-grid.tsx` — the CTA becomes optional
- `src/app/[locale]/(marketing)/pricing/page.tsx` — opts out
- `e2e/design-fidelity.spec.ts` — two assertions, the second covering both pages
- `docs/qa/QA_BY_PAGE.md` — two rows, page index

No API, data-shape or route change.
