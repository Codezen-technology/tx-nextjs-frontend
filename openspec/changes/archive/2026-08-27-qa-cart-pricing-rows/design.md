## Context

See `proposal.md — Why`.

**`QA-CART-A1`.** Frame `6239:113878` rendered at 3235px and its row enumerated field by field:

| Field            | Frame                                         | `CartItemRow`        |
| ---------------- | --------------------------------------------- | -------------------- |
| Thumbnail        | ✓                                             | ✓                    |
| Title, two lines | ✓                                             | ✓ (`line-clamp-2`)   |
| Unit price       | **`Price: £24.99`** — labelled, label in bold | `£24.99`, unlabelled |
| Quantity stepper | ✓                                             | ✓                    |
| Line total       | ✓                                             | ✓                    |
| Remove control   | ✓                                             | ✓                    |

One field differs. The frame's sample rows are not discounted, so it says nothing about the
strikethrough the build shows for sale items; that is kept.

**`QA-PRICE-A3`.** The frame's section order is hero → plans → accreditations → trusted → reviews →
pricing breakdown → **categories** → FAQ → team CTA → footer. Its categories section reads
`Explore courses by category` with the grid beneath and **nothing in the heading row to the right**,
running straight into the FAQ heading.

`categories-grid.tsx:59-66` renders a right-aligned `View all courses` link in exactly that heading
row.

## Goals / Non-Goals

**Goals:**

- Close both rows on frame evidence rather than on a ruling.
- Remove the Pricing CTA without touching the Homepage's, which is separately signed off.

**Non-Goals:**

- Changing the cart's discount presentation. The frame's rows carry no discount, so it specifies
  nothing there and the build's strikethrough stands.
- Deleting `CategoriesGrid`'s link. See Decision 2.

## Decisions

**1. Label the unit price, do not restructure the row.**
The report asks for the design's contents; only one is missing. Adding the label is the whole fix.

**2. Make the CTA opt-out, and assert both sides.**
`CategoriesGrid` renders on the Homepage and on Pricing. The Homepage's frame keeps the link —
`QA-HOME-A7` measured its position there at 1280 and 1920 and recorded the heading row as _"correct,
not in question"_. Deleting it from the shared component would close this row by breaking that one.
The flag defaults to showing the link, so the Homepage call site is untouched and only Pricing opts
out. The assertion checks **both** pages, because a one-sided test would let a later cleanup remove
the link everywhere and still pass.

**3. Record why the earlier read was inconclusive.**
This row was already examined once and left open: _"the frame's content sections carry exactly one
button … suggestive, not conclusive."_ The reason was a crop — the frame was read across the left
third, where a right-aligned link is off-frame. The correction matters more than the fix: a partial
crop produced a confident wrong conclusion, exactly as a mis-resolved locator did on `/blog`.

## Risks / Trade-offs

- **A flag is a small piece of configuration in a shared component** → the alternative is a second
  copy of the section, which is how the site ended up with two FAQ implementations.
- **The cart assertion needs a populated cart** → the checkout slice already built the
  `Cart-Token` bootstrap helper; it is reused rather than re-invented.

## Migration Plan

None — presentational. Rollback is reverting the commit.
