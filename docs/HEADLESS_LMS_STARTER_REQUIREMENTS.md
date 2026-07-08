# Headless LMS Frontend — Boilerplate Starter Requirements

Prescriptive spec for standing up a **new headless LMS frontend** from the `tx-headless-frontend` template. Written from the patterns already proven in this project. This is not a menu — the **Non-negotiables** are load-bearing. Skip them and you will ship a token leak, an N+1 over the REST API, or a cart that desyncs under load.

**Stack (locked):** Next.js 16 App Router · React 19 · TypeScript strict · pnpm · Tailwind 3 + Radix + CVA · TanStack Query 5 · Zustand 4 · react-hook-form + Zod · next-intl · next-themes · Stripe · Sentry · Vitest+MSW · Playwright.

**Backend:** WordPress + WPLMS + WooCommerce, exposed through custom REST namespaces (`lms-backend/v1`, `lms-b2b/v1`) + WC Store/REST APIs.

---

## 0. Non-negotiables

These are not preferences. Every one exists because the alternative broke in production.

1. **Tokens never touch browser JavaScript.** Access + refresh tokens live in `HttpOnly`, `Secure`, `SameSite=Lax` cookies set by the BFF. The browser gets `{ user }` and a non-httpOnly `user_logged_in=1` flag — nothing else. If a token is readable from `document.cookie` or Zustand/localStorage, the build is rejected. XSS should never equal account takeover.

2. **One env surface.** All config flows through `src/lib/env.ts`. No `process.env.*` in a component, service, or hook. Public (`NEXT_PUBLIC_*`) and server-only vars are split deliberately — server-only secrets (`WC_CONSUMER_SECRET`, `STRIPE_SECRET_KEY`, `WP_INTERNAL_SECRET`) must never gain a `NEXT_PUBLIC_` prefix or they end up in the client bundle.

3. **One endpoint map.** Every URL string lives in `src/lib/api/endpoints.ts`. No inline REST paths anywhere else. Namespace changes must be one-line edits.

4. **One query-key map.** Every TanStack key comes from `src/lib/utils/query-keys.ts`. Inline key arrays cause silent cache collisions and un-invalidatable data. Non-negotiable.

5. **Normalization lives in services, never components.** WPLMS field names drift across versions (`total_students` vs `students_count`, `average_rating` vs `rating`, `duration_seconds` vs `duration`). `src/lib/services/` is the only layer allowed to translate WP shapes → `src/types/` domain types. A component reading `course.students_count ?? course.total_students` is a bug — fix the service.

6. **Decode entities on every rendered string.** WP returns `rendered` HTML-entity-encoded (`&amp;`, `&#8217;`). Run `decodeEntities()` on every title/excerpt or the UI shows garbage. Non-negotiable on any field from a `{ rendered }` object.

7. **Tag every server fetch.** Server Component fetches carry Next.js cache tags so `revalidateTag()` can do surgical ISR invalidation. Untagged fetches force full-route revalidation and defeat the cache.

---

## 1. Required scaffolding (file manifest)

The template must ship these before a single feature page is written.

```
src/
  lib/
    env.ts                     # typed env surface + boolFlag() feature flags
    api/
      endpoints.ts             # ALL urls, grouped by namespace
      bff.ts                   # proxyToWP / proxyToB2B / proxyToWCStore / proxyToWCRest
      bff-client.ts            # bffJson() — credentials:"include"
      client.ts                # Axios singleton, public reads only
      server.ts                # serverApi/serverFetch, cache-tagged
      auth-cookies.ts          # httpOnly set/clear helpers
      error.ts                 # ApiError, interceptor conversion
      parsers.ts               # paginate() + decodeEntities()
    utils/
      query-keys.ts            # centralized keys
      cn.ts                    # tailwind-merge
      color.ts                 # dynamic theme -> CSS vars
      format.ts                # currency/date, driven by env.CURRENCY/LOCALE
    stores/
      auth.store.ts            # { user } only, NO tokens
    schemas/                   # zod: auth, profile
    seo/server.ts              # fetchRankMathSeo + buildPageMetadata
  app/
    [locale]/
      layout.tsx  error.tsx  not-found.tsx
      (auth)/  (marketing)/  (student)/  (learn)/  (shop)/
    api/                       # BFF routes mirror endpoints.ts
    sitemap.ts  robots.ts
  components/
    ui/                        # button,input,card,dialog,sheet,select,tabs,accordion,
                               # badge,avatar,pagination,skeleton,progress,empty-state,
                               # safe-image,parsed-html,form-field
    layout/                    # header,footer,site-shell,minimal-shell,profile-menu,theme-toggle
    providers/site-settings-provider.tsx
  proxy.ts                     # Next 16 proxy, nodejs runtime, route guards + next-intl
  i18n/  routing.ts  request.ts  messages/en.json
  instrumentation.ts           # Sentry
  __tests__/  mocks/handlers.ts  test-utils.tsx
```

