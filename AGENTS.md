# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
- `NEXT_PUBLIC_FEATURE_*` — boolean feature flags; default `true` except `FEATURE_BADGES` (false)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `WP_REVALIDATE_SECRET`

## Architecture

### Route groups

All pages live under `src/app/[locale]/`. i18n uses next-intl with `localePrefix: "as-needed"` — URLs are clean (no `/en/` prefix) while the structure supports future locales.

| Group         | Paths                                      | Notes                                       |
| ------------- | ------------------------------------------ | ------------------------------------------- |
| `(marketing)` | `/`                                        | Public, SSR                                 |
| `(auth)`      | `/login`, `/register`, `/forgot-password`  | Bounces authenticated users to `/dashboard` |
| `(student)`   | `/dashboard`, `/courses`, `/profile`, etc. | Protected, uses `SiteShell` layout          |
| `(learn)`     | `/learn/[courseId]/[unitId]`               | Full-screen unit player                     |

Middleware (`src/middleware.ts`) reads the non-httpOnly `user_logged_in=1` cookie as the auth signal. It runs next-intl for all non-protected, non-auth routes.

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
      → api/client.ts (Axios singleton — direct to WP for public reads)
```

Public reads (course list, blog, etc.) go directly from the Axios client to WordPress — no BFF proxy needed. Only authenticated mutations and sensitive reads go through `/api/*` BFF routes.

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

| File                           | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `src/lib/api/endpoints.ts`     | All WP endpoint URLs                                 |
| `src/lib/api/bff.ts`           | `proxyToWP()` — server-side proxy with token refresh |
| `src/lib/api/bff-client.ts`    | `bffJson()` — client helper for BFF route calls      |
| `src/lib/api/client.ts`        | Axios singleton (direct-to-WP, public reads)         |
| `src/lib/api/parsers.ts`       | `paginate()` + `decodeEntities()`                    |
| `src/lib/api/server.ts`        | Server Component fetch utilities                     |
| `src/lib/env.ts`               | All env var definitions and `getServerWpJsonBase()`  |
| `src/lib/utils/query-keys.ts`  | Centralized TanStack Query keys                      |
| `src/lib/stores/auth.store.ts` | Zustand auth store (user display data only)          |
| `src/middleware.ts`            | Route guards + next-intl integration                 |

## Conventions

- **Path alias**: `@/` → `src/`
- **Class merging**: `cn(...)` from `src/lib/utils/cn.ts` for all Tailwind composition
- **`next/image` hosts**: `next.config.mjs` auto-adds `NEXT_PUBLIC_WP_API_URL`'s hostname; add other CDN hosts there manually
- **Sentry**: configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

## API reference

`API_REFERENCE.md` is the authoritative contract for the `lms-backend/v1` backend plugin. Consult it when wiring new endpoints.
