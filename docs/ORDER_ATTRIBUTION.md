# Order Attribution (headless) — Spec

## Problem

Every order placed through the Next.js frontend records its traffic source as
**"REST API"** in WooCommerce. The PixelYourSite metabox on the order edit
screen shows:

```
FIRST VISIT
  Landing Page:    REST API
  Traffic source:  REST API
  utm_source:      No utm_source detected for this order
  … (all five UTMs empty)
LAST VISIT
  … identical
```

### Why

Both PixelYourSite and WooCommerce's own Order Attribution capture visit data
with a **script enqueued on WordPress-rendered pages**. That script writes
first-party cookies, and a checkout hook copies those cookies onto the order.

Headless breaks both halves:

1. No visitor ever loads a WordPress page, so the capture script never runs and
   the cookies are never written.
2. Orders are created **server-to-server** from the BFF. `POST /api/orders`
   calls WC REST v3 `/orders`, and `POST /api/cart/checkout` calls the WC Store
   API. Neither request carries browser cookies, a referrer, or a query string.
   WooCommerce sees a REST context and stamps its literal fallback.

This is not a bug in either plugin. It is the expected result of moving the
storefront off WordPress.

## Goal

Restore per-order traffic attribution — landing page, traffic source, and all
UTM parameters — for orders placed through the headless frontend, using only
free tooling and without modifying the WordPress plugin.

## Non-goals

- Firing conversion events to Meta, Google, or TikTok. That is a **separate,
  larger piece of work** with its own credentials, hashing rules, and
  deduplication contract. It depends on this spec's cookie layer but ships
  independently. See "Follow-up" below.
- Restoring the PixelYourSite metabox is not required, but it turns out to be
  nearly free. See "PixelYourSite (optional extra)" below. It is a stretch
  goal, not an acceptance criterion.
- Cookie-consent UI. Attribution cookies here are first-party and strictly
  necessary for order record-keeping, but a consent banner is a separate
  decision that this spec does not make.

## Approach

Capture in the Next.js proxy. Store on the order through WooCommerce's own
Order Attribution meta keys. No client JavaScript, no PHP.

```
Browser navigation
  ↓
src/proxy.ts                    parses UTMs + referrer, writes two httpOnly cookies
  ↓ (cookies ride along, same origin)
/api/orders  |  /api/cart/checkout  |  /api/orders/[id]/store-pay
  ↓ reads the cookie header off the incoming Request
buildOrderAttributionMeta()     maps to _wc_order_attribution_* keys
  ↓
WooCommerce order meta          Analytics reports and the order list column read this
```

### Why the proxy and not client JavaScript

- Runs before hydration, so a fast checkout cannot outrun it.
- Works with JavaScript disabled and is not blocked by content blockers.
- A `Set-Cookie` from a first-party server response is not subject to Safari's
  seven-day cap on cookies written by `document.cookie`.
- Zero client bundle cost.

### Why the cookie is httpOnly and never travels in a request body

BFF routes are same-origin, so the browser attaches the cookie to every
`/api/*` call automatically. The route reads it off the incoming `Request`.
Nothing user-controlled enters the order payload, so there is no validation
burden and no need to change the client, the services layer, or the hooks.

### Why WooCommerce Order Attribution meta and not PixelYourSite meta

WooCommerce has shipped Order Attribution since 8.5. The storage, the order
list column, and the Analytics reports already exist — only the input is
missing. It needs no PHP, and on the Store API paths WooCommerce even
registers its own extension namespace for exactly this purpose.

PixelYourSite is a secondary target rather than a competing one. It stores a
single meta key and reads every field from `$_REQUEST` first, so both systems
can be satisfied in the same request. See the optional section below.

## Cookies

| Name              | Lifetime                          | Holds                                                           |
| ----------------- | --------------------------------- | --------------------------------------------------------------- |
| `tx_attr_first`   | 180 days                          | first-touch attribution plus a lifetime session counter         |
| `tx_attr_session` | 30 minutes, refreshed on activity | current-session attribution, entry page, start time, page count |

Both are `httpOnly`, `secure`, `sameSite=lax`, path `/`. Values are
base64url-encoded JSON.

A new session starts when `tx_attr_session` is absent (expired) or when the
incoming request carries a different campaign from the one already recorded.
That mirrors Sourcebuster, the library WooCommerce itself uses.

## Source classification

Applied in order, first match wins:

