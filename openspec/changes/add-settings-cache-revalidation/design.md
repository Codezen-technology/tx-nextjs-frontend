## Context

See `proposal.md — Why` for the incident. The relevant current state:

- Every WordPress read goes through `serverFetch()` in `src/lib/api/server.ts`, which passes `{ revalidate, tags }` straight to `fetch()`'s `next` option. Roughly 30 call sites, each with its tag written inline as a string literal.
- `WP_REVALIDATE_SECRET` exists in `src/lib/env.ts:57` and is read by nothing.
- Next.js is `16.2.9`, where `revalidateTag(tag, profile)` takes the profile as a **required** second argument (`revalidate.d.ts`; omitting it is deprecated). `'max'` — the value the docs lead with — serves stale content for up to a year while revalidating behind the scenes, so the editor who pressed Save would still see the old page. `{ expire: 0 }` is the immediate form: stale is never served and the next request blocks on fresh data. `next.config.mjs` sets no `cacheComponents` / `dynamicIO` flag, so caching is otherwise classic fetch-level ISR.
- The Vercel deployment runs one region; `revalidateTag` purges the Data Cache for that deployment. Preview deployments have their own cache and are unaffected by a purge aimed at production.
- No BFF route in `src/app/api/` is unauthenticated-but-privileged today; every one either proxies with a user token or is a public passthrough. This route is the first with a machine-to-machine shared secret, so it sets the pattern.

## Goals / Non-Goals

**Goals:**

- One purge endpoint that covers every tag `serverFetch` already declares, not a settings-only special case — the incident was about settings, the mechanism should not be.
- Make the tag vocabulary a thing that exists in code, so "which tags can WordPress purge?" has an answer that cannot drift from what `server.ts` actually tags.
- Keep the failure mode of a missing or broken hook equal to today's behaviour (TTL refresh), never worse.

**Non-Goals:**

- Path-based revalidation (`revalidatePath`). Every public page here is rendered dynamically or from tagged fetches, so purging the data is enough; adding a second purge axis doubles the contract for no gain today.
- Purging on post/course/page publish from WordPress. The route accepts per-entity tags so that work is a WP-side addition later, but wiring every CPT hook is out of scope for the change that fixes settings.
- Migrating to `cacheComponents` / `'use cache'`. Orthogonal, and it changes what `revalidateTag`'s second argument means.
- Any UI. This is machine-to-machine.

## Decisions

### POST with the secret in a header, not GET with it in a query string

The Next.js docs show `GET /api/revalidate?token=…`. Rejected: a secret in a query string lands in Vercel access logs, in WordPress's own outbound HTTP logs, and in any proxy in between, and a `GET` that mutates cache state is cacheable-by-accident and reachable from a link or a prefetcher.

Chosen: `POST` with the secret in an `x-wp-revalidate-secret` request header and the tag list in a JSON body. Non-`POST` methods return `405`.

### Fail closed on an unset secret

The obvious implementation — `if (provided !== env.WP_REVALIDATE_SECRET) return 401` — makes a deployment that forgot the variable accept `x-wp-revalidate-secret: ""` and purge anything. The route therefore checks configuration first and returns the same `401` when the secret is blank, so an unconfigured deployment is inert rather than open.

### Constant-time comparison, uniform rejection

`crypto.timingSafeEqual` over UTF-8 buffers, guarded by a length check (`timingSafeEqual` throws on mismatched lengths, and that throw is itself a length oracle — so compare lengths first and return the same `401` without calling it). Every rejection — unconfigured, missing header, wrong length, wrong value — returns an identical body. This is why the route pins `runtime = "nodejs"`: `node:crypto`'s `timingSafeEqual` is not part of the edge runtime's Web Crypto surface.

Alternative considered: HMAC-signing the request body with a timestamp, CMS-webhook style. Rejected as disproportionate — the worst a replayed purge can do is purge again, which is idempotent, and it would put a signing implementation on the WP side for no threat it closes.

### A tag registry module, not free-form tags

`revalidateTag()` on an arbitrary caller-supplied string is harmless to correctness but silently useless: a typo (`"setting"`) returns `200` and purges nothing, and that is exactly the failure the original incident would have looked like. So `src/lib/api/cache-tags.ts` exports:

