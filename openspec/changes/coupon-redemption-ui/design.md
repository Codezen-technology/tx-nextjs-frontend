## Context

See proposal.md — Why. Constraints that shape the approach:

- The browser cannot call the CMS directly for writes: the WP host answers unrecognised callers with a bot-protection challenge carrying no CORS headers. Form writes already go through `src/app/api/forms/[id]/[action]/route.ts`, whose `ACTIONS` map is a deliberate two-entry allowlist rather than a namespace proxy.
- That route relays the upstream body **verbatim, status and all**, which is what lets `formsService` read `data.validation_messages` off a 422. The same property is what carries a coupon refusal's wording.
- Certificate pricing is already server-authoritative: `certificate-form.tsx` holds a selection, `useQuery` re-quotes on every change, and `/api/certificate/intent` re-prices server-side before creating the PaymentIntent. The browser's total is display only.
- The recorded order is rebuilt from PaymentIntent **metadata** (`cert_selection`), not from a later browser request — the webhook may fire when no browser is around.

## Goals / Non-Goals

**Goals:**

- One place that knows how to apply a code (`formsService.applyCoupon`), used by both the certificate form and the generic renderer.
- Codes travel with the selection, so anything that already re-quotes on a selection change re-quotes on a coupon change for free.
- The visitor reads Gravity Forms' own verdict, not our paraphrase of it.

**Non-Goals:**

- Any client-side notion of coupon validity, discount arithmetic, or expiry.
- Coupon support in the cart/WooCommerce checkout — that is a different coupon system (`cart-rules`), untouched here.
- Showing totals on non-payment forms.
- Persisting applied codes across reloads.

## Decisions

### Codes live inside `CertSelection`, not beside it

`coupons?: string[]` is added to the selection object rather than threaded as a separate argument.

The selection is already the cache key for the quote (`queryKeys.certificate.quote(product, selection)`), the body of `/api/certificate/quote`, and the payload of `createIntent`. Putting codes inside it means applying or removing one re-quotes, re-keys the cache, and re-prices the intent with no extra wiring — and makes it structurally hard to price with codes the payment does not know about.

**Alternative considered:** a separate `coupons` state passed independently to each call — three call sites to keep in sync, and the failure mode (quote discounted, intent not) is exactly the one that overcharges a buyer.

### `coupons` is added to the allowlist, not the route generalised

`ACTIONS` gains a third entry. The route stays an allowlist of named actions rather than becoming `/api/forms/[id]/[...path]`, because the current shape is what stops the browser reaching arbitrary plugin form endpoints through our origin.

### Apply errors are a typed error, matching `FormValidationError`

`applyCoupon` throws `CouponError` carrying the backend's `message` and the refused `code`. The service layer already turns a 422 into a typed error for submissions; a refusal is the same class of thing — an expected, displayable answer, not an exception to swallow.

### The intent route prices with codes **and** stores them

`/api/certificate/intent` passes `coupons` to its `fetchQuote` (so the PaymentIntent amount is discounted) and includes them in `cert_selection` metadata (so the record step re-prices the same way).

Both are required and for different reasons: without the first the buyer sees a discount and is charged full price; without the second the record step re-prices without the discount, the amount check fails, and a paid order is held for review. The backend's non-strict re-pricing (see the plugin change) only helps if the codes are actually in the metadata.

### Generic forms get the box, not the totals

In `<GravityForm>`, a `coupon` field renders as code box + Apply and the accepted codes are written into the form values under `input_{fieldId}` — the same name the schema already gives the field — so the existing payload builder submits them with no special-casing at submit time.

No totals are shown: a Tier A form has no server-priced total, and payment forms are blocked from this submit path anyway. Showing a discount with nothing to discount would be an invention.

### The coupon box is driven by the backend's advertisement

`config.coupon` on the certificate config and `hasCoupon`/`couponFieldId` on the form schema. Both are optional in the types, so an older plugin build (no coupon keys) renders nothing rather than erroring — the app and the plugin deploy independently.

## Risks / Trade-offs

- **Codes are sent again on every quote** → each re-quote re-checks eligibility server-side, so a code that expires mid-session turns the quote into a refusal. Handled as a displayed message rather than a silent full-price total; that is the intended failure direction.
- **The visitor may apply a code and abandon** → the redemption count only moves when an entry is saved, so an abandoned checkout consumes nothing. Conversely a limited code can be quoted more often than it can be redeemed; that is Gravity Forms' own behavior, not something this UI can fix.
- **A stale quote could price the intent** → avoided by keying the quote on the selection (codes included) and pricing the intent server-side from the same selection, so the browser's displayed total is never the charged amount.
- **Generic-form coupon UI has no price feedback** → a visitor sees "applied" with no visible effect. Accepted: the alternative is inventing a total the server did not produce.

## Migration Plan

Purely additive and backwards compatible in both directions: an older plugin advertises no coupon field and nothing renders; a newer plugin with this app's previous build simply never receives codes. No data migration, no config, no feature flag. Rollback is reverting the deploy.
