# Checkout Review

Senior review of the checkout process + page. Path reviewed end-to-end:

```
checkout/page.tsx
  → PaymentMethodSelector.tsx
    → useWcStoreCheckout()  (useCheckout.ts)
      → checkoutService.wcStoreCheckout  (services/checkout.ts)
        → cartFetch  (api/bff-client.ts)
          → BFF /api/cart/checkout  (app/api/cart/checkout/route.ts)
            → proxyToWCStore  (api/bff.ts)
  + BillingForm.tsx
  + CheckoutOrderSummary.tsx
  + order-confirmation/[orderId]/page.tsx  (session bootstrap)
```

Findings ranked worst-first. #1 and #2 are money-path bugs.

> **Status: all 6 fixed.** `tsc` clean, lint 0 errors, 48 cart+checkout tests green.
> See per-finding ✅ notes below.

---

## 🔴 1. Double-submit → duplicate orders / double charge

**File:** `src/components/checkout/PaymentMethodSelector.tsx:120`

`handleSubmit` `await`s `billingRef.current.trigger()` **before** `setIsSubmitting(true)`. The
submit button's `disabled` only reacts to `isSubmitting`, so during the `trigger()` await the
button stays enabled.

**Failure scenario:** user double-clicks "Proceed to Checkout". Both clicks enter `handleSubmit`,
both clear the `await trigger()`, both call `setIsSubmitting(true)`, both run
`createPaymentMethod` + the checkout POST → **two orders created, possible double charge**.

**Fix:** synchronous re-entrancy guard at function entry (ref, not state — state updates are async):

```ts
const submitting = useRef(false);

const handleSubmit = async () => {
  if (submitting.current || !billingRef.current) return;
  submitting.current = true;
  setIsSubmitting(true);
  try {
    if (!(await billingRef.current.trigger())) return;
    setStripeError(null);
    if (isFreeOrder) await handleFreeCheckout();
    else await handleStoreApiCheckout();
  } catch (err) {
    setStripeError((err as Error).message ?? "Something went wrong.");
  } finally {
    submitting.current = false;
    setIsSubmitting(false);
  }
};
```

---

## 🔴 2. `cartFetch` embedded-cart recovery corrupts checkout errors

**File:** `src/lib/api/bff-client.ts:126-135`

On a WC Store API error, `cartFetch` returns `data.data.cart` **instead of throwing**. That
recovery is correct for cart _mutations_ (sync client to real server state). But
`checkoutService.wcStoreCheckout` runs through the **same** `cartFetch`.

**Failure scenario:** checkout POST fails with an embedded cart (item went out of stock between
add and checkout, coupon invalid, etc — WC embeds the cart in the error body). `wcStoreCheckout`
resolves with a **cart object** typed as `WCStoreCheckoutResponse`. Then in
`PaymentMethodSelector` (`:45` free path / `:111` card path):

```ts
result.payment_result.payment_status; // payment_result is undefined → TypeError
```

→ `TypeError: Cannot read properties of undefined (reading 'payment_status')`. The real WC error
message (e.g. "X is out of stock") is masked; the user sees a cryptic JS error and the order is
silently not placed.

**Fix:** scope the embedded-cart recovery to cart routes only. Either skip it for `/checkout`, or
add an opt-out used by the checkout call:

```ts
export async function cartFetch<T>(
  path: string,
  init?: RequestInit,
  opts: { recoverEmbeddedCart?: boolean } = {},
): Promise<T> {
  const recoverEmbeddedCart = opts.recoverEmbeddedCart ?? true;
  ...
  if (!res.ok) {
    const embedded = (data as { data?: { cart?: unknown } }).data?.cart;
    if (recoverEmbeddedCart && embedded) {
      if (data.code === "woocommerce_rest_cart_invalid_key") clearCartToken();
      return embedded as T;
    }
    // throw ApiError with the real WC message ...
  }
}
```

Then `wcStoreCheckout` passes `{ recoverEmbeddedCart: false }` so genuine WC checkout errors
surface with their message.

---

## 🟠 3. Free-order flash on a paid cart

**File:** `src/components/checkout/PaymentMethodSelector.tsx:29-30`

```ts
const orderTotal = totals?.total ?? 0;
const isFreeOrder = orderTotal <= 0;
```