| Condition                             | `source_type` | `utm_source`  | `utm_medium` |
| ------------------------------------- | ------------- | ------------- | ------------ |
| any `utm_*` present                   | `utm`         | as given      | as given     |
| `gclid` present                       | `utm`         | `google`      | `cpc`        |
| `fbclid` present                      | `utm`         | `facebook`    | `cpc`        |
| `msclkid` present                     | `utm`         | `bing`        | `cpc`        |
| referrer host is a search engine      | `organic`     | engine name   | `organic`    |
| referrer host is external             | `referral`    | referrer host | `referral`   |
| no referrer, or referrer is this site | `typein`      | `(direct)`    | `(none)`     |

## WooCommerce meta keys

Verified against WooCommerce source. See
`docs/research/2026-09-09-woocommerce-order-attribution.md` for the file paths
and code excerpts behind every claim in this section.

Prefix `_wc_order_attribution_`. Written from the **session** (last touch),
except `session_count`, which comes from the first-touch cookie.

```
source_type  referrer  utm_source  utm_medium  utm_campaign  utm_content
utm_term  utm_id  utm_source_platform  utm_creative_format
utm_marketing_tactic  session_entry  session_start_time  session_pages
session_count  user_agent  device_type
```

Sixteen of those come from WooCommerce's own `$default_fields` array.
`device_type` is a seventeenth, derived server-side from `user_agent` and
therefore **absent from the Store API extension schema**. The two write paths
must differ: seventeen keys for WC REST v3 `meta_data`, sixteen for the Store
API extension.

`device_type` is one of `Desktop`, `Mobile`, `Tablet`, exact casing.
`session_start_time` is a MySQL UTC datetime, `YYYY-MM-DD HH:MM:SS`.
`origin` is **never stored**. The Origin column derives it at render time from
`source_type` and `utm_source` alone.

The key names no longer need confirming against the live store. Two other
things do, because they would silently disable everything:

1. The `order_attribution` feature toggle in WooCommerce, Settings, Advanced,
   Features. If it is off, neither the meta nor the Store API extension does
   anything and the Origin column is not even registered.
2. Whether any installed plugin filters `wc_order_attribution_tracking_fields`
   or `wc_order_attribution_tracking_field_prefix`.

## Order paths that must be covered

The frontend creates orders three different ways. All three need the meta.

| Path                  | Route                             | Mechanism                                     |
| --------------------- | --------------------------------- | --------------------------------------------- |
| Cart checkout         | `POST /api/cart/checkout`         | WC Store API creates and pays in one call     |
| Buy Now               | `POST /api/orders`                | WC REST v3 creates pending, `/pay` settles it |
| Pay an existing order | `POST /api/orders/[id]/store-pay` | B2B licences and retry-pay                    |

All three carry attribution **in-band**, in the same request that places the
order. No follow-up write, so nothing can fail after the shopper has paid.

The REST v3 path carries `meta_data` in the create payload, with all seventeen
prefixed keys.

The two Store API paths carry `extensions`. WooCommerce registers its own
attribution extension under the namespace `woocommerce/order-attribution` on
the `checkout` schema, and `checkout-order` inherits it, so both paths accept
it. The payload is the sixteen **unprefixed** field names, every one present,
every value a string:

```jsonc
{
  "billing_address": {},
  "payment_method": "stripe",
  "extensions": {
    "woocommerce/order-attribution": {
      "source_type": "organic",
      "utm_source": "google",
      "utm_medium": "organic",
      "utm_campaign": "(none)",
      "session_pages": "4",
      // …all 16, none omitted
    },
  },
}
```

Two rules that are easy to get wrong:

- **Send all sixteen.** WooCommerce indexes the array with no null-coalesce, so
  an omitted field raises a PHP undefined-key warning. Use the literal
  `"(none)"` for absent values; WooCommerce explicitly skips that sentinel.
- **Strings only.** `session_pages` and `session_count` must be cast, not sent
  as numbers.

On the Buy Now path the REST v3 create writes the meta first, and WooCommerce's
`has_attribution()` check then makes the later Store API extension a no-op for
that order. Sending it anyway is harmless and is the right defensive default.

## Acceptance criteria

The Origin column is built from `source_type` and `utm_source` only, and every
label is passed through PHP's `ucfirst`. The expected strings are therefore
exact, and the campaign does **not** appear in that column. It appears in the
edit-order metabox and in Analytics.

1. A visit to `/?utm_source=newsletter&utm_medium=email&utm_campaign=spring`
   followed by a purchase produces an order whose Origin column reads exactly
   `Source: Newsletter`, with `utm_campaign` = `spring` in the order meta.
