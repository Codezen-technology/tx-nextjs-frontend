## Context

See `proposal.md` — Why, for the incident and root cause. What matters for the design:

- `src/lib/api/client.ts` exports one axios singleton, `api`, with `baseURL: WP_REST_BASE` — the public CMS origin plus `/wp-json`. It is used from **both** browser and server: ten services under `src/lib/services/` call it, and some of those services are consumed by Server Components (`pages.ts` from the marketing `[slug]` page, `products.ts`, `bundles.ts`). Any change to `baseURL` must distinguish the two. The file already computes `isBrowser`.
- The endpoint strings in `src/lib/api/endpoints.ts` are namespace-prefixed (`/lms-backend/v1/…`, `/wp/v2/…`, `/swca/v1/…`) and are appended to `baseURL`. `proxyToWP()` takes the opposite shape: a namespace-less path, because it prepends `env.LMS_NAMESPACE` itself. `courseSubpath()` exists solely to serve that second shape, and its docblock says so.
- `proxyToWP()` already implements the hard parts of the hop: token attach, 401 refresh-and-retry, and the "refresh failed on a public route, so drop the credential and serve the anonymous response" fallback. It also unwraps the `{ success, data }` envelope, which the browser interceptor `unwrapLmsEnvelope` would otherwise do.
- Two gaps block reuse. `proxyToWP()` never forwards `x-wp-total` / `x-wp-totalpages`, which `paginate()` reads from `res.headers`; and it emits failures as `{ error, code }` while `toApiError()` reads only `data.message`, so BFF error text never reaches an Axios caller.
- `src/proxy.ts` excludes `/api` from its matcher, so next-intl will not rewrite or locale-prefix anything under it.
- The commerce namespaces (`wc/store/v1`, `wc/v3`) have dedicated proxies with Cart-Token and Basic-auth handling, and are out of scope. One loose end: `productService` in `products.ts` reads `wc/store/v1` through the axios singleton. It has no call sites at all, and its only live consumer imports `normalizeProduct` instead — but it is reachable code, so the allowlist must fail it loudly rather than forward it.

## Goals / Non-Goals

**Goals:**

- One change fixes all twenty-four client-side reads, not the four that happen to be broken today.
- No edits to `src/lib/services/**`, `src/lib/hooks/**` or components _for reads_. This held: every read still composes the same path. It did **not** hold for writes — `forms.ts` posts, and a GET-only read proxy cannot carry a POST, so its two write calls are repointed at a write route.
- Signed-in personalisation and signed-out access both keep working, with the same expired-token behaviour the curriculum route already ships.
- Server-rendered reads are byte-identical to today. This change must not alter SSR, ISR, or build-time fetching.

**Non-Goals:**

- Not a general egress proxy. It will not forward to arbitrary hosts, arbitrary namespaces, arbitrary paths within an allowed namespace, or non-read methods.
- Not a replacement for the dedicated BFF routes. Authenticated mutations, cart traffic, and `GET /api/courses/[id]/curriculum` are untouched.
- Not a cache-tag design. Per-path tag mapping for a catch-all is a larger problem; this change uses a time-bounded cache and leaves tag-driven purging to the existing tagged `serverFetch` paths.
- Does not fix the CMS bot protection. That is an infrastructure follow-up recorded in the proposal's Impact.

## Decisions

### Decision 1: A catch-all Route Handler, not a `next.config.mjs` rewrite

A config rewrite (`source: "/api/wp/:path*"`, `destination: "<cms>/wp-json/:path*"`) is about six lines and would also make the browser request same-origin. It was the leading candidate and is rejected for three reasons.

- **It cannot attach a credential.** Rewrites forward the request as-is; there is no hook to set `Authorization`. Every personalised read would silently become an anonymous read. `courses/popular` and `courses/{id}/related` are public today, but the browser client also carries reads that are not, and a mechanism that quietly drops personalisation is a bug generator.
- **It cannot strip cookies.** A rewrite forwards the incoming `Cookie` header, which means the httpOnly `access_token` set on the frontend domain is transmitted to the CMS host on every proxied read and lands in its access logs and WAF records. WordPress ignores a bearer token presented as a cookie, so this is not directly exploitable — but the repo's stated security model is that tokens are held server-side and presented deliberately, and a rewrite inverts that by leaking them incidentally.
- **It gives no control over caching or error shape.** A Route Handler can set an explicit revalidation window and normalise the error body; a rewrite passes through whatever the CMS emits, including the challenge interstitial.

The Route Handler costs one file and two small fixes to `proxyToWP()`, and it is the same pattern the curriculum route already established. Taking it means the codebase has one answer to "how does the browser read WordPress", not two.

### Decision 2: The proxy is namespace-first, so `proxyToWP()` is reused unchanged in shape