---

## 2. The BFF contract

The proxy layer is the security boundary. Requirements:

- **`proxyToWP(path, options)`** — reads httpOnly `access_token`, sends `Authorization: Bearer`, and on `401` calls `tryRefresh()` **once**, replays the request, and re-sets rotated cookies. Refresh must be single-flight — concurrent 401s cannot each fire a refresh or you get a token-rotation race that logs the user out mid-session.
- **Namespace-aware variants** — the template already needs `proxyToB2B` (B2B facade), `proxyToWCStore` (cart, cart-token header + nonce), `proxyToWCRest` (orders, basic-auth consumer keys), and `proxyFormDataToWP` (uploads). Keep them in one file; do not scatter proxy logic.
- **BFF routes are thin.** `src/app/api/*/route.ts` validates input, calls a proxy, returns the response. No business logic in route handlers.

**Cookie flags — mandatory:**

```ts
{ httpOnly: true, secure: true, sameSite: "lax", path: "/" }
// access_token: short maxAge (~15m). refresh_token: long (~30d).
// Also set NON-httpOnly user_logged_in=1 (same lifetime as refresh) — the ONLY auth signal proxy.ts reads.
```

---

## 3. Backend REST contract (the frontend assumes this)

The template is worthless without a backend that honors this. Hand these requirements to whoever owns the WP plugin.

**Response envelope — every custom endpoint:**

```json
{ "success": true,  "data": { ... } }
{ "success": true,  "data": { "items": [...], "total": 100, "page": 1, "per_page": 10, "totalPages": 10 } }
{ "success": false, "error": { "code": "lms_...", "message": "..." } }
```

`paginate()` also tolerates native `X-WP-Total` headers — but new endpoints should use the envelope.

**Required endpoints to boot a functional LMS (see `endpoints.ts` for full map):**

| Domain          | Must expose                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth            | `auth/{login,register,refresh,logout,logout-all,forgot-password,reset-password}` — JWT access+refresh                                                |
| User            | `users/me` (+ update), `users/me/{enrollments,progress,certificates,avatar}`                                                                         |
| Courses         | `courses`, `courses/{id\|slug}`, `.../curriculum`, `.../sections`, `.../reviews`, `.../related`, `courses/featured\|popular\|free`, `courses/search` |
| Player          | `courses/{id}/player-status`, `courses/{id}/finish`, `units/{id}/player-content?course_id=`, `units/{id}/player-complete`                            |
| Quiz            | `quizzes/{id}/{questions,start,submit,results}`, `quizzes/{id}/full?course_id=`                                                                      |
| Assignment      | `assignments/{id}/{full,start,submit,upload,status}`                                                                                                 |
| Enroll/Progress | `courses/{id}/enroll`, `users/me/courses/{id}/progress`                                                                                              |
| Commerce        | WC Store `wc/store/v1/cart*`, WC REST `wc/v3/{orders,payment_gateways}`                                                                              |
| Site config     | `settings`, `home/*`, `footer`, `pricing`, `promo-banner`, `checkout-fields`                                                                         |
| Taxonomy        | `course-categories`, `tags`, `levels`                                                                                                                |
| Certificates    | `certificates/verify` (+ legacy `swca/v1/get-certificate` if migrating)                                                                              |

**Config-driven multi-tenant requirement:** `GET /lms-backend/v1/settings` returns site identity (name, logos, colors, currency, locale) + feature flags. The frontend renders from this; env vars only override. This is what lets one codebase serve multiple LMS sites.

**Internal endpoints** (server-to-server, e.g. certificate webhook) must require the `WP_INTERNAL_SECRET` shared header. Do not leave them open.

---

## 4. Route groups (App Router)

