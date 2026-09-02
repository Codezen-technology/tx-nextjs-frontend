## Why

The QA report's Cart and Checkout pages were worked in round 1 and closed all but three
rows. Two were parked as blocked — `QA-CART-E1` ("the report offers two mobile layouts and
picks neither") and `QA-CHECK-D1` ("a section present in Figma, absent from the build") —
and `QA-CHECK-A5` shipped its assurance line but recorded a 120px-tall band under the pay
button as unread geometry.

All three are now answerable from the frames rather than from a design meeting:

- **`QA-CART-E1` is not ambiguous.** The report offered two options because the reporter was
  working from screenshots. The mobile frame (`6239:114085`) places the quantity stepper at
  x=0 and groups the price and the remove control at x=246 of a 344-wide row — right-aligned,
  the report's first option. The design already chose.
- **`QA-CHECK-D1` and the `image 24` band are the same finding seen twice.** Rendered,
  `image 24` is a bordered trust card: a lock, "Guaranteed **safe & secure** checkout", a
  Powered-by-Stripe badge, a rule, and a row of card marks. It sits under the pay button on
  Checkout and under the checkout button in the Cart summary at every width.
- A third gap surfaced while reading the frames: the Cart frame carries a **"Customers Also
  Purchased"** section (`6239:113955`) with three course cards. `RelatedCourses.tsx` exists in
  the codebase and is imported by nothing.

Cart and Checkout are the two pages where a missing trust signal costs money, so the
remaining rows are worth closing rather than carrying.

## What Changes

- **Cart mobile row layout** (`QA-CART-E1`) — below `sm`, the quantity stepper stays left and
  the line total and remove control group to the right edge of the row, per `6239:114085`.
  Resolves the report's open question with the frame instead of a product decision.
- **Cart "Customers Also Purchased"** — render the existing `RelatedCourses` component below
  the cart items; three cards at desktop and laptop, stacked at mobile.
- **Trust band under the pay control** (`QA-CHECK-D1`, and the `image 24` half of
  `QA-CHECK-A5`) — replace the current bare `SecurePaymentBadge` with the design's bordered
  card: lock glyph, "Guaranteed safe & secure checkout", Powered-by-Stripe badge, rule, card
  marks. Rendered on Checkout under the pay button and in the Cart summary under the checkout
  button.
- **Trusted strip on Cart and Checkout** — the 36px strip below the header that every Cart
  and Checkout frame carries and neither page renders. Reuses the existing
  `CourseTrustedStrip`.
- **Two conflicts recorded, not silently resolved** (see `design.md`): `image 24` draws seven
  card brands including JCB, Diners and UnionPay, while the payment-method row `6239:134680`
  carries four and `checkout-payment-presentation` already ratified those four. And the cart
  mobile frame hides the product thumbnail — a content decision, not a layout one, so the
  thumbnail stays.

Not in scope: the `image 22` badge above the Cart summary card (176×40, unnamed, contents
unreadable from geometry) is recorded in `design.md` and left for a design ruling.

## Capabilities

### New Capabilities

- `cart-page-sections`: what the Cart page shows besides its line items — the related-courses
  section, the trust band in the summary, and how a line item's controls sit at mobile widths.
- `purchase-trust-signals`: the trust treatments the Cart and Checkout pages carry — the
  header trusted strip and the safe-and-secure band beneath the primary purchase control.

### Modified Capabilities

- `checkout-payment-presentation`: the secure-payment assurance grows a second requirement —
  the band beneath the pay button — and the existing brand-mark requirement is amended to say
  the band reads from the same single brand list, so the seven-brand artwork cannot
  reintroduce a second opinion about what the gateway accepts.

## Impact

- `src/components/cart/CartItemRow.tsx` — mobile alignment of the controls row
- `src/app/[locale]/(shop)/cart/page.tsx` — related courses, trusted strip
- `src/components/cart/CartSummary.tsx` — trust band under the checkout button
- `src/components/cart/RelatedCourses.tsx` — currently dead code; wired up, and its data
  source verified
- `src/components/checkout/SecurePaymentBadge.tsx` — rebuilt as the framed band
- `src/app/[locale]/(shop)/checkout/page.tsx` — trusted strip
- `public/icons/payment/` — Stripe badge asset; no new brand marks (see the conflict above)
- Tests: `e2e/checkout.spec.ts`, `e2e/design-fidelity.spec.ts`, `src/__tests__/cart-item-row.test.tsx`
- Docs: `docs/qa/QA_BY_PAGE.md` rows `QA-CART-E1`, `QA-CHECK-D1`, `QA-CHECK-A5` move off BLOCKED/STILL-BROKEN
- No API, dependency or data-shape changes
