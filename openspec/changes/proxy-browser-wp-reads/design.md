## Context

See `proposal.md` — Why, for the incident and root cause. What matters for the design:

- `src/lib/api/client.ts` exports one axios singleton, `api`, with `baseURL: WP_REST_BASE` — the public CMS origin plus `/wp-json`. It is used from **both** browser and server: ten services under `src/lib/services/` call it, and some of those services are consumed by Server Components (`pages.ts` from the marketing `[slug]` page, `products.ts`, `bundles.ts`). Any change to `baseURL` must distinguish the two. The file already computes `isBrowser`.
- The endpoint strings in `src/lib/api/endpoints.ts` are namespace-prefixed (`/lms-backend/v1/…`, `/wp/v2/…`, `/swca/v1/…`) and are appended to `baseURL`. `proxyToWP()` takes the opposite shape: a namespace-less path, because it prepends `env.LMS_NAMESPACE` itself. `courseSubpath()` exists solely to serve that second shape, and its docblock says so.
- `proxyToWP()` already implements the hard parts of the hop: token attach, 401 refresh-and-retry, and the "refresh failed on a public route, so drop the credential and serve the anonymous response" fallback. It also unwraps the `{ success, data }` envelope, which the browser interceptor `unwrapLmsEnvelope` would otherwise do.
- Two gaps in `proxyToWP()` block reuse. It never forwards `x-wp-total` / `x-wp-totalpages`, which `paginate()` reads from `res.headers`; and it emits failures as `{ error, code }` while `toApiError()` reads `data.message`.
- `src/proxy.ts` excludes `/api` from its matcher, so next-intl will not rewrite or locale-prefix anything under it.
- The commerce namespaces (`wc/store/v1`, `wc/v3`) are **not** reachable through the axios singleton. They have dedicated proxies with Cart-Token and Basic-auth handling. They are out of scope by construction.

## Goals / Non-Goals

**Goals:**

- One change fixes all twenty-four client-side reads, not the four that happen to be broken today.
- Zero edits to `src/lib/services/**`, `src/lib/hooks/**`, and components. A service that works today keeps working with no diff.
- Signed-in personalisation and signed-out access both keep working, with the same expired-token behaviour the curriculum route already ships.
- Server-rendered reads are byte-identical to today. This change must not alter SSR, ISR, or build-time fetching.

**Non-Goals:**

- Not a general egress proxy. It will not forward to arbitrary hosts, arbitrary namespaces, or non-read methods.
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

The allowlist is the three namespaces `endpoints.ts` actually emits for the axios client — `lms-backend/v1` (via `env.LMS_NAMESPACE`, so it must be read from env rather than hardcoded), `wp/v2`, `swca/v1`. Anything else is refused before a socket is opened. The commerce namespaces are excluded deliberately: they need Cart-Token and Basic auth that this route does not and should not implement, and routing them here would silently strip that.

Alternative considered: a single flat allowlist of full path prefixes (`/lms-backend/v1/courses`, …). Rejected — it needs updating every time an endpoint is added, which is precisely the maintenance tax this change exists to remove.

### Decision 3: `baseURL` switches on `isBrowser`, and services do not change

```ts
baseURL: isBrowser ? "/api/wp" : WP_REST_BASE || "/wp-json",
```

Because the endpoint strings already carry their namespace, `/api/wp` + `/lms-backend/v1/courses/popular` composes to exactly the path the route expects. This is the whole reason the namespace lives in the endpoint string rather than in `baseURL`, and it is why no service needs touching.

The server branch is unchanged, so Server Components using the axios singleton keep hitting the CMS directly — a relative `baseURL` would be meaningless to Node's fetch anyway.

Alternative considered: migrating the four broken services to `bffJson()` with hand-written routes, as `courses.curriculum()` does. Rejected — it is four files of near-identical code, it leaves twenty reads exposed, and it makes each service carry knowledge of its own transport.

### Decision 4: `proxyToWP()` gains header passthrough and a `message` field

Both are additive and benefit every existing caller.

