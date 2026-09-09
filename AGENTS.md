<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, read the relevant doc from `node_modules/next/dist/docs/` — bundled with Next.js 16, always version-matched.

Structure:

- `node_modules/next/dist/docs/01-app/` — App Router (routing, data fetching, rendering, caching, auth)
- `node_modules/next/dist/docs/02-pages/` — Pages Router (legacy)
- `node_modules/next/dist/docs/03-architecture/` — internals (Turbopack, compiler, Fast Refresh)
- `node_modules/next/dist/docs/index.md` — table of contents / entry point

Your training data is outdated — these bundled docs are the source of truth.

<!-- END:nextjs-agent-rules -->

---

# Project: tx-headless-frontend

This file provides guidance to AI coding agents when working with code in this repository.

## Commands

**Package manager: pnpm** — do not use npm or yarn.

```bash
pnpm dev            # dev server (localhost:3000)
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint
pnpm lint:fix       # ESLint auto-fix
pnpm format         # Prettier write
pnpm format:check   # Prettier check
pnpm test           # Vitest unit tests (run once)
pnpm test:watch     # Vitest watch mode
pnpm test:coverage  # Vitest with coverage
pnpm test:e2e       # Playwright E2E (requires dev server running)
```

Pre-commit hook (Husky + lint-staged) runs lint + format on staged files.

## Environment

Copy `.env.example` to `.env.local`. Required:

- `NEXT_PUBLIC_WP_API_URL` — WordPress base URL, no trailing slash, no `/wp-json`
- `NEXT_PUBLIC_SITE_URL` — this app's public URL

Optional overrides (all defined in `src/lib/env.ts`):

- `NEXT_PUBLIC_LMS_NAMESPACE` — defaults to `lms-backend/v1`
- `WP_API_URL` — server-only override for `NEXT_PUBLIC_WP_API_URL` (skips browser-public value in BFF)
- `WP_FETCH_TIMEOUT_MS` — server-only per-request ceiling on every WordPress fetch (default `15000`). Bounds `next build`: an unbounded upstream stall burns a page's whole `staticPageGenerationTimeout` budget and fails the deploy
- `NEXT_PUBLIC_FEATURE_*` — boolean feature flags; default `true` except `FEATURE_BADGES` (false)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
- `WP_REVALIDATE_SECRET` — server-only shared secret for `POST /api/revalidate`, the
  endpoint WordPress calls to purge a cache tag the moment an editor saves. Must match
  the value configured in the WP plugin. **Unset is a valid configuration and locks the
  endpoint** — every request is rejected and content refreshes on its own TTL instead;
  it never means "no check". Preview deployments sharing a WordPress instance receive
  the same purge calls, which is harmless: each purges only its own cache. Contract in
  `API_REFERENCE.md`

## Architecture

### Route groups

All pages live under `src/app/[locale]/`. i18n uses next-intl with `localePrefix: "as-needed"` — URLs are clean (no `/en/` prefix) while the structure supports future locales.

| Group         | Paths                                      | Notes                                       |
| ------------- | ------------------------------------------ | ------------------------------------------- |
| `(marketing)` | `/`                                        | Public, SSR                                 |
| `(auth)`      | `/login`, `/register`, `/forgot-password`  | Bounces authenticated users to `/dashboard` |
| `(student)`   | `/dashboard`, `/courses`, `/profile`, etc. | Protected, uses `SiteShell` layout          |
| `(learn)`     | `/learn/[courseId]/[unitId]`               | Full-screen unit player                     |

Proxy (`src/proxy.ts`, formerly `middleware.ts` — renamed per Next.js 16) reads the non-httpOnly `user_logged_in=1` cookie as the auth signal. It runs next-intl for all non-protected, non-auth routes. Runs on the `nodejs` runtime (proxy does not support edge).

### BFF security model

Tokens never reach browser JS. Flow:

```
Browser
  ↓ credentials:include
/api/* BFF routes (src/app/api/)
  ↓ reads httpOnly access_token cookie
proxyToWP()  (src/lib/api/bff.ts)
  ↓ Authorization: Bearer — auto-refreshes on 401
WordPress REST API  /wp-json/lms-backend/v1/*
```

- **Login flow**: browser → `/api/auth/login` → WP → sets `access_token` + `refresh_token` as httpOnly cookies → returns only `{ user }` to browser.
- **Client mutations**: use `bffJson()` from `src/lib/api/bff-client.ts` (sets `credentials: "include"`).
- **Server Components**: use `serverApi` / `serverFetch` from `src/lib/api/server.ts` (native fetch, Next.js cache tags).
- **Zustand `useAuthStore`**: stores only `{ user }` (display data) in localStorage under `lms-auth`. No tokens.

### Data flow (client-side reads)

```
UI component
  → hooks/ (TanStack Query useQuery/useMutation)
    → services/ (src/lib/services/)
      → api/client.ts (Axios singleton)
        → /api/wp/[...path] in the browser  ·  direct to WP on the server
```

