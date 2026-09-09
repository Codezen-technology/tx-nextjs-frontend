## 1. Fix the shared proxy first (independently shippable)

- [x] 1.1 In `src/lib/api/bff.ts`, make `proxyToWP()` forward `x-wp-total` and `x-wp-totalpages` from the upstream response onto its own, mirroring what `proxyToWCRest()` already does around line 140.
- [x] 1.2 In the same function, change the `envelope.success === false` branch to emit `{ error, message, code }` with `message` carrying the same text as `error`, so `toApiError()` finds it. Leave `error` in place — `bffJson()` reads it first.
- [x] 1.3 Add unit tests for both: a paginated upstream response surfaces its header totals through the proxy, and an upstream failure produces a body carrying `error`, `message`, and `code`.
- [x] 1.4 Run `pnpm typecheck` and `pnpm test` to confirm no existing BFF route regressed.

## 2. Build the catch-all read proxy

- [x] 2.1 Create `src/app/api/wp/[...path]/route.ts` exporting `GET` only, on the Node runtime, with a docblock explaining why browser reads cannot reach the CMS directly — follow the tone of the `courses/[id]/curriculum` route's docblock.
- [x] 2.2 Define the namespace allowlist as `env.LMS_NAMESPACE`, `wp/v2`, and `swca/v1`. Read the first from env rather than hardcoding `lms-backend/v1`, so an env override cannot desync the allowlist from `endpoints.ts`.
- [x] 2.3 Split the caught path into a two-segment namespace and the remaining WordPress path. Refuse with a client error, before any upstream call, when the namespace is not allowlisted or when no path remains beneath it.
- [x] 2.4 Forward the incoming query string unchanged onto the upstream path.
- [x] 2.5 Call `proxyToWP(wpPath + query, { namespace, requiresAuth: false })` so signed-out visitors read public content and a signed-in visitor's token is attached and refreshed.
- [x] 2.6 Cache only credential-free reads: when no `access_token` cookie is present, set a 300s revalidation window on the response; when one is present, mark the response uncacheable.

## 3. Route browser reads through it

- [x] 3.1 In `src/lib/api/client.ts`, change `baseURL` to `isBrowser ? "/api/wp" : WP_REST_BASE || "/wp-json"`, with a comment naming the CORS-challenge reason so nobody "simplifies" it back.
- [x] 3.2 Confirm no service or component needs editing — the namespace already lives in the `endpoints.ts` strings, so composition is unchanged. Grep `src/lib/services/` for any hardcoded absolute CMS URL that would bypass `baseURL`, and fix any found.
- [x] 3.3 Verify Server Components using the axios singleton (`pages.ts` from the marketing `[slug]` page, `products.ts`, `bundles.ts`) still resolve an absolute URL, by running `pnpm build` and confirming those pages prerender.

## 4. Tests

- [x] 4.1 Route tests for refusal paths: a namespace outside the allowlist, a non-`GET` method, and a request with no path beneath the namespace — each rejected without an upstream call.
- [x] 4.2 Route tests for the happy paths: an allowlisted read forwards path and query intact; a signed-out read succeeds with no credential; a signed-in read presents one.
- [x] 4.3 Route test for the expired-session path: the upstream returns 401, refresh fails, and the read is retried anonymously and returns the public response rather than an error.
- [x] 4.4 Guard test asserting every namespace `endpoints.ts` emits for the axios client is present in the route's allowlist, so adding a namespace without allowlisting it fails in CI rather than in production.
- [x] 4.5 Client test asserting `baseURL` is the proxy path in a browser environment and the CMS origin in a server environment.

## 5. Verify against the real CMS

- [x] 5.1 Run locally against the `.test` backend and confirm the self-signed certificate does not break the route's server-side fetch. This is the first time browser reads depend on the existing `NODE_TLS_REJECT_UNAUTHORIZED` handling in `next.config.mjs`.
- [ ] 5.2 On a preview deployment pointed at the production CMS, load `/cart` and confirm all four previously broken reads succeed with an empty console: `bulk-discount-tiers`, `membership-upsell`, `courses/popular`, `courses/{id}/related`.
      **Not done — needs a deploy.** All four were verified locally against `tx-local-site.test` (course page and cart page, 200 each, zero console errors, no request to the CMS host). That backend has no bot protection, so the local pass does not prove the production fix; only a preview pointed at the challenged origin does.
- [x] 5.3 Confirm a paginated list read reports the correct total, not `items.length`, by comparing a proxied read against the same read made directly from the server.
- [x] 5.4 Confirm a signed-in visitor and a signed-out visitor both read the same public path successfully, and that the signed-in response is not served from cache to the signed-out one.
- [x] 5.5 Confirm in the browser network panel that no request to the CMS host remains on any page exercised.

## 6. Documentation and follow-up

- [x] 6.1 Update the "Data flow (client-side reads)" section in `AGENTS.md` and `CLAUDE.md`. The current text describes public reads going direct with the curriculum route as "one exception, and it is growing" — replace that with the rule that all browser reads go through the proxy, and note that Server Components still read direct.
- [x] 6.2 Record the infrastructure follow-up somewhere durable: `/wp-json/*` should be excluded from SiteGround's Anti-Bot System, or the deployment's egress IPs allowlisted. Note that without it, a challenge against the server IP breaks SSR and the proxy together.
- [x] 6.3 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` clean before opening the PR.