| Group         | Paths                                                                                                                                          | Rendering                           | Guard                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| `(marketing)` | `/`, `/all-courses`, `/course/[slug]`, `/course-cat/[slug]`, `/bundles`, `/blog`, `/pricing`, `/verify-certificate`, legal, `[slug]` CMS pages | SSR/ISR + full SEO                  | public                              |
| `(auth)`      | `/login`, `/register`, `/forgot-password`, `/reset-password`                                                                                   | CSR                                 | bounce authed → `/dashboard`        |
| `(student)`   | `/dashboard`, `/dashboard/{my-learning,my-orders,profile,subscription}`                                                                        | protected, `SiteShell`              | `user_logged_in`                    |
| `(learn)`     | `/learn/[courseId]/start`, `/learn/[courseId]/[unitId]`                                                                                        | full-screen player, `minimal-shell` | enrollment-gated                    |
| `(shop)`      | `/cart`, `/checkout`, `/checkout/pay`, `/order-confirmation/[orderId]`                                                                         | CSR + Stripe                        | mixed                               |
| `(business)`  | `/business-dashboard/*` (B2B)                                                                                                                  | protected                           | role-gated, `business-access-guard` |

**SEO gate:** every `(marketing)` page exports `generateMetadata` (via `fetchRankMathSeo` + `buildPageMetadata`, with title/description/canonical fallbacks) and every `[slug]` page exports `generateStaticParams`. JSON-LD injected in JSX. No public page ships without this.

---

## 5. WPLMS-specific traps (bake handling into the template)

Twenty years of WP says these will bite you. Handle them once, in the template.

- **Vimeo player state.** The unit player wraps `@vimeo/player`. "Ended" fires unreliably on seek/replay — gate completion on a debounced `ended` + percent-watched threshold, not the raw event. See `lib/player/vimeo-ended.ts`.
- **Quiz answers are encrypted server-side.** `quizzes/{id}/full` returns WPLMS-encrypted correct answers. Never attempt client-side scoring; submit and let the backend grade.
- **WC Store API is stateful.** Cart lives against a `Cart-Token`/nonce, not the JWT. `proxyToWCStore` must forward and persist that token per session or the cart empties between requests. Do not mix WC Store cart identity with LMS auth.
- **Pagination shape drift.** WPLMS endpoints return `{items,total}` on some routes and `X-WP-Total` headers on others. `paginate()` already tolerates both — route everything through it, never read `res.data.length`.
- **HTML entities everywhere.** Covered in §0.6 — but specifically course titles, category names, and blog excerpts. Wrap them all.
- **Progress writes are eventually consistent.** After `units/{id}/player-complete`, invalidate `queryKeys.progress.course(id)` and `queryKeys.player.status(courseId)` — don't optimistically trust a stale summary.

---

## 6. Feature flags (env + `/settings`)

Ship the LMS with modules toggle-able so a new site turns off what it doesn't sell. Env overrides `/settings`; default `true` except badges.

```
FEATURE_MEMBERSHIPS  FEATURE_BUNDLES  FEATURE_CERTIFICATES
FEATURE_REVIEWS      FEATURE_BLOG     FEATURE_BADGES(false)
```

Read via `useFeatureFlag()` client-side, `env.FEATURE_*` server-side. Gate routes and nav, not just UI — a disabled module should 404, not render empty.

---

## 7. Definition of done (before first deploy)

1. `pnpm typecheck` + `pnpm lint` clean, `pnpm build` green.
2. Auth E2E (Playwright): register → login → protected route → logout, tokens never visible in `document.cookie`.
3. One full LMS flow E2E: browse course → enroll (or purchase) → open player → complete a unit → progress reflects.
4. Service unit tests (Vitest+MSW) for normalization on every service touching WP shapes.
5. Every public page: `generateMetadata` + JSON-LD verified in page source.
6. Sentry receiving events (client + server). Source maps uploaded.
7. `next/image` hosts configured for the WP/CDN domain.
8. `/settings` drives name/logo/colors — confirm by flipping one value with zero code change.
9. Lighthouse: LCP < 2.5s on course detail + home. A11y ≥ 95.
10. Refresh-race check: fire concurrent authed requests after token expiry — single refresh, no logout.

---

## 8. Hard "don't"s

- Don't store tokens in Zustand, localStorage, or non-httpOnly cookies.
- Don't call WP directly from a client component for authed data — always via `/api/*` BFF.
- Don't `process.env` outside `env.ts`.
- Don't inline REST paths or query keys.
- Don't normalize field names in components.
- Don't render WP `rendered` strings without `decodeEntities()`.
- Don't fork the UI kit / BFF / SEO helpers per site — extract upstream.
- Don't score quizzes or gate enrollment on the client — the backend is the authority.

```

```