- Forward `x-wp-total` and `x-wp-totalpages` onto the response, copying what `proxyToWCRest()` already does. Without this, `paginate()` falls back to `items.length` and every proxied list read reports a wrong total the moment its upstream uses header pagination rather than an envelope.
- Emit `{ error, message, code }` instead of `{ error, code }` on an upstream failure, with `message` carrying the same text as `error`. `toApiError()` reads `message`; `bffJson()` reads `error` first and falls back to `message`. Adding the field satisfies both and breaks neither.

Alternative considered: normalising in the new route only. Rejected — the bugs are in the shared proxy, and every other BFF route has them too.

### Decision 5: Cache public reads only, by keying on the presence of a credential

The route runs on the Node runtime and is dynamic. A read that arrives with no `access_token` cookie is identical for every visitor and gets a short revalidation window; a read that arrives with one is personalised and is not cached at all. This is the simplest rule that satisfies the spec's "cached proxy responses never leak between visitors" requirement without inventing a per-user cache key.

The consequence is that signed-in visitors pay the full round trip on every read. That is acceptable: signed-in traffic is a fraction of total traffic, and the alternative — a vary-by-user cache — is a correctness risk far out of proportion to the saving.

## Risks / Trade-offs

**A same-origin GET proxy is callable by anything on the frontend origin** → Bounded to three read namespaces, `GET` only, no request body forwarded. The worst case is reading public WordPress content that was already public. It grants no writes and cannot reach another host, because the destination origin comes from server config, never from the request.

**All CMS egress concentrates on the deployment's server IPs** → If SiteGround ever challenges that IP, every browser read fails simultaneously instead of degrading per-visitor. This is strictly worse than today's failure mode in blast radius and strictly better in likelihood. It is why the infrastructure follow-up (exclude `/wp-json/*` from the Anti-Bot System, or allowlist egress IPs) is the real fix and this is the mitigation.

**One extra network hop per browser read** → Same-datacentre, and public reads are cached with a short revalidation window, so the steady state is a CDN hit. Cold reads cost one intra-datacentre round trip.

**A namespace added to `endpoints.ts` without adding it to the allowlist fails at runtime, not at build time** → Mitigated by keeping the allowlist derived from the same `env.LMS_NAMESPACE` the endpoints use, and by a unit test that asserts every namespace `endpoints.ts` emits for the axios client is allowed. The failure is loud (a client error with an explicit message) rather than silent.

**The 401/403 redirect interceptor now sees proxy responses** → `proxyToWP` returns the upstream status unchanged, so a genuine WordPress 401 still triggers the existing login bounce. The one new case is the proxy's own 400-class refusals for a bad namespace or method, which are not 401/403 and therefore do not bounce.

**Envelope handling now happens twice** → `proxyToWP` strips `{ success, data }`, then `unwrapLmsEnvelope` inspects the already-unwrapped body, finds no `success` key, and passes it through. Harmless, but it means a payload that legitimately contains a top-level `success` field would be double-unwrapped. No current endpoint does; a test pins the behaviour.

## Migration Plan

1. Ship `proxyToWP()`'s header passthrough and `message` field first. Additive, affects existing BFF routes only by improving them, independently revertible.
2. Ship the route. Inert until something calls it.
3. Flip `baseURL`. This is the switch; it is one line and is the rollback point.
4. Verify on a preview deployment against the production CMS: the four broken cart reads, one paginated list read for totals, one signed-in read for personalisation, and one signed-out read of the same path.

**Rollback:** revert step 3. Services return to calling the CMS directly and the site is back to its current behaviour, broken cart sections included. The route can stay deployed; nothing calls it.

**Local dev note:** the local backend is a `.test` domain with a self-signed certificate. Server-side fetches already work because `next.config.mjs` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for local backends, and the route's fetch runs in that same process — but this is the first time browser reads depend on it, so it needs an explicit check rather than an assumption.

## Open Questions

- What revalidation window suits the public reads? Anything from 60s to 300s is defensible and the choice does not affect the specs, the approach, or the tasks. Start at 300s to match the `/settings` TTL set by `add-settings-cache-revalidation`, and tune once there is cache-hit data.
- Whether `swca/v1` still needs browser reachability at all. It serves legacy certificate verification only. Keeping it in the allowlist is the conservative choice; removing it later is a one-line change once its call sites are confirmed unused.
