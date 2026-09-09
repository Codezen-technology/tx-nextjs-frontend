## Context

See `proposal.md` for motivation and `specs/order-attribution/spec.md` for the
behaviour contract.

Two constraints shape everything below.

**The frontend creates orders three ways.** `POST /api/cart/checkout` and
`POST /api/orders/[id]/store-pay` proxy to the WooCommerce Store API;
`POST /api/orders` proxies to WC REST v3. The two APIs accept custom data
through entirely different mechanisms.

**The BFF is same-origin with the pages.** Every `/api/*` call from the browser
already carries this site's cookies. That single fact removes most of the design
space, as decision 2 explains.

Every claim about WooCommerce and PixelYourSite internals below is pinned to a
source file and code excerpt in
`docs/research/2026-09-09-woocommerce-order-attribution.md`. The task-level plan
with test code is `docs/superpowers/plans/2026-09-09-order-attribution.md`.

## Goals / Non-Goals

**Goals:**

- Capture attribution at the only point where browser context still exists.
- Reuse WooCommerce's existing storage and reporting rather than building any.
- Keep the write in-band with order creation, so nothing can fail after payment.
- Zero client bundle cost and zero changes to client, service or hook code.

**Non-Goals:**

- Conversion events to Meta, Google or TikTok. Separate change; reuses this
  cookie layer.
- Consent UI. These are first-party cookies serving order record-keeping, but
  whether a banner is required is a decision this change does not make.
- Restoring the PixelYourSite metabox. Included as an optional final task only,
  and severable.

## Decisions

### 1. Capture in the proxy, not in client JavaScript

The proxy already runs on every non-API page request on the Node runtime. It
parses the query string and `Referer`, then writes the result as `Set-Cookie` on
whatever response the existing routing logic produced, including redirects and
rewrites.

**Alternative considered: a client-side effect writing `document.cookie`.**
Rejected on four counts. It runs after hydration, so a fast checkout can outrun
it. It does nothing with JavaScript disabled or blocked. Safari caps the lifetime
of script-written cookies to seven days, which would silently truncate the
180-day first-touch window. And it adds bundle weight for something the server
already knows.

### 2. Attribution travels in an httpOnly cookie, never in a request body

The route handlers read the raw `Cookie` header off the incoming `Request`. No
client code changes, no payload field, no service or hook signature changes.

This is primarily a security decision. Attribution lands in a customer's order
record and feeds revenue reporting. A body field would be spoofable input into
both. An httpOnly cookie the server itself wrote is not client-controlled, so
there is no validation surface to get wrong.

**Alternative considered: an `attribution` object on the order payload.** That
was the initial design. Rejected once it was clear the same-origin cookie
arrives for free and carries a strictly better trust story.

### 3. Two write shapes, because WooCommerce has two

WooCommerce ships its own Store API extension for this data, namespace
`woocommerce/order-attribution`, declared on the `checkout` schema and inherited
by `checkout-order`. Both Store API routes therefore carry attribution natively.

| Path                              | Mechanism              | Shape                                              |
| --------------------------------- | ---------------------- | -------------------------------------------------- |
| `POST /api/orders`                | WC REST v3 `meta_data` | 17 `_wc_order_attribution_*` keys, empties dropped |
| `POST /api/cart/checkout`         | Store API `extensions` | 16 unprefixed fields, all present, all strings     |
| `POST /api/orders/[id]/store-pay` | Store API `extensions` | as above                                           |

The shapes differ for a real reason, not an oversight. `device_type` is not a
schema field on the Store API; WooCommerce derives it from `user_agent` itself.
On the REST v3 path nothing derives it, so it must be written explicitly.

Two rules the Store API payload must obey. Every one of the sixteen fields must
be present, because WooCommerce indexes the array with no null-coalesce and an
omitted key raises a PHP warning; absent values use the literal `"(none)"`, which
WooCommerce's own reader skips. And every value must be a string, including the
two counters.

**Alternative considered: a deferred WC REST v3 `PUT` after the Store API
response.** This was the design before the source research. Rejected because the
native extension exists, and because a write that lands after payment can fail
after the shopper has already been charged.

### 4. WooCommerce's own meta, not PixelYourSite's

WooCommerce Order Attribution has shipped since 8.5. Its storage, its Origin
column and its Analytics reports already exist and need no PHP; only the input
was missing. PixelYourSite publishes no hook for supplying its equivalent data,
and its documented pattern for REST-created orders is to suppress its own
server-side events for them.

The optional PixelYourSite task exploits an implementation detail: the plugin
reads every field from `$_REQUEST` before its cookie fallback, so query-string
parameters populate it. That is not a supported interface and a plugin update can
break it, which is why it is last, optional, and severable.

### 5. Best-effort throughout

Attribution is bookkeeping. Every failure path swallows and continues: a missing
cookie means the order is created exactly as before, a corrupt cookie starts a
fresh session, and a rejected extension leaves a paid order intact.

## Risks / Trade-offs

- **The `order_attribution` feature toggle is off on the live store** → Nothing
  works and the Origin column is not even registered. Confirmed as the first step
  of the first WooCommerce-facing task, before any code depends on it.
- **A plugin filters `wc_order_attribution_tracking_fields` or the field prefix**
  → Stored keys would not match what the admin reads. Checked in the same step.
- **Store API extension payload malformed** → PHP warnings and no attribution.
  Mitigated by sending all sixteen fields as strings, asserted directly in tests.
- **Proxy runs on prefetches as well as real navigations** → Session page counts
  read slightly high. Accepted; the count is a soft signal, and suppressing
  prefetches would cost more than the inaccuracy.
- **Search-engine and referrer classification is a heuristic** → An unrecognised
  engine is recorded as a referral rather than organic. Accepted; the list is a
  single constant and cheap to extend.
- **PixelYourSite task depends on unsupported behaviour** → It breaks silently on
  a plugin update. Isolated to its own task, with nothing else depending on it.
- **Cookies where a consent regime may apply** → First-party, httpOnly, no data
  leaves the origin, serving order record-keeping. Flagged for a separate legal
  decision rather than resolved here.

## Migration Plan

No data migration and no backfill. Orders already placed cannot be attributed;
their context no longer exists anywhere.

Deployment is a normal release. The first request after deploy starts writing
cookies, and the first order placed by a visitor who has been issued one carries
attribution. Orders in flight at deploy time simply carry none, which is the
current behaviour.

Rollback is a revert. The cookies become inert and are dropped by expiry; nothing
reads them, and no WooCommerce data written before the revert is invalidated.

## Open Questions

- Whether PixelYourSite's `pys_*` and `last_pys_*` prefixes map to its FIRST
  VISIT and LAST VISIT blocks in that order. Answered by one throwaway order in
  the optional task's first step, and it cannot change the specs, the approach or
  any other task.
