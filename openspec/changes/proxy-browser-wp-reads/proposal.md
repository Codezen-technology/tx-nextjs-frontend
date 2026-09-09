## Why

The cart page is throwing four CORS errors in production and rendering without its bulk-discount table, its membership upsell banner, and its related/popular course rails.

The cause is not a WordPress CORS misconfiguration. The CMS origin sits behind SiteGround's Anti-Bot System, which answers unrecognised callers with a challenge interstitial instead of the REST response:

```
GET https://cms.trainingexcellence.org.uk/wp-json/lms-backend/v1/settings
→ HTTP 202, content-type: text/html
<meta http-equiv="refresh" content="0;/.well-known/sgcaptcha/?r=%2Fwp-json%2F…&y=ipc:…">
```

That interstitial carries no `Access-Control-Allow-Origin`, so any browser XHR from `trainingexcellence.org.uk` to `cms.trainingexcellence.org.uk` fails as a CORS error regardless of what the endpoint itself would have returned. Verified against `bulk-discount-tiers`, `membership-upsell`, `courses/popular`, `courses/{id}/related` — and against `/settings`, which is not currently broken in the browser. **Every** path behind that origin is challengeable.

This is the third time we have paid for the same root cause. `GET /api/courses/[id]/curriculum` (commit `23b5833`) moved one public read behind the BFF for exactly this reason, and `AGENTS.md` already records it as "one exception, and it is growing". It is not an exception; it is the rule for every browser read. Twenty-four direct-to-WordPress calls across ten services in `src/lib/services/` are still cross-origin, and each one is a future incident that surfaces as a blank section on a live page rather than as a build failure.

Fixing the four broken endpoints one route at a time repeats the work and leaves the other twenty vulnerable. This change closes the class.

## What Changes

- **New catch-all read proxy `GET /api/wp/[...path]`.** A single same-origin Route Handler that forwards a namespaced WordPress REST read to the CMS server-side, so the browser never makes a cross-origin request and the anti-bot challenge is never in the CORS path.
- **The browser axios client points at it.** `src/lib/api/client.ts` uses `/api/wp` as `baseURL` in the browser and keeps the direct `WP_REST_BASE` on the server. Every existing service and hook is fixed without touching a single `api.get()` call site. Server Components that use the same axios singleton (for example the marketing `[slug]` page via `pages.ts`) continue to call the CMS directly.
- **The proxy is read-only and namespace-allowlisted.** `GET` only, and only the three namespaces the browser client actually uses: `lms-backend/v1`, `wp/v2`, `swca/v1`. It is not a general egress proxy — WooCommerce Store/REST traffic keeps its existing dedicated BFF routes with their Cart-Token and Basic-auth handling.
- **`proxyToWP()` forwards pagination headers.** It currently drops `x-wp-total` and `x-wp-totalpages`, which `paginate()` reads to compute totals. `proxyToWCRest()` already forwards them; `proxyToWP` gains the same behaviour. Without this, `popular` and `related` would report wrong totals the moment they move behind the proxy.
- **`proxyToWP()` error bodies carry `message`.** It emits `{ error, code }` on a WordPress failure, but `toApiError()` reads `data.message`. Adding `message` alongside `error` keeps client-facing error text intact instead of degrading it to a generic axios string. Additive — nothing reading `error` breaks.
- **Signed-in reads stay correct.** The proxy passes `requiresAuth: false`, so signed-out visitors read public content while a signed-in user's httpOnly token is attached and refreshed. This is the curriculum route's semantics, generalised.
- **`GET /api/courses/[id]/curriculum` stays.** It is auth-aware, cache-tagged, and already shipped. The new proxy does not replace it.
- Not a breaking change. No public URL, no response shape, and no service signature changes. A deployment that does not set the rewrite still behaves exactly as today.

## Capabilities

### New Capabilities

- `browser-cms-read-proxy`: how a browser read of WordPress content reaches the CMS — that it is same-origin, which requests the proxy accepts and which it refuses, how it behaves for signed-out versus signed-in visitors, what it does with an expired token, and which response metadata (pagination, error text) must survive the hop intact.

### Modified Capabilities

<!-- None. `content-cache-revalidation` is adjacent — the proxy's cached reads are
     purgeable through the same tag registry — but no requirement of that spec
     changes: the endpoint's auth, its tag validation, and its unconfigured
     behaviour are all untouched. This change adds callers, not rules. -->

## Impact

**Frontend (this repo)**

- New route `src/app/api/wp/[...path]/route.ts` — `GET` only, namespace allowlist, query-string passthrough.
- `src/lib/api/client.ts` — browser `baseURL` becomes `/api/wp`; server keeps `WP_REST_BASE`. The existing `isBrowser` constant already exists in the file.
- `src/lib/api/bff.ts` — `proxyToWP()` forwards `x-wp-total` / `x-wp-totalpages`, and adds `message` to its error body.
- No changes to `src/lib/services/**`, `src/lib/hooks/**`, or any component. That is the point of the change.
- Unit tests: namespace allowlist accept/reject, method rejection, pagination-header passthrough, error-body shape, signed-out read succeeds, expired-token read falls back to the anonymous response.

**Routing interactions to respect**

- `src/proxy.ts` already excludes `/api` from its matcher, so next-intl will not touch the new path.
- The proxy sits under `src/app/api/`, which the browser reaches directly; no `next.config.mjs` rewrite is involved, so the filesystem route order is unambiguous and existing `/api/*` BFF routes keep precedence over nothing.

**Operational**

- Adds one server-side hop per browser read. These are public content reads, so the route caches them and the CDN absorbs the repeat traffic; a cold read costs one extra round trip inside the same datacentre.
- Egress to the CMS moves entirely to the deployment's server IPs. That is a smaller, stabler set for SiteGround to trust than the open internet, but it also concentrates risk: if that IP is ever challenged, every read fails at once rather than degrading per-visitor.

**Infrastructure (not solvable in this repo)**

- `/wp-json/*` should be excluded from the SiteGround Anti-Bot System, or the deployment's egress IPs allowlisted. This change makes the site work today; the exclusion is what stops it breaking again. It needs SiteGround Site Tools access and is tracked as a follow-up, not a blocker.

**Risk / accepted tradeoffs**

- A same-origin GET proxy is reachable by anything running on the frontend origin. It is bounded to three read namespaces and forwards no request body, so the worst case is that a caller reads public WordPress content it could already read. It grants no writes and no path to another host.
- A signed-in user's token is attached to proxied reads. For a public endpoint this only ever adds personalisation, and `proxyToWP` already falls back to the anonymous response when refresh fails — but it does mean a cached response must vary by auth state or not be cached at all. The design must pick one explicitly.
- Server-rendered reads are unchanged and still direct, so this fixes the browser class only. A challenge that starts hitting the deployment's own IP would break SSR and the proxy together, and no amount of proxying helps there.