**The browser never calls the CMS directly.** The CMS is on a separate origin
behind bot protection that answers an unrecognised caller with a challenge page
— HTTP 202, `text/html`, no `Access-Control-Allow-Origin` — which kills any
cross-origin XHR as a CORS error whatever the endpoint would have returned, and
can hit any path at any time. So `api/client.ts` sets its base URL to `/api/wp`
in the browser, and `src/app/api/wp/[...path]/route.ts` makes the read
server-side where CORS does not apply. Services and hooks are unchanged by this:
the namespace lives in the `endpoints.ts` string, so both branches compose the
same path.

That route is `GET` only and allowlists three read namespaces —
`lms-backend/v1`, `wp/v2`, `swca/v1`. It passes `requiresAuth: false`, so a
signed-out visitor gets public content while a signed-in user's token is still
forwarded and refreshed. Credential-free responses are CDN-cacheable for 300s
with `Vary: Cookie`; credentialed ones are `no-store`.

**Server Components still read direct**, using the same Axios singleton with the
absolute base URL (`pages.ts`, `products.ts`, `bundles.ts`) or `serverApi` /
`serverFetch`. Nothing about SSR changed.

Authenticated mutations, cart traffic and the WooCommerce namespaces
(`wc/store/v1`, `wc/v3`) keep their own dedicated `/api/*` BFF routes — they
carry Cart-Token and Basic-auth handling the read proxy does not implement, and
are deliberately excluded from its allowlist.
`GET /api/courses/[id]/curriculum` also stays: it is cache-tagged and auth-aware.

> **Infrastructure follow-up, not fixed in this repo.** `/wp-json/*` should be
> excluded from the CMS host's SiteGround Anti-Bot System, or the deployment's
> egress IPs allowlisted. The read proxy only moves the challenge off the
> browser and onto the server; if that server IP is ever challenged, SSR and the
> proxy fail together and no amount of proxying helps.

### Endpoint namespaces

`src/lib/api/endpoints.ts` is the single source for all URL strings:

- `lms` → `/lms-backend/v1` (custom LMS plugin)
- `wp` → `/wp/v2` (native WordPress REST)
- `swca` → `/swca/v1` (legacy certificate verification only)

### Services and normalization

Services in `src/lib/services/` are the only layer that translates WP-shaped data to domain types (`src/types/`). The WP API has inconsistent field names across versions (e.g. `total_students` vs `students_count`, `average_rating` vs `rating`, `duration_seconds` vs `duration`). Services normalize these; **do not add field-aliasing logic in components**.

`decodeEntities()` from `src/lib/api/parsers.ts` must be called on any string that comes from a WP `rendered` object (title/excerpt fields). `renderedOrString()` in `courses.ts` shows the pattern.

`paginate()` from the same file handles both WP header pagination (`X-WP-Total`) and envelope pagination (`{ items, total, total_pages }`).

### Query keys

Always use constants from `src/lib/utils/query-keys.ts`. Never inline strings in `useQuery`/`useMutation` calls.

### Site settings and feature flags

Site name, logo, feature flags are fetched server-side from `GET /lms-backend/v1/settings` and injected via `SiteSettingsProvider`. In client components use `useSiteSettings()` / `useFeatureFlag()`. Env vars (`NEXT_PUBLIC_FEATURE_*`) take precedence over the settings endpoint.

### Error handling

All Axios errors are converted to `ApiError` (`src/lib/api/error.ts`) by the response interceptor. Catch as `ApiError`; check `.code` for WP error codes (e.g. `lms_auth_failed`) and `.status` for HTTP status.

## Key files

| File                                | Purpose                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/lib/api/endpoints.ts`          | All WP endpoint URLs                                                                                    |
| `src/lib/api/cache-tags.ts`         | Cache-tag registry — the tags `serverFetch` uses and `POST /api/revalidate` (WP purge endpoint) accepts |
| `src/app/api/wp/[...path]/route.ts` | Same-origin read proxy — every browser WordPress read goes through it                                   |
| `src/lib/api/bff.ts`                | `proxyToWP()` — server-side proxy with token refresh                                                    |
| `src/lib/api/bff-client.ts`         | `bffJson()` — client helper for BFF route calls                                                         |
| `src/lib/api/client.ts`             | Axios singleton (direct-to-WP, public reads)                                                            |
| `src/lib/api/parsers.ts`            | `paginate()` + `decodeEntities()`                                                                       |
| `src/lib/api/server.ts`             | Server Component fetch utilities                                                                        |
| `src/lib/env.ts`                    | All env var definitions and `getServerWpJsonBase()`                                                     |
| `src/lib/utils/query-keys.ts`       | Centralized TanStack Query keys                                                                         |
| `src/lib/stores/auth.store.ts`      | Zustand auth store (user display data only)                                                             |
| `src/proxy.ts`                      | Route guards + next-intl integration (Next 16 proxy)                                                    |

## Conventions

- **Path alias**: `@/` → `src/`
- **Class merging**: `cn(...)` from `src/lib/utils/cn.ts` for all Tailwind composition
- **`next/image` hosts**: `next.config.mjs` auto-adds `NEXT_PUBLIC_WP_API_URL`'s hostname; add other CDN hosts there manually
- **Sentry**: configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

## API reference

`API_REFERENCE.md` is the authoritative contract for the `lms-backend/v1` backend plugin. Consult it when wiring new endpoints.
