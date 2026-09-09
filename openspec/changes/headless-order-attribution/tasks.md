Test code and implementation code for every task below are written out in full
in `docs/superpowers/plans/2026-09-09-order-attribution.md`. Follow it rather
than re-deriving. Each numbered group ends in one commit.

Every group follows the same cycle: write the failing test, run it and watch it
fail, implement, run it and watch it pass, then `pnpm typecheck && pnpm lint`
before committing.

## 0. Prerequisites

- [x] 0.1 Run `pnpm install` if `node_modules` is absent, then confirm `pnpm typecheck` and `pnpm test` both pass on a clean tree
- [x] 0.2 Confirm **Order Attribution** is enabled in WP Admin under WooCommerce, Settings, Advanced, Features. If it is off, stop and raise it — no meta is stored, the Store API extension is not registered, and the Origin column does not exist
- [x] 0.3 Confirm no plugin rewrites the field schema: `wp eval 'var_dump( apply_filters( "wc_order_attribution_tracking_field_prefix", "wc_order_attribution_" ), has_filter( "wc_order_attribution_tracking_fields" ) );'` should print `wc_order_attribution_` and `false`
- [x] 0.4 Spot-check a pre-migration order that shows real attribution and record its meta keys, for comparison later

## 1. Attribution parsing library

- [x] 1.1 Write `src/__tests__/attribution.test.ts` covering campaign, click-identifier, organic, referral, direct and internal-navigation classification, device type, MySQL UTC formatting, and the session-state transitions
- [x] 1.2 Run `pnpm test attribution` and confirm it fails on the missing module
- [x] 1.3 Implement `src/lib/analytics/attribution.ts` as pure, framework-free functions
- [x] 1.4 Run `pnpm test attribution` and confirm 25 tests pass
- [x] 1.5 Commit `feat(analytics): add visit attribution parsing and session rules`

## 2. Attribution cookies

- [x] 2.1 Write `src/__tests__/attribution-cookies.test.ts` covering encode and decode round-tripping, corrupt-value recovery, reading a raw `Cookie` header, and cookie flags
- [x] 2.2 Run `pnpm test attribution-cookies` and confirm it fails
- [x] 2.3 Implement `src/lib/analytics/attribution-cookies.ts` with `tx_attr_first` at 180 days and `tx_attr_session` at 30 minutes, both httpOnly, `sameSite=lax`, and secure only over HTTPS
- [x] 2.4 Run `pnpm test attribution-cookies` and confirm 14 tests pass
- [x] 2.5 Commit `feat(analytics): persist visit attribution in httpOnly cookies`

## 3. Capture in the proxy

- [x] 3.1 Write `src/__tests__/proxy-attribution.test.ts` asserting cookies are set on a public page, on the protected-route login redirect, and on the default-locale rewrite, and that existing redirect behaviour is unchanged
- [x] 3.2 Run `pnpm test proxy-attribution` and confirm it fails
- [x] 3.3 Extract the existing routing body of `src/proxy.ts` into a private function and wrap it, so cookies attach to whichever response it produced
- [x] 3.4 Run `pnpm test proxy-attribution`, then `pnpm test` in full to confirm no regression
- [x] 3.5 Commit `feat(analytics): capture visit attribution in the proxy`

## 4. WooCommerce meta mapping

- [x] 4.1 Write `src/__tests__/order-attribution.test.ts` covering both builders: 17 prefixed keys with empties dropped, and 16 unprefixed string fields with `"(none)"` substitution and no `device_type`
- [x] 4.2 Run `pnpm test order-attribution` and confirm it fails
- [x] 4.3 Implement `src/lib/analytics/order-attribution.ts` with `buildOrderAttributionMeta` and `buildStoreApiAttributionExtension`, plus their request-reading wrappers
- [x] 4.4 Run `pnpm test order-attribution` and confirm 16 tests pass
- [x] 4.5 Commit `feat(analytics): map visit attribution onto WooCommerce order meta`

