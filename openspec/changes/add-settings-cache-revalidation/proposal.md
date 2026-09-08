## Why

An editor switched the sitewide floating bar on in WP Admin and it did not appear on `trainingexcellence.org.uk`. Nothing was broken: `GET /lms-backend/v1/settings` served the notice, and the deployed frontend already knew how to render it — the live RSC payload carried `"floating_bar":"$undefined"`, which is `mergeSettings()` reporting that the settings response _it consumed_ had no bar in it. That response came out of the Next.js Data Cache, which holds `/settings` for an hour (`revalidate: 3600, tags: ["settings"]`, `src/lib/api/server.ts:554`).

So every WP content edit this frontend reads is invisible for up to its TTL, and there is no way to shorten that from the WP side. `WP_REVALIDATE_SECRET` has been defined in `src/lib/env.ts:57` since the project started, but nothing reads it: **there is no revalidation endpoint in this repo**, so no cache tag can ever be purged on demand. Every one of the ~30 tags in `serverApi` is TTL-only.

This matters beyond one notice. The floating bar is the case where the delay is most visible — it is the thing an editor flips _because_ something is urgent — but a course price, a footer link, or a homepage section behaves the same way, and "wait an hour, then redeploy if it still looks wrong" is the workaround people are using today.

## What Changes

- **New `POST /api/revalidate` route** in this repo: authenticated with `WP_REVALIDATE_SECRET`, takes a list of cache tags, calls `revalidateTag()` on each, and reports which were accepted.
- **Fail closed.** With `WP_REVALIDATE_SECRET` unset the route rejects every request — a deploy that forgot the variable must not expose an unauthenticated cache-purge endpoint. Secret comparison is constant-time, and every rejection returns the same opaque 401 so the endpoint leaks nothing about which half of a request was wrong.
- **Tags are validated against a central registry, not free-form.** The tag strings currently live inline at ~30 `serverFetch` call sites; this change extracts the static ones into one exported registry so the route can reject anything it does not recognise, and so a tag can no longer be renamed at the fetch site without the caller noticing. Dynamic per-entity tags (`course:<slug>`, `blog:<slug>`, `page:<slug>`, …) are accepted by pattern.
- **Lower the `/settings` TTL from 3600s to 300s.** Belt and braces: the hook is the fix, the TTL is what protects us the day the hook silently stops firing. Settings is a small payload on a warm upstream, so the extra revalidations are cheap.
- **Document the WP-side contract**: which option saves fire the call, what request shape the backend must send, and which tag each option maps to. The hook itself is implemented in `wp-lms-backend-rest-api` (separate repo, owned by the user), so this change ships the frontend half plus the binding request contract — the same split as `add-migration-notice-bar`.
- Not a breaking change. Nothing existing calls this route; behaviour with no hook configured is exactly today's behaviour, only with a shorter settings TTL.

## Capabilities

### New Capabilities

- `content-cache-revalidation`: how the frontend accepts an on-demand cache purge from WordPress — authentication and its failure modes, which tags are purgeable and how they are validated, what the response says, and how the endpoint behaves when it is unconfigured, partially wrong, or abused.

### Modified Capabilities

<!-- None. `site-floating-bar` is the symptom that surfaced this, but no requirement
     of that spec changes: the bar's render rules, dismissal behaviour and degradation
     are all unchanged. This change is about how fast the data behind it arrives. -->

## Impact

**Frontend (this repo)**

- New route `src/app/api/revalidate/route.ts` (Node runtime, force-dynamic — it must never itself be cached).
- New `src/lib/api/cache-tags.ts` — the static tag registry plus the dynamic-tag patterns, imported by both `server.ts` and the route so there is one source of truth.
- `src/lib/api/server.ts` — call sites reference the registry; `settings.get()` TTL 3600 → 300.
- `.env.example` and `AGENTS.md` / `CLAUDE.md` env docs — `WP_REVALIDATE_SECRET` moves from "defined but unused" to required-for-instant-updates, with a note that leaving it unset is a valid (TTL-only) configuration.
- `API_REFERENCE.md` — the request contract the WP plugin must send.
- Unit tests: auth accept/reject, unset-secret lockout, unknown-tag rejection, dynamic-tag acceptance, and that a valid call reaches `revalidateTag` once per tag.

**Backend (`wp-lms-backend-rest-api`, separate repo — not implemented here)**

- An `updated_option` / `update_option_<name>` hook that POSTs the mapped tags to `NEXT_PUBLIC_SITE_URL/api/revalidate` with the shared secret, fired at minimum on the floating-bar and site-settings options.
- The call must be non-blocking and must not fail the admin save when the frontend is unreachable — a purge that does not happen degrades to the TTL, which is the behaviour we have today.

**Operational**

- `WP_REVALIDATE_SECRET` must be set to the same value in Vercel (Production + Preview) and in the WP plugin config. Preview deployments pointing at the same WP instance will receive the same hook calls; that is harmless (each purges only its own cache) but worth knowing before debugging.

**Risk / accepted tradeoffs**

- A leaked secret buys an attacker cache purges, i.e. extra load on the WP origin — not data access, not writes. Accepted; the endpoint exposes no read path and returns no content.
- The route can only purge tags it knows about. A tag added at a `serverFetch` call site without registering it is silently unpurgeable — mitigated by the registry being the thing `server.ts` itself imports, so an unregistered tag is a visibly hand-written string.
- 300s settings TTL means a broken `/settings` upstream is re-attempted 12× more often. Bounded by `WP_FETCH_TIMEOUT_MS`, and `fetchSettings()` already degrades to env fallbacks.
