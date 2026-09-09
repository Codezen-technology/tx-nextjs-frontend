## Context

Two Stripe elements can render wallet buttons, and the choice drives everything
else in this change.

The **Payment Request Button Element** is the older one. It renders exactly one
button — Apple Pay in Safari, Google Pay in Chrome, never both — and its
`paymentRequest` option cannot be swapped after mount, so a cart whose total
changes (a coupon, a quantity edit) has to be handled carefully. Stripe treats
it as legacy.

The **Express Checkout Element** renders every wallet the device supports, in a
layout we control, and takes its amount from the Elements instance, which
`@stripe/react-stripe-js` updates in place when the `options` prop changes.

The design for this feature shows Apple Pay and Google Pay stacked, so the
Express Checkout Element is the only one that can match it.

## Goals / Non-Goals

Goals:

- One wallet path that produces the same kind of order as a card payment, so
  fulfilment, emails, and the order confirmation page need no special case.
- WooCommerce stays the authority on the amount charged.
- Nothing renders unless a wallet is actually available on the device.

Non-Goals:

- Shipping address collection or shipping rate selection. Everything sold here
  is digital or fulfilled outside the cart, so the element requests billing only.
- A second PaymentIntent-creating endpoint in this app.

## Decisions

### Deferred intent, manual PaymentMethod creation

Elements is created with `{mode: "payment", amount, currency,
paymentMethodCreation: "manual"}`. On confirm we call `elements.submit()`, then
`stripe.createPaymentMethod({elements})`, and hand the resulting `pm_…` to the
WC Store API.

The alternative — create a PaymentIntent up front and pass its `clientSecret` to
Elements — was in the first cut of this feature as `/api/cart/payment-intent`.
It was never called, and it created a second place where an order's amount is
decided, plus an unauthenticated endpoint that would create a PaymentIntent for
anyone who posted to it. It is removed.

### The wallet's address is the buyer's address

`billingAddressRequired` and `emailRequired` are on, and
`walletBillingAddress()` maps what comes back onto the WC address shape. Wallets
return one `name` string; WC wants `first_name`/`last_name`, so the first token
becomes the forename and the rest the surname. A single-token name yields an
empty surname, which is what WC itself does with the same input.

Country falls back to `GB` only when the wallet returns none.

### Currency is an ISO code, not a symbol

`useCart().currency` is `decodeEntities(totals.currency_symbol)` — "£". Passing
that to Stripe throws an `IntegrationError` inside the effect that creates the
element, which surfaces as no buttons at all rather than as an error anyone
would see. `Cart` now carries `currency_code` from the WC Store API alongside
the symbol, and the two are documented at the type so the next caller does not
repeat it.

### The element mounts before we know whether to show it

`onReady` reports which wallets are available, and it only fires once mounted.
So the element is always mounted when the cart has a payable total and hidden
with a class until `onReady` confirms a wallet exists. Returning `null` first
would mean `onReady` never fires.

Elements also cannot be created with a zero amount, so the whole subtree stays
unmounted while the cart is loading or empty.

### Cart clearing belongs to the page

`ExpressCheckout` reports success and nothing else. The cart page empties the
cart and navigates. Having both do it sent two DELETEs for one order.

## Risks / Trade-offs

- **Apple Pay is invisible until the domain is registered.** There is no error
  and no console warning; the button simply does not render. Mitigated only by
  documenting it as a release task.
- **The wallet sheet stays open for the whole WooCommerce round-trip.** The
  Express Checkout Element dismisses it when the `onConfirm` handler settles, so
  a slow checkout is visible to the buyer as a spinner. Reordering is not
  possible without giving up WooCommerce as the intent authority.
- **`layout.maxColumns: 1`** means three or more available wallets would stack
  tall. Only two are enabled, so this is bounded.
