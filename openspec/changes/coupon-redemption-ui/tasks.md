> Groups 1–6 are implemented in this repo (`pnpm test`, `pnpm typecheck` and `pnpm lint`
> all clean). Group 7 needs the app running against a backend that has the Coupons add-on
> and a card payment; the backend contract itself has now been verified live — see below.

## 1. Types and API surface

- [x] 1.1 Add `hasCoupon` / `couponFieldId` to `GravityForm`, plus `AppliedCoupon` and the apply-response shape, in `src/types/form.ts`
- [x] 1.2 Add `coupon` to `CertConfig`, `coupons` to `CertSelection`, and `coupons` / `discount` to `CertQuote` in `src/types/certificate.ts` — all optional, so an older plugin build still type-checks at runtime
- [x] 1.3 Add `forms.coupons(id)` to `src/lib/api/endpoints.ts`
- [x] 1.4 Allow the `coupons` action in `src/app/api/forms/[id]/[action]/route.ts` (extend `ACTIONS`, keep it an allowlist)

## 2. Apply service

- [x] 2.1 Add `formsService.applyCoupon(id, { code, applied, selection })` posting through the BFF route
- [x] 2.2 Add a `CouponError` carrying the backend's message and the refused code; map a 422 onto it the way `FormValidationError` maps validation failures, decoding the entities Gravity Forms escapes into its own text
- [x] 2.3 Leave unrelated errors as `ApiError` so a network failure is not reported as a refused coupon

## 3. Certificate ordering

- [x] 3.1 Carry `coupons` through `certificateService.getQuote` (already spreads the selection) and add it explicitly to `createIntent`'s payload
- [x] 3.2 Price the PaymentIntent with the codes in `src/app/api/certificate/intent/route.ts` (`fetchQuote`)
- [x] 3.3 Include the codes in the `cert_selection` PaymentIntent metadata, so the record step re-prices identically
- [x] 3.4 Surface a quote refused over a coupon (`lms_coupon_invalid`) as the backend's message rather than a generic pricing error

## 4. Certificate form UI

- [x] 4.1 Render the coupon box from `config.coupon`: input, Apply, applied-code list with per-code discount, Remove
- [x] 4.2 Apply through `formsService.applyCoupon(config.form_id, …)`, sending the already-applied codes so stacking is judged server-side
- [x] 4.3 Show the backend's refusal text inline; clear the input on acceptance
- [x] 4.4 Add a discount line above the total, driven by `quote.discount` / `quote.coupons`
- [x] 4.5 Keep codes in the selection so every quote, and the intent, re-price with them

## 4b. Reported from the live page (2026-09-18)

- [x] 4b.1 Type `isSelected` on `CertChoice` (served by the backend change `expose-gf-default-choice`)
- [x] 4b.2 Open each group on Gravity Forms' own default, falling back to the £0 opt-out, then to nothing for a required group
- [x] 4b.3 Disable the coupon input and Apply while a returned quote totals £0, with a line saying why; stay enabled while the total is still unknown
- [x] 4b.4 Test both: default pre-selection drives the first quote; Apply disabled at £0 and enabled above it
- [x] 4b.5 Verify on `tx-local-site`: page opens on "Both … £14.99" with Total Fee £14.99, `CERT10` applies (−£1.50 → £13.49), and switching to the £0 opt-out disables Apply

## 5. Generic Gravity Forms

- [x] 5.1 Render a `coupon` field in `<GravityForm>` as code box + Apply instead of a plain text input
- [x] 5.2 Write accepted codes into the form values under the field's own `input_{id}` name so the existing payload builder submits them
- [x] 5.3 Show no totals on these forms

## 6. Tests

- [x] 6.1 Unit-test `applyCoupon`: accepted code, 422 → `CouponError` with the backend's message, network error stays an `ApiError`
- [x] 6.2 Unit-test that the selection carries codes into the quote payload and into `createIntent`
- [x] 6.3 Unit-test the intent route: codes reach the upstream quote and appear in `cert_selection` metadata
- [x] 6.4 Component-test the certificate coupon box: no box without `config.coupon`, applied code listed, refusal text shown verbatim, discount line rendered
- [x] 6.5 Run `pnpm lint`, `pnpm typecheck` and the unit suite (1052 tests, 0 errors)

## 7. Verification (needs a backend with the Coupons add-on)

The backend half was exercised against `hst-local-site` (real Gravity Forms + Coupons install,
form 4 with coupon field 73) — the API answers this UI consumes are confirmed: `hasCoupon` /
`couponFieldId`, `config.coupon`, `422 lms_coupon_invalid` with the add-on's wording and
`data.code`, and a quote whose discounted total matches `GFCommon::get_order_total()` exactly
(£18.87 both ways). That run also found the entity-escaping defect fixed in 2.2: the live
add-on returns `can&#039;t`, so `CouponError` now decodes before display.

- [ ] 7.1 Apply a real code on `/certificate` against that backend and confirm the total drops by the amount the rendered WordPress form would show
- [ ] 7.2 Complete a discounted payment and confirm the Stripe charge equals the discounted total
- [ ] 7.3 Confirm the recorded Gravity Forms entry carries the code and the discounted total

## 8. Review follow-ups (2026-09-18)

- [x] 8.1 Read a failed quote as an `ApiError`: only a 422 refusal reaches the buyer in the backend's words (sanitized), every other failure gets one generic pricing line — `certificate-form.tsx`
- [x] 8.2 Retry transient quote failures once; a 4xx (a refusal) still never retries
- [x] 8.3 Render no payable total for a refused quote — "—" in place of "Total Fee £0.00", Pay disabled, `handlePay` reporting the refusal rather than "select at least one option" (`coupon-redemption-ui/spec.md:84`)
- [x] 8.4 Trust the server's `applied` list on the certificate form too, instead of appending locally
- [x] 8.5 Sanitize the non-`CouponError` branch of both Apply handlers so a PHP fatal cannot reach a buyer
- [x] 8.6 Extract the shared coupon widget (`components/forms/coupon-box.tsx`); the certificate form wraps it with prices, a plain Gravity Form with a bare code list
- [x] 8.7 Extract `CmsLink` (`components/ui/cms-link.tsx`) — the promo banner and the floating-bar CTA were the same internal/external link split twice
- [x] 8.8 Inline `safeBarHref` into `safeCmsHref`; type `AppliedCoupon.type` as `CouponType`; drop `@/types/certificate` from the generic forms service in favour of a local `CouponSelection`
- [x] 8.9 Keep `promoBanner` absent when the API omits it, rather than normalising it into `{ link: "" }`
- [x] 8.10 Test the gaps: code removed re-prices without it, an apply request failing is not blamed on the code, a refused quote shows no payable total, a 500 does not surface its own words, and the first quote carries the `isSelected` default (4b.4)
