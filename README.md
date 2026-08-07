# tx-headless-frontend

Headless LMS frontend — Next.js 14 App Router + WordPress backend (`lms-backend-rest-api` plugin).

## Tech stack

| Concern    | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 14 (App Router)                                     |
| UI         | Tailwind CSS + shadcn/ui components                         |
| State      | Zustand (auth), TanStack Query (server state)               |
| Forms      | React Hook Form + Zod                                       |
| i18n       | next-intl (English only at launch; `en` default locale)     |
| Testing    | Vitest + RTL (unit) · Playwright (E2E)                      |
| Monitoring | Sentry (`@sentry/nextjs`)                                   |
| Auth       | httpOnly cookies via BFF proxy — tokens never in browser JS |

---

## Quick start

```bash
cp .env.example .env.local   # fill in NEXT_PUBLIC_WP_API_URL at minimum
npm install
npm run dev                  # http://localhost:3000
```

Requires a running WordPress site with the [`lms-backend-rest-api`](https://github.com/Codezen-technology/wp-lms-backend-rest-api) plugin activated.

---

## Environment variables

See `.env.example` for all variables with comments. Required variables:

| Variable                 | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `NEXT_PUBLIC_WP_API_URL` | Base URL of the WordPress install (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL`   | Public URL of this Next.js app                        |

Optional but important:

| Variable                             | Description                                               |
| ------------------------------------ | --------------------------------------------------------- |
| `WP_API_URL`                         | Server-only WP URL (hides internal host from the browser) |
| `NEXT_PUBLIC_SENTRY_DSN`             | Sentry DSN for client error tracking                      |
| `SENTRY_DSN`                         | Sentry DSN for server/edge error tracking                 |
| `WP_REVALIDATE_SECRET`               | Shared secret for on-demand ISR via `/api/revalidate`     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe key for Phase 3 commerce                           |

---

## Architecture — BFF Security Model

### Problem solved

Storing JWT tokens in `localStorage` exposes them to XSS. Storing them in non-HttpOnly cookies exposes them to the same risk.

### Solution: Backend-for-Frontend (BFF) proxy

```
Browser (React)
    │
    │  POST /api/auth/login  (credentials in JSON body)
    ▼
Next.js API Route (Node.js, runs on the server)
    │
    │  Forward credentials to WordPress /lms-backend/v1/auth/login
    │  ← WordPress returns { access_token, refresh_token, user }
    │
    │  Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax
    │  Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax
    │  Set-Cookie: user_logged_in=1; Secure; SameSite=Lax   ← client-readable awareness cookie
    │
    ▼  { user } (no tokens)
Browser
```

All subsequent authenticated requests go through `/api/*` BFF routes. The BFF reads the `access_token` cookie (invisible to JavaScript), appends it as `Authorization: Bearer …`, and proxies to WordPress. On `401`, the BFF automatically uses the `refresh_token` to obtain a new `access_token` and retries once.

### Key files

| File                                      | Role                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `src/lib/api/bff.ts`                      | `proxyToWP()` — server proxy with auto-refresh                 |
| `src/app/api/auth/*/route.ts`             | Login, register, logout, forgot-password, reset-password       |
| `src/app/api/users/me/*/route.ts`         | Profile, enrollments, progress                                 |
| `src/app/api/courses/[id]/*/route.ts`     | Enroll, reviews                                                |
| `src/app/api/units/[id]/*/route.ts`       | Unit content, complete                                         |
| `src/app/api/quizzes/[id]/*/route.ts`     | Quiz questions, start, submit, results                         |
| `src/app/api/assignments/[id]/*/route.ts` | Assignment detail, submit, status                              |
| `src/middleware.ts`                       | Auth guard (reads `user_logged_in` cookie only)                |
| `src/lib/api/bff-client.ts`               | Client helper for calling `/api/*` with `credentials: include` |

### What never touches client JavaScript

- `access_token`
- `refresh_token`

### What the client sees

- `user_logged_in=1` — a lightweight awareness cookie so middleware can redirect without JS
- Zustand `auth.store` — stores `{ user }` (display info only), persisted to `localStorage`

---

## Route structure

```
src/app/
├── [locale]/                    ← next-intl locale segment (en only at launch)
│   ├── layout.tsx               ← NextIntlClientProvider
│   ├── (marketing)/             ← public, SSR/ISR (home, courses list, blog, etc.)
│   ├── (auth)/                  ← login, register, forgot/reset password
│   ├── (student)/               ← dashboard, profile, enrolled courses
│   └── (learn)/                 ← full-screen unit player
├── api/                         ← BFF route handlers (outside [locale])
├── sitemap.ts                   ← dynamic sitemap from WP API
├── robots.ts
└── layout.tsx                   ← root layout (fonts, metadata, SiteSettingsProvider)
```

---

## Server fetching (RSC)

Use `serverFetch` / `serverApi` from `src/lib/api/server.ts` in Server Components. This uses native `fetch` (not axios) so Next.js caching applies.

```ts
import { serverApi } from "@/lib/api/server";

// In a Server Component:
const courses = await serverApi.courses.list({ per_page: 12 });
```

Tag every fetch so on-demand revalidation is precise:

```ts
await serverFetch("/lms-backend/v1/courses/42", {
  revalidate: 600,
  tags: ["course:42", "courses:list"],
});
```

The `/api/revalidate` route (to be added in Phase 1 SEO work) calls `revalidateTag()` when WordPress saves a post.

---

## Settings / white-label

Site settings (`name`, `logo`, `colors`, feature flags, contact info) are fetched server-side from `GET /lms-backend/v1/settings` and injected via `SiteSettingsProvider`. If the endpoint is unavailable, the app falls back to environment variables (see `.env.example`).

```ts
// In any Client Component:
import { useSiteSettings, useFeatureFlag } from "@/components/providers/site-settings-provider";

const settings = useSiteSettings();
const hasBlog = useFeatureFlag("blog");
```

---

## i18n

English-only at launch. Structure supports future locale expansion without URL changes (uses `localePrefix: "as-needed"` so `/courses` stays `/courses`, not `/en/courses`).

To add a locale:

1. Add to `src/i18n/routing.ts` `locales` array
2. Create `src/i18n/messages/{locale}.json`

---

## Testing

```bash
npm test              # Vitest unit tests
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E (requires dev server)
```

CI gate: typecheck → lint → unit tests → build.

---

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run typecheck     # TypeScript type check
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier
```

---

## Phase 0 checklist

All Phase 0 items are complete. See [PROGRESS.md](./PROGRESS.md) for detailed status.
