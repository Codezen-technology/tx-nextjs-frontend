## 1. Cache tag registry

- [x] 1.1 Create `src/lib/api/cache-tags.ts` exporting a named `TAGS` map plus a derived `STATIC_TAGS` list and `StaticTag` type — every constant tag written inline anywhere server-side, not just in `server.ts`: the 22 in `serverApi` plus `blog:categories`, `cancellations-page`, `contact-page`, and `certificate-page` from the service layer. (Scope widened from the plan: a tag left out of the registry is a tag WordPress can never purge.)
- [x] 1.2 Add `DYNAMIC_TAG_PATTERNS` — anchored regexes for `course:<slug>` and its `:curriculum|:sections|:related|:reviews` sub-resources, `blog:<slug>`, `blog:category:<slug>`, `page:<slug>`, `bundle:<slug>`, `product:<slug>`, `form:<id>`, and `certificate-page-<product>`, with the entity segment constrained to WordPress slug characters (unicode letters/numbers, `_`, `%`, `-` — never `:` or `/`, so one family cannot match another).
- [x] 1.3 Add `isKnownTag(tag: string): boolean` — static-set membership OR one pattern match — and `MAX_TAGS_PER_REQUEST = 20`.
- [x] 1.4 Update `src/lib/api/server.ts` and the service-layer fetches (`blog.server.ts`, `cancellations.server.ts`, `contact.server.ts`, `certificate.ts`) to reference `TAGS` members instead of inline literals, leaving the dynamic template literals as they are. Verify no tag string changed value.

## 2. Revalidation route

- [x] 2.1 Create `src/app/api/revalidate/route.ts` with `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`, exporting `POST` only.
- [x] 2.2 Implement auth: read `x-wp-revalidate-secret`; return `401` with an identical opaque body when `env.WP_REVALIDATE_SECRET` is blank, when the header is absent, when lengths differ, or when `crypto.timingSafeEqual` over the UTF-8 buffers fails. Compare lengths before calling `timingSafeEqual` so its throw is never the oracle.
- [x] 2.3 Parse and validate the body: `400` when the body is absent, not JSON, has no `tags` array, has an empty array, contains a non-string, or exceeds `MAX_TAGS_PER_REQUEST`.
- [x] 2.4 Validate every tag with `isKnownTag` before purging anything; on any unknown tag return `400` naming it and purge nothing.
- [x] 2.5 Call `revalidateTag(tag, { expire: 0 })` once per de-duplicated tag — the profile argument is required in Next 16.2.9, and `{ expire: 0 }` expires immediately where the docs' `"max"` would serve stale for up to a year — then return `200 { revalidated: true, tags, now }` with no-store response headers.
- [x] 2.6 Add a `405` response for non-`POST` methods (export `GET`/`PUT`/`DELETE` handlers that return it, so a stray link or prefetch gets a method error rather than a 404).

## 3. Settings freshness

- [x] 3.1 Change `serverApi.settings.get()` in `src/lib/api/server.ts` from `revalidate: 3600` to `revalidate: 300`.
- [x] 3.2 Confirm nothing else depends on the 1-hour settings window. Callers are `src/app/layout.tsx` (layout + `generateMetadata`), `src/components/layout/footer.tsx`, and `src/lib/seo/server.ts`; all read per request through the shared Data Cache entry and none assume a window length.

## 4. Tests

- [x] 4.1 Unit-test the registry: every static tag used in `server.ts` is in `STATIC_TAGS`; representative dynamic tags match; near-miss strings (`setting`, `course:`, `course:a/b`, `blog:<slug>:evil`) do not.
- [x] 4.2 Route tests with `revalidateTag` mocked — valid request purges each tag exactly once and echoes them; repeated identical requests all return `200`.
- [x] 4.3 Auth tests — correct secret passes; wrong secret, missing header, and blank `WP_REVALIDATE_SECRET` (including a request presenting a blank secret) each return `401` with byte-identical bodies and no purge.
- [x] 4.4 Validation tests — malformed body, empty tag list, non-string tag, over-cap list, and unknown tag each return `400` with zero `revalidateTag` calls, including the mixed known+unknown case.
- [x] 4.5 Method test — `GET` returns `405` and purges nothing.

## 5. Documentation

- [x] 5.1 Document the request contract in `API_REFERENCE.md`: method, URL, `x-wp-revalidate-secret` header, body shape, response shapes, status codes, the purgeable tag list, and which WP options currently map to which tags.
- [x] 5.2 Add `WP_REVALIDATE_SECRET` guidance to `.env.example`, `AGENTS.md`, and `CLAUDE.md` — what it enables, that unset is a valid TTL-only configuration, and the note that preview deployments sharing the WP instance will receive the same purge calls harmlessly.
- [x] 5.3 Write the WP-side hook spec for `wp-lms-backend-rest-api` (delivered as `wp-hook-spec.md` in this change folder) (non-blocking `wp_remote_post`, never fails the editor's save, skips the call when the option value is unchanged, option → tag mapping starting with the floating-bar and site-settings options). Hand it to the backend repo; do not implement it here.

## 6. Verification

- [x] 6.1 `pnpm typecheck` clean, `pnpm lint` clean for the new files (45 pre-existing warnings elsewhere, 0 errors), `pnpm test` 858 passed / 67 files.
- [x] 6.2 Verified against a running dev server. With the secret set: `["settings"]` → `200 {"revalidated":true,...}`, dynamic tags → `200`, wrong secret and missing header → `401 {"error":"Unauthorized"}`, `["nope"]` → `400 Unknown cache tag: nope`, non-JSON → `400`, `GET` → `405`, response `cache-control: no-store`. On a second server with `WP_REVALIDATE_SECRET` unset, an empty header, a missing header and a guessed secret all → `401` (fail-closed confirmed outside the unit tests).
- [ ] 6.3 After deploy with the secret set in Vercel: purge `settings`, reload `/`, and confirm the live RSC payload carries the floating bar rather than `"floating_bar":"$undefined"`.