- `STATIC_TAGS` — the ~25 constant tags, imported by `server.ts` at the call sites so the registry is the definition rather than a copy of it.
- `DYNAMIC_TAG_PATTERNS` — anchored regexes for the per-entity families (`course:<slug>`, `course:<slug>:curriculum|sections|related|reviews`, `blog:<slug>`, `page:<slug>`, `bundle:<slug>`, `product:<slug>`), with the slug segment constrained to the character class WordPress slugs actually use rather than `.+`, so a pattern cannot be talked into matching a whole other tag family.
- `isKnownTag(tag)` — the single predicate the route calls.

Alternative considered: accepting any string and reporting back what was purged. Rejected — Next gives no "did this tag exist" signal, so the response could not tell the truth.

### All-or-nothing validation

If any tag in the request is unknown, the route purges none of them and returns `400` naming the offender. A partial purge would let a WP-side mapping bug hide behind a `200`: the settings tag refreshes, the misspelled one never does, and nobody looks again. Failing the whole request makes the misconfiguration loud at the moment it is introduced. A per-request cap (20 tags) bounds the work a single call can trigger.

### Settings TTL 3600 → 300

Independent of the hook, and deliberately not "hook or TTL, pick one". The hook is the mechanism; the TTL is what limits the blast radius on the day the hook stops firing — a WP plugin update, a rotated secret, a firewall rule. 300s matches what most other reads in `server.ts` already use, so this makes settings ordinary rather than special. `/settings` is a small payload and `fetchSettings()` already degrades to env fallbacks on failure, so the extra revalidations cost little.

### Response body

`200 { revalidated: true, tags: [...], now: <epoch ms> }`. The echoed tags are what makes a WP-side mapping bug diagnosable from the WordPress error log alone, without shell access to the frontend. Errors carry a code and no detail beyond the rejected tag name on `400`.

### The WP hook stays in the backend repo

Consistent with `add-migration-notice-bar`: this repo ships the endpoint and the binding request contract in `API_REFERENCE.md`; `wp-lms-backend-rest-api` ships the `updated_option` hook. The contract the backend must honour is in the spec (`WordPress purge call contract`) — fire-and-forget (`wp_remote_post` with `blocking => false` or a `shutdown`-hooked send), never fail the editor's save, and skip the call when the option value did not actually change.

## Risks / Trade-offs

- **Secret leaks (log, repo, WP config dump)** → Blast radius is cache purges, i.e. extra origin load, not data access — the route reads nothing and returns no content. Mitigate by rotating in Vercel and WP together; the route reads the env var per request, so a rotation takes effect on the next deployment without code change.
- **Purge flood as a cheap origin-load amplifier for anyone holding the secret** → Per-request tag cap plus the registry bounds each call to known, cheap-to-refetch endpoints. If this ever becomes real, the mitigation is Vercel Firewall rate-limiting on the path, not application code.
- **A future `serverFetch` call site invents a tag and skips the registry** → It becomes unpurgeable, silently. Mitigated by `server.ts` importing the registry, which makes an unregistered tag a visibly hand-written literal in a file where every neighbour is a constant. A lint rule is possible later; not worth it for one file.
- **Preview deployments receive production's purge calls** if they share the WP instance → Harmless (each purges only its own cache) but confusing while debugging. Called out in the env docs.
- **Editors will now expect instant updates everywhere** once settings updates instantly, including for content whose WP hook is not wired yet → Documented scope in `API_REFERENCE.md`: which options currently fire a purge, and which do not.
- **A future `cacheComponents` migration changes what caching means here** → The route already passes `{ expire: 0 }` explicitly, so its intent survives; what would need revisiting is whether blocking the next request is still the right trade at that point. Noted so the migration knows to look.

## Migration Plan

1. Ship the route, registry, TTL change, and tests. With `WP_REVALIDATE_SECRET` unset everywhere, this is inert apart from the shorter settings TTL — safe to merge before any WP work exists.
2. Generate a secret; set it in Vercel Production and Preview; redeploy.
3. Verify against the deployment: a `POST` with the secret and `["settings"]` returns `200`; without it, `401`; with a bogus tag, `400`.
4. Wire the WP hook, save the floating-bar option, confirm the change appears on the next page load.
5. **Rollback**: unset `WP_REVALIDATE_SECRET` — the route goes inert immediately and every read falls back to TTL refresh. No revert needed to restore today's behaviour.