## 5. Buy Now order path

- [x] 5.1 Write `src/__tests__/order-attribution-routes.test.ts` asserting the attribution meta reaches the WC REST v3 create payload, and that a cookieless request creates the order unchanged
- [x] 5.2 Run `pnpm test order-attribution-routes` and confirm it fails
- [x] 5.3 Attach the meta in `src/app/api/orders/route.ts` before `createWCOrder`
- [x] 5.4 Run `pnpm test order-attribution-routes` and confirm 2 tests pass
- [x] 5.5 Commit `feat(orders): attribute Buy Now orders to their originating visit`

## 6. Store API order paths

- [x] 6.1 Write `src/__tests__/order-attribution-store-routes.test.ts` asserting the `woocommerce/order-attribution` extension is added to both request bodies, that all 16 fields are present, that a caller's own body fields and extensions are preserved, and that a cookieless request is untouched
- [x] 6.2 Run `pnpm test order-attribution-store-routes` and confirm it fails
- [x] 6.3 Add `withStoreApiAttribution` to `src/lib/analytics/order-attribution.ts` and wire it into `src/app/api/cart/checkout/route.ts` and `src/app/api/orders/[id]/store-pay/route.ts`
- [x] 6.4 Run `pnpm test order-attribution-store-routes`, then `pnpm test` in full
- [x] 6.5 Commit `feat(orders): send order attribution through the Store API checkout extension`

## 7. Documentation and end-to-end verification

- [x] 7.1 Add the order-attribution architecture note to `CLAUDE.md` and `AGENTS.md`
- [ ] 7.2 Place a cart order after arriving with `?utm_source=verify&utm_medium=email&utm_campaign=plantest` and confirm the Origin column reads exactly `Source: Verify`
- [ ] 7.3 Confirm the stored meta for that order, checking `session_entry` is the landing page rather than the checkout page
- [ ] 7.4 Repeat for an organic arrival, expecting `Organic: Google`, and a direct arrival, expecting `Direct`
- [ ] 7.5 Repeat using Buy Now rather than the cart, since that path uses a different WooCommerce API
- [x] 7.6 Record the verified order IDs and any surprises in `docs/ORDER_ATTRIBUTION.md`, then commit `docs: describe the headless order attribution layer`

**7.2 to 7.5 are blocked on a human.** Everything checkable through the API has been confirmed against `tx-local-site.test` and written up under "Verified against the store" in `docs/ORDER_ATTRIBUTION.md`: the feature toggle, the exact meta keys, REST v3 accepting underscore-prefixed meta, and the Store API extension namespace with its 16 fields on both `/checkout` and `/checkout/{id}`. What remains needs a browser and a Stripe test card, because both Store API order paths settle through Stripe.

## 8. PixelYourSite metabox (optional, severable)

Skip freely. Nothing else depends on it, and it relies on plugin behaviour that
is not a supported interface.

- [ ] 8.1 Confirm PixelYourSite is configured to store data on orders at all; if not, delete this group
- [ ] 8.2 Place one throwaway order with the `pys_*` parameters appended by hand and record which prefix lands in FIRST VISIT and which in LAST VISIT. If the box still reads `REST API`, delete this group
- [ ] 8.3 Write `src/__tests__/pixelyoursite-params.test.ts` covering the pipe-delimited UTM string, the `undefined` placeholder, and the empty-state return
- [ ] 8.4 Run it and confirm it fails, then implement `src/lib/analytics/pixelyoursite.ts`
- [ ] 8.5 Give `createWCOrder` an optional query string and append the parameters on both order-creating routes
- [ ] 8.6 Run `pnpm test pixelyoursite-params`, then `pnpm test` in full
- [ ] 8.7 Place a real order, confirm the metabox shows a landing page and traffic source rather than `REST API`, and commit `feat(analytics): populate the PixelYourSite order metabox from captured attribution`