The route sits at `src/app/api/wp/[...path]/route.ts` and splits the caught path into a two-segment namespace and a remainder:

```
/api/wp/lms-backend/v1/courses/popular?per_page=3
        └── namespace ──┘└─ wpPath ──┘└── query ──┘
```

It then calls `proxyToWP(wpPath + query, { namespace, requiresAuth: false })`. This is why the split is two segments: `proxyToWP` already takes `namespace` as an option, and every WordPress REST namespace this client uses is `vendor/version`. No new proxy function, no duplicated refresh logic.

The allowlist is built from `REST_NAMESPACES`, exported by `endpoints.ts` — `lms-backend/v1`, `wp/v2`, `swca/v1`. `endpoints.ts` is the single source for URL strings, and a namespace written out a second time in the route is how the two drift apart; deriving it means a new namespace cannot be added to the registry without a test forcing somebody to classify it. Anything else is refused before a socket is opened. The commerce namespaces are excluded deliberately: they need Cart-Token and Basic auth that this route does not and should not implement, and routing them here would silently strip that.

Alternative considered: a single flat allowlist of full path prefixes (`/lms-backend/v1/courses`, …). Rejected — it needs updating every time an endpoint is added, which is precisely the maintenance tax this change exists to remove.

### Decision 3: `baseURL` switches on `isBrowser`, and services do not change

```ts
baseURL: isBrowser ? "/api/wp" : WP_REST_BASE || "/wp-json",
```

Because the endpoint strings already carry their namespace, `/api/wp` + `/lms-backend/v1/courses/popular` composes to exactly the path the route expects. This is the whole reason the namespace lives in the endpoint string rather than in `baseURL`, and it is why no service needs touching.

The server branch is unchanged, so Server Components using the axios singleton keep hitting the CMS directly — a relative `baseURL` would be meaningless to Node's fetch anyway.

Alternative considered: migrating the four broken services to `bffJson()` with hand-written routes, as `courses.curriculum()` does. Rejected — it is four files of near-identical code, it leaves twenty reads exposed, and it makes each service carry knowledge of its own transport.

### Decision 4: `proxyToWP()` gains header passthrough, and the error key is read rather than duplicated

Two gaps, both benefiting every existing caller.

- Forward `x-wp-total` and `x-wp-totalpages` onto the response. Without this, `paginate()` falls back to `items.length` and every proxied list read reports a wrong total the moment its upstream uses header pagination rather than an envelope. The logic is shared with `proxyToWCRest()` as `forwardPaginationHeaders()` rather than copied a second time.
- The BFF emits failures as `{ error, code }` while `toApiError()` read only `message`, so every BFF error reaching an Axios caller degraded to a generic string. The fix is on the reading side: `toApiError()` now falls back to a string `error` after `message`. Emitting both keys from the proxy was the first attempt and is worse — it makes the wire format carry a duplicate field forever to paper over a reader that could simply be taught the shape.

Alternative considered: normalising in the new route only. Rejected — the gaps are in the shared proxy, and every other BFF route has them too.

### Decision 5: Cache only successful, credential-free reads

The route runs on the Node runtime and is dynamic. A response is shareable only when both hold: the request carried no `access_token` cookie, and the upstream answered successfully. Shareable responses get `public, s-maxage=300, stale-while-revalidate=600`; everything else gets `private, no-store`. `Vary: Cookie` keys the two apart.

Status has to be in that condition, not just the cookie. A bot-protection challenge surfaces here as a 502 and an upstream wobble as a 5xx, and caching either publicly would serve one bad moment at the CMS to every visitor for the next five minutes — turning a transient upstream blip into a sustained outage. This is the single most dangerous thing a caching proxy can get wrong, so it is asserted by tests for the 502, 4xx and 5xx cases.

`stale-while-revalidate=600` extends past the 300s freshness window on purpose: it lets one visitor absorb the revalidation while everyone else is served the slightly stale copy, which is exactly the thundering-herd protection a public content read wants.

The consequence of the cookie rule is that signed-in visitors pay the full round trip on every read. Acceptable: signed-in traffic is a fraction of the total, and a vary-by-user cache is a correctness risk out of proportion to the saving. `Vary: Cookie` also caps the hit rate for everyone, since any per-visitor cookie splits the entry — the way to unlock real reuse is to keep session cookies off the read path, not to widen this rule.

### Decision 6: The namespace allowlist is enforced against dot segments, not trusted to the framework

`encodeURIComponent` leaves `.` and `..` untouched, and the upstream URL is assembled by string concatenation before `fetch` parses it — and URL parsing resolves dot segments. So `…/lms-backend/v1/../../wc/v3/orders` passes an allowlist check on `lms-backend/v1` and then addresses the WooCommerce namespace. Confirmed against the handler: it returned 200 with the traversal resolved.