2. A visit arriving from a Google search result produces `source_type=organic`,
   `utm_source=google`, and an Origin column reading exactly `Organic: Google`.
3. A direct visit produces `source_type=typein` and an Origin column reading
   exactly `Direct`. WooCommerce discards `utm_source` entirely for this source
   type, so the stored `(direct)` never surfaces.
4. All three order paths above write the meta.
5. `session_entry` holds the first page of the session, not the checkout page.
6. Missing or corrupt cookies never fail an order. Attribution is best-effort;
   a purchase always completes.

## PixelYourSite (optional extra)

Not required, and cheap enough to be worth mentioning. PixelYourSite stores all
of its attribution in a **single** order meta key, `pys_enrich_data`, with no
leading underscore. Every field inside it is read through a helper that prefers
`$_REQUEST` over the cookie and session fallback.

The literal `REST API` in the metabox comes from a deliberate sentinel: when the
cookie and session are empty **and** `REST_REQUEST` is defined, the plugin
substitutes that string. Exactly the server-to-server case.

So appending eight **query-string** parameters to the order-creating call
populates the metabox with no PHP and no plugin change:

```
pys_landing  pys_source  pys_utm  pys_utm_id
last_pys_landing  last_pys_source  last_pys_utm  last_pys_utm_id
```

`pys_utm` is a pipe-delimited string:
`utm_source:x|utm_medium:y|utm_campaign:z|utm_term:…|utm_content:…`, using the
literal `undefined` for unknown values.

Query string, not JSON body. PHP builds `$_REQUEST` from `$_GET` and `$_POST`,
and a `Content-Type: application/json` body never reaches `$_POST`. WordPress
ignores REST parameters it has no schema for, so the extra query arguments are
harmless to WooCommerce.

This also survives a hazard on the Store API path, where PixelYourSite
overwrites `pys_enrich_data` unconditionally with no double-execution guard. It
rebuilds the value from `$_REQUEST`, so the query-string approach wins either
way. Writing `pys_enrich_data` directly as order meta would not.

## Verified against the store

Checked against `tx-local-site.test` on 2026-09-09, at the API level. Everything
in this section is confirmed, not assumed.

**The feature is enabled.** Order 129783, placed through the WordPress checkout,
carries the full attribution set. The 19 newer orders, all `created_via`
`store-api` from the headless frontend, carry none. That is the reported problem
reproduced exactly.

**Key names and prefix are exact.** That order stores `source_type`, `referrer`,
`utm_source`, `utm_medium`, `utm_content`, `session_entry`,
`session_start_time`, `session_pages`, `session_count`, `user_agent` and
`device_type`, all under `_wc_order_attribution_`. Empty fields are absent,
confirming WooCommerce drops them. `session_start_time` reads
`2026-06-24 08:49:15`, matching the documented format, and both counters are
stored as strings.

**WC REST v3 accepts underscore-prefixed meta.** A test order created through
`POST /wc/v3/orders` with 11 `_wc_order_attribution_*` entries persisted all 11
unchanged. The order was deleted afterwards.

**The Store API extension is registered.** `OPTIONS /wc/store/v1/checkout`
reports the namespace `woocommerce/order-attribution` with exactly 16 fields:

```
referrer, session_count, session_entry, session_pages, session_start_time,
source_type, user_agent, utm_campaign, utm_content, utm_creative_format,
utm_id, utm_marketing_tactic, utm_medium, utm_source, utm_source_platform,
utm_term
```

That list matches the `STORE_API_FIELDS` constant exactly, `device_type`
included in neither. `OPTIONS /wc/store/v1/checkout/{id}` reports the same
namespace and the same 16 fields, confirming `checkout-order` inherits it.

**PixelYourSite's storage matches the research.** Order 129783 holds a single
`pys_enrich_data` object with `pys_landing`, `pys_source`, `pys_utm`,
`pys_utm_id`, the four `last_pys_*` equivalents, and `pys_browser_time`.

### Still unverified

The Origin column's rendered strings, and the end-to-end browser flows. Both
Store API order paths settle through Stripe, so completing one needs a browser
and a test card rather than an API call. The label mapping is verified in
WooCommerce source but not yet seen in this admin.

## Follow-up (separate plan)

Server-side conversion events — Meta Conversions API and GA4 Measurement
Protocol dispatched from the payment-success route with `after()`, deduplicated
against browser pixels by a shared `event_id`. It reuses the cookie layer built
here and adds Meta's free `capi-param-builder-nodejs` for `_fbp` / `_fbc`
handling. Not in scope for this plan.
