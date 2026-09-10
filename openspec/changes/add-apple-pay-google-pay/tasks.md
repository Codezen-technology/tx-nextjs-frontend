## 1. Cart currency

- [x] 1.1 Add `currency_code` to `CartTotals` in `src/lib/stores/cart.store.ts`,
      populated from the WC Store API's `totals.currency_code`, falling back to
      `GBP`. Document at the type that `currency` is a display symbol and must
      never be passed to a payment API (spec: "Currency symbol is never used as
      a currency").
- [x] 1.2 Expose `currencyCode` from `useCart()`.
- [x] 1.3 Update the `Cart` fixture in `src/__tests__/cart.hooks.test.tsx`.

## 2. Wallet billing mapping

- [x] 2.1 Add `walletBillingAddress()` and `WalletBillingDetails` to
      `src/lib/services/checkout.ts` — wallet details to the WC Store API
      address shape, splitting the wallet's single name, omitting absent
      optional fields, and falling back to `GB` only when the wallet gives no
      country (spec: "The wallet's billing details reach WooCommerce").

## 3. Express Checkout Element

- [x] 3.1 Rewrite `src/components/cart/ExpressCheckout.tsx` around
      `ExpressCheckoutElement` in deferred-intent mode: Elements created with
      `mode: "payment"`, the cart amount, the ISO currency, and
      `paymentMethodCreation: "manual"`.
- [x] 3.2 Return `null` while the cart is loading or the total is zero, so
      Elements is never created with a zero amount (spec: "Empty or
      still-loading cart").
- [x] 3.3 Keep the element mounted but hidden until `onReady` reports available
      payment methods — `onReady` cannot fire on an unmounted element (spec:
      "Device with no wallet").
- [x] 3.4 In `onConfirm`: `elements.submit()`, then
      `stripe.createPaymentMethod({elements})`, then `wcStoreCheckout` with
      `stripeCardPaymentData(pm.id)` and the mapped billing address.
- [x] 3.5 Handle `requires_action` via `findClientSecret` +
      `stripe.handleNextAction` (spec: "Card requires 3-D Secure").
- [x] 3.6 On any failure call `event.paymentFailed({reason: "fail", message})`
      and show the message under the buttons (spec: "Payment declined").
- [x] 3.7 Guard re-entry with a ref so a second confirm is ignored while one is
      in flight (spec: "Double submission").
- [x] 3.8 Stack one wallet per row, disable Link/PayPal/Klarna/Amazon Pay, and
      take the sheet's business name from `useSiteSettings()` rather than
      hardcoding it.

## 4. Mount and success path

- [x] 4.1 Move the `<Elements>` provider out of the cart page and into
      `ExpressCheckout`, so the provider is created only when there is an amount
      to create it with.
- [x] 4.2 Leave cart clearing and navigation to the cart page's
      `handleExpressSuccess`; `ExpressCheckout` only reports success (spec:
      "Successful purchase").

## 5. Remove the unused intent endpoint

- [x] 5.1 Delete `src/app/api/cart/payment-intent/route.ts`. It had no callers,
      and it would create a PaymentIntent for any unauthenticated caller (spec:
      "No client-driven intent creation").

## 6. Payment method marks

- [x] 6.1 Revert the Apple Pay and Google Pay entries added to `CARD_BRANDS`.
      That list is the card-brand row, rendered inside the "Credit/Debit card"
      option of the payment selector and pinned to a four-mark Figma frame by
      `card-brand-marks.test.tsx`; the wallets have their own buttons and do not
      belong there. The two unused SVGs are removed with it.

## 7. Tests

- [x] 7.1 Add `src/__tests__/express-checkout-wallet.test.ts` covering the
      address mapping (full address, multi-token surname, single-token name,
      missing address, omitted optionals, undefined input), the `payment_data`
      contract, and the symbol/ISO-code split.
- [x] 7.2 Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` clean.

## 8. Release prerequisites (outside this repo)

- [ ] 8.1 Register the production domain on the Stripe account — Dashboard →
      Settings → Payment method domains, or `POST /v1/payment_method_domains`.
- [ ] 8.2 Serve the association file Stripe issues at
      `/.well-known/apple-developer-merchantid-domain-association`, then
      validate the domain in Stripe. Until 8.1 and 8.2 are both done the element
      renders Google Pay only, silently.
- [ ] 8.3 Confirm Apple Pay and Google Pay are enabled as payment methods on the
      Stripe account, and that the WooCommerce Stripe gateway accepts a wallet
      PaymentMethod on the live site.
- [ ] 8.4 Test a real wallet purchase end to end in Safari and in Chrome:
      buttons render, sheet shows the right total, order reaches confirmation
      with the wallet's address on it.