Next strips dot segments during routing, so this is not reachable over HTTP today. That is not a reason to leave it: the allowlist is a security boundary, and a boundary that holds only because an undocumented framework behaviour happens to shield it is not a boundary. Empty, `.` and `..` segments are rejected where the decision is made.

### Decision 7: Browser writes get their own route, because the read proxy must stay GET-only

Gravity Forms validate and submit are the only browser-initiated writes that went straight to the CMS, and they are subject to the same challenge. Widening the read proxy to accept POST would trade a narrow, cacheable, body-less read surface for a general forwarder — so they get `POST /api/forms/[id]/[action]` instead, restricted to the two Gravity Forms actions.

That route relays the upstream body **verbatim** rather than reusing the enveloping proxies. A 422 carries per-field messages under `data.validation_messages`, and `formsService` reads them off the raw body; the enveloping path collapses a failure to `{ error, code }` and would turn "fix these three fields" into a generic error. Verbatim relay also means behaviour is identical to the direct call it replaces, which is the cheapest thing to be confident about. Multipart is passed through as `FormData` so file uploads keep their boundary.

## Risks / Trade-offs

**A same-origin GET proxy is callable by anything on the frontend origin** → Bounded to three read namespaces, `GET` only, no request body forwarded, and dot segments refused so an allowed namespace cannot be used as a springboard into a disallowed one. The worst case is reading public WordPress content that was already public. It grants no writes and cannot reach another host, because the destination origin comes from server config, never from the request.

**All CMS egress concentrates on the deployment's server IPs** → If SiteGround ever challenges that IP, every browser read fails simultaneously instead of degrading per-visitor. Strictly worse than today's failure mode in blast radius and strictly better in likelihood. It is why the infrastructure follow-up is the real fix and this is the mitigation.

**A caching proxy can amplify an upstream blip into an outage** → Only a `res.ok`, credential-free response is shareable; a 502 from a challenge page and any upstream 4xx/5xx are `no-store`. Tested for all three.

**One extra network hop per browser read** → Same-datacentre, and public reads are CDN-cacheable, so the steady state is a cache hit. `Vary: Cookie` caps that hit rate in practice.

**`productService` would 400 if it were ever revived client-side** → It reads `wc/store/v1` through the axios singleton and has no call sites. The failure is loud and explicit (`unsupported_namespace`), not silent, and the guard test documents `wc/store/v1` as belonging to a dedicated route. Left in place rather than deleted, which is out of scope here.

**A namespace added to `endpoints.ts` without classification** → Fails CI. One test asserts every entry in `REST_NAMESPACES` is either proxied or has a dedicated route, and a second scans the endpoint path strings so a namespace hardcoded into one rather than taken from the registry is caught too. Verified by adding a namespace and watching it fail.

**Writes are now split across two routes** → Reads go through `/api/wp`, Gravity Forms writes through `/api/forms`. A third write surface appearing in the browser will need its own route rather than falling through. That is deliberate: the read proxy staying GET-only is what keeps its blast radius small.

**The 401/403 redirect interceptor now sees proxy responses** → `proxyToWP` returns the upstream status unchanged, so a genuine WordPress 401 still triggers the existing login bounce. The proxy's own 400-class refusals are not 401/403 and therefore do not bounce.

**Envelope handling now happens twice** → `proxyToWP` strips `{ success, data }`, then `unwrapLmsEnvelope` inspects the already-unwrapped body, finds no `success` key, and passes it through. Harmless, but it means a payload legitimately containing a top-level `success` field would be double-unwrapped. A test pins that it is not.

## Migration Plan

1. Ship `proxyToWP()`'s header passthrough and `message` field first. Additive, affects existing BFF routes only by improving them, independently revertible.
2. Ship the route. Inert until something calls it.
3. Flip `baseURL`. This is the switch; it is one line and is the rollback point.
4. Verify on a preview deployment against the production CMS: the four broken cart reads, one paginated list read for totals, one signed-in read for personalisation, and one signed-out read of the same path.

**Rollback:** revert step 3. Services return to calling the CMS directly and the site is back to its current behaviour, broken cart sections included. The route can stay deployed; nothing calls it.

**Local dev note:** the local backend is a `.test` domain with a self-signed certificate. Server-side fetches already work because `next.config.mjs` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for local backends, and the route's fetch runs in that same process — but this is the first time browser reads depend on it, so it needs an explicit check rather than an assumption.

## Open Questions

- Whether `swca/v1` still needs browser reachability at all. It serves legacy certificate verification only. Keeping it in the allowlist is the conservative choice; removing it later is a one-line change once its call sites are confirmed unused.

**Resolved during implementation:** the revalidation window is 300s, matching the `/settings` TTL, with `stale-while-revalidate=600` so one visitor absorbs each refresh instead of all of them.
