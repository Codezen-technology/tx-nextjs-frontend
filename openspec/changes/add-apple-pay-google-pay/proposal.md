## Why

The cart page offers one way to pay: click through to the checkout form and type
a card number, a name, and a full billing address. On a phone that is the point
where carts get abandoned, and it is avoidable — the buyer already has a card in
Apple Pay or Google Pay, along with the name and address WooCommerce needs.

The account side is already in place: the site charges through an existing
Stripe account, and the WooCommerce Stripe gateway already accepts a
PaymentMethod id over the WC Store API, which is exactly what a wallet produces.
So the missing piece is a pair of buttons on the cart and the mapping behind
them.

## What Changes

- Render Stripe's **Express Checkout Element** in the cart summary, below
  "Proceed to Checkout", stacked one wallet per row to match the design.
- Drive it in deferred-intent mode: Elements is created with the cart's amount
  and currency, and no PaymentIntent is created client-side. WooCommerce still
  creates and confirms the intent, so it remains the source of truth for what is
  actually charged; the amount passed to Elements only decides what the wallet
  sheet displays.
- On confirm, create a PaymentMethod from the wallet and post it to the existing
  WC Store API checkout using the same `payment_data` contract as card payments,
  then handle `requires_action` (3DS) with `stripe.handleNextAction`.
- Map the wallet's billing details onto the WC address shape. The wallet sheet is
  the only place an express buyer supplies an address, so discarding it means WC
  receives blank required fields.
- Take the ISO currency code from the cart. `useCart().currency` is a display
  symbol ("£"); Stripe needs "gbp". The cart now exposes both.
- Stop sending `payment_method_types[]=card` when creating a PaymentIntent in
  `/api/orders`, so Stripe's dynamic payment methods apply.

Non-goals:

- No wallet buttons on the checkout page or on a product page. The cart is the
  one surface this change covers.
- No Link, PayPal, Klarna or Amazon Pay. Each needs its own WooCommerce gateway
  wiring before it could complete an order, so all four are explicitly disabled
  on the element rather than left to Stripe's defaults.
- No saved wallet cards. Nothing is vaulted; `save_payment_method` stays `no`.

## Capabilities

### New Capabilities

- `cart-express-checkout`: the wallet payment path from the cart page — when the
  buttons appear, what the buyer's wallet must supply, how the order is created,
  and what happens when the payment needs authentication or fails.

### Modified Capabilities

None. The card checkout path, its billing form, and the cart's own totals are
untouched.

## Impact

- **Code**: `src/components/cart/ExpressCheckout.tsx` (new), `CartSummary.tsx`
  (mount point), the cart page (success handler), `src/lib/services/checkout.ts`
  (wallet address mapping), `src/lib/stores/cart.store.ts` and
  `src/lib/hooks/useCart.ts` (ISO currency code), `src/app/api/orders/route.ts`.
- **Tests**: Vitest coverage for the address mapping, the `payment_data`
  contract, and the currency split.
- **Runtime dependencies**: none added. `@stripe/react-stripe-js` and
  `@stripe/stripe-js` are already installed.
- **Operational prerequisite, outside this repo**: Apple Pay will not appear in
  production until the site's domain is registered on the Stripe account
  (Dashboard → Settings → Payment method domains, or
  `POST /v1/payment_method_domains`) and the association file it issues is served
  from `/.well-known/apple-developer-merchantid-domain-association`. Until then
  the element renders Google Pay only, with no error — which is why this is
  called out rather than left to be discovered in production.