Before the cart query resolves, `totals` is undefined → `orderTotal` 0 → **`isFreeOrder` true**.
The UI renders "No payment required — your order total is £0.00" + a "Complete Order" button, and
the submit button is enabled (the `!stripe` guard is bypassed when `isFreeOrder`, see `:233`).

**Failure scenario:** logged-in customer with prefilled billing lands on checkout, clicks quickly
before the cart loads → `handleFreeCheckout` fires against a _paid_ cart with `payment_method: ""`
→ risks an unpaid pending order (relies solely on WC's server-side `needs_payment` guard to
reject).

**Fix:** gate on `cartLoading` — treat an unresolved total as not-free and disable submit until the
cart resolves:

```ts
const { totals, isLoading: cartLoading } = useCart();
const isFreeOrder = !cartLoading && (totals?.total ?? 0) <= 0;
// disabled={isSubmitting || cartLoading || (!isFreeOrder && !stripe)}
```

---

## 🟠 4. Fallback billing form can't collect an address

**File:** `src/components/checkout/BillingForm.tsx:26-77`

`FALLBACK_FIELDS` contains only `first_name`, `last_name`, `country`, `email`, `phone` — **no
`address_1`, `city`, or `postcode`**.

**Failure scenario:** `useCheckoutFields()` errors → fallback fields used → user cannot enter an
address → `createPaymentMethod` sends `address.line1 / postal_code = undefined` and the WC order
billing is incomplete (fails AVS / invoicing / tax rules that need a postcode).

**Fix:** add `address_1`, `city`, `postcode` (required) to `FALLBACK_FIELDS`.

---

## 🟡 5. Order summary hardcodes the `£` symbol

**Files:** `src/components/checkout/CheckoutOrderSummary.tsx:26,46`; free-order copy at
`src/components/checkout/PaymentMethodSelector.tsx:149`

Both hardcode `£` and ignore `currency` from `useCart()` (the cart page respects it). Wrong symbol
for any non-GBP store / currency switch.

**Fix:** pull `currency` from `useCart()` and interpolate it, matching `CartItemRow`.

---

## 🟡 6. Broken fallback string + free orders gated behind Stripe

**File:** `src/app/[locale]/(shop)/checkout/page.tsx:120-128`

- Line 126 copy is malformed: `"Payment is not configured. is missing."` (leftover template).
- The **entire** `PaymentMethodSelector` is rendered only inside `stripePromise ? <Elements>`, so
  when Stripe is unconfigured **even £0 free orders cannot be completed**.

**Fix:** correct the copy; if free checkout should always work, render the free-order path outside
the Stripe gate.

---

## ✅ Verified correct (no action)

- **Cart-Token continuity** — persisted in `localStorage` (`bff-client.ts`) and forwarded by
  `proxyToWCStore`, so the checkout POST hits the same WC cart the GET populated.
- **Deferred-intent SCA** — `requires_action` is finished client-side via `handleNextAction`; no
  second checkout POST (would duplicate the order).
- **Guest auto-login** — `bootstrapCheckoutSession` runs on the order-confirmation page and mints a
  JWT session for new accounts.
- **Empty-cart redirect** — gates on query truth (`cart.item_count`), not the stale store badge,
  and is skipped once `orderPlaced`.

---

## Fixes applied

| #   | Fix                                                                                                                 | Files                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | `submitting` ref guard set before any await; `setIsSubmitting(true)` moved ahead of `trigger()`                     | `PaymentMethodSelector.tsx`                             |
| 2   | `cartFetch` gains `recoverEmbeddedCart` opt (default true); `wcStoreCheckout` + `payOrderViaStore` pass `false`     | `bff-client.ts`, `services/checkout.ts`                 |
| 3   | `isFreeOrder` gated on `!cartLoading`; submit `disabled` on `cartLoading`                                           | `PaymentMethodSelector.tsx`                             |
| 4   | `address_1` / `city` / `postcode` added to `FALLBACK_FIELDS`                                                        | `BillingForm.tsx`                                       |
| 5   | `currency` from `useCart()` replaces hardcoded `£` (summary + free-order copy)                                      | `CheckoutOrderSummary.tsx`, `PaymentMethodSelector.tsx` |
| 6   | Fixed copy; `<Elements stripe={null}>` always mounts so free orders work; paid-order config warning inside selector | `checkout/page.tsx`, `PaymentMethodSelector.tsx`        |

**Verified:** `tsc --noEmit` clean · lint 0 errors · `cart.hooks` + `cart.store` (25) + `checkout` + `cart.service` (23) all green.
