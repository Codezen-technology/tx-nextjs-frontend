## Why

The certificate page renders a Gravity Form whose coupon field is inert: there is a code box in WordPress, but headlessly the visitor has nothing to type into — and if they did, nothing would happen. Every coupon a brand advertises for certificate orders is currently unredeemable, and the buyer is charged full price.

The plugin side is now in place (`POST /forms/{id}/coupons`, coupon codes accepted by `/certificate/{product}/quote`, codes recorded on the entry — see the backend change `gravity-forms-coupon-apply`). What is missing is the half that lives here: rendering the box, applying a code, and carrying the accepted codes through the quote and the PaymentIntent so the buyer is charged — and recorded — at the discounted price.

## What Changes

- Render a coupon box on the certificate order form when the backend advertises a coupon field (`config.coupon`), with Apply, a list of applied codes, and Remove.
- Apply codes through `POST /forms/{id}/coupons` and surface the backend's own refusal wording ("This coupon has expired.", "…can't be used in conjunction with other coupons…") rather than a generic failure.
- Pass accepted codes into `/certificate/{product}/quote`, and show the discount as its own line above the total so the buyer can see what the code did.
- Pass accepted codes into `POST /api/certificate/intent`, which must both price the PaymentIntent with them **and** carry them in the PaymentIntent metadata's selection — otherwise the recorded order silently reverts to full price.
- Render the coupon field on any other Gravity Form that has one (`<GravityForm>`): code box + Apply, accepted codes posted back as `input_{fieldId}` on submit. No totals there — a non-payment form has none.
- Type the new API surface: `hasCoupon` / `couponFieldId` on the form schema, `coupon` on the certificate config, `coupons[]` / `discount` on the quote, `coupons[]` on the selection.
- Disable Apply while the order totals £0 — a code applied to nothing can only be refused, and each attempt spends one of the visitor's rate-limited tries.
- Open each product group on Gravity Forms' own default choice (`isSelected`, newly served by the backend change `expose-gf-default-choice`) instead of the £0 opt-out, so the page shows the same pre-selection and the same opening total as the form WordPress renders.
- **BREAKING**: none. A form with no coupon field renders and submits exactly as before; a quote with no codes returns what it always did.

## Capabilities

### New Capabilities

- `coupon-redemption-ui`: redeeming a Gravity Forms coupon from the headless app — showing the box only where a code can actually be applied, reporting the backend's verdict verbatim, and carrying accepted codes through pricing, payment and recording so the charged amount matches the quoted one.
- `certificate-order-defaults`: which option the certificate order form opens on — Gravity Forms' own default, so the headless page and the WordPress-rendered form agree on both the selection and the opening total.

### Modified Capabilities

(none — `certificate-page-content` covers the page's editorial content, not its ordering behavior, and no existing spec states how the order form prices a selection)

## Impact

- Code: `src/components/certificate/certificate-form.tsx` (coupon box + discount line + codes into quote/intent + default pre-selection), `src/components/forms/gravity-form.tsx` (coupon field on generic forms), `src/lib/services/forms.ts` (`applyCoupon`), `src/lib/services/certificate.ts` (codes into quote + intent), `src/lib/api/endpoints.ts` (`forms.coupons`), `src/app/api/forms/[id]/[action]/route.ts` (allow the `coupons` action), `src/app/api/certificate/intent/route.ts` (price with codes, keep them in PI metadata), `src/types/form.ts`, `src/types/certificate.ts`.
- API: consumes new backend surface only; adds no new frontend route beyond one allowed proxy action.
- Dependencies: none added.
- Requires a plugin build that serves `POST /forms/{id}/coupons`. Against an older plugin the coupon field is simply not advertised, so nothing renders and behavior is unchanged.
