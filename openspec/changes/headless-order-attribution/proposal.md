## Why

Every order placed through the headless frontend records its traffic source as
`Unknown` in WooCommerce's Origin column, and as the literal `REST API` in the
PixelYourSite metabox. Both systems capture visit data with a script enqueued on
WordPress-rendered pages, which no shopper ever loads, and orders then reach
WooCommerce server-to-server with no referrer, no query string and no cookies.
Marketing spend cannot currently be tied to revenue on any headless order.

## What Changes

- The Next.js proxy captures UTM parameters, paid click identifiers and the
  referrer on every page navigation, classifies the traffic source, and persists
  first-touch and session state in two httpOnly first-party cookies.
- All three order-creating BFF routes read that state off the incoming request
  and attach WooCommerce Order Attribution data to the order, in-band, in the
  same request that places the order.
  - `POST /api/orders` (Buy Now) sends 17 prefixed `_wc_order_attribution_*`
    entries as WC REST v3 `meta_data`.
  - `POST /api/cart/checkout` and `POST /api/orders/[id]/store-pay` send 16
    unprefixed fields through WooCommerce's own Store API extension namespace
    `woocommerce/order-attribution`.
- Attribution is best-effort throughout. A missing, corrupt or unwritable value
  never fails an order or a payment.
- Optionally, eight `pys_*` query-string parameters populate the PixelYourSite
  metabox with no PHP and no plugin change.

Not breaking. No existing route changes its request or response shape, and no
client, service or hook is modified.

## Capabilities

### New Capabilities

- `order-attribution`: How a visit's traffic source is captured on the frontend,
  carried to WooCommerce with the order that visit produced, and rendered in the
  WooCommerce admin. Covers the classification rules, the cookie contract, the
  two WooCommerce write shapes, the severable third-party plugin copy, and the
  best-effort guarantee.

### Modified Capabilities

None. No existing spec's requirements change.

## Impact

**Code**

- New: `src/lib/analytics/attribution.ts`, `attribution-cookies.ts`,
  `order-attribution.ts`, and optionally `pixelyoursite.ts`.
- Modified: `src/proxy.ts`, `src/app/api/orders/route.ts`,
  `src/app/api/cart/checkout/route.ts`,
  `src/app/api/orders/[id]/store-pay/route.ts`.
- Optionally modified: `src/lib/api/wc-orders.ts` (`createWCOrder` gains an
  optional query string).

**External systems**

- Depends on WooCommerce's `order_attribution` feature toggle being enabled
  (WooCommerce, Settings, Advanced, Features). If it is off, no meta is stored,
  the Store API extension is not registered, and the Origin column does not
  exist. This must be confirmed on the live store before implementation.
- No new environment variables, dependencies, or paid services.

**Privacy**

- Two new first-party httpOnly cookies, 180 days and 30 minutes. No third-party
  cookie, no data leaves the origin, and nothing user-controlled from a request
  body reaches order meta.

**Prior art in this repo**

- Plan: `docs/superpowers/plans/2026-09-09-order-attribution.md`
- Spec: `docs/ORDER_ATTRIBUTION.md`
- Primary-source research: `docs/research/2026-09-09-woocommerce-order-attribution.md`
