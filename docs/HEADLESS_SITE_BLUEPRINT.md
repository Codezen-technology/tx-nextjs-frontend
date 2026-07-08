# Headless Site Blueprint

A reusable specification for spinning up **new headless frontends** (Next.js over a WordPress/REST backend) from the same foundation as `tx-headless-frontend`.

This document defines what **every** headless site needs, split into three tiers:

| Tier         | Meaning                                        | Rule                                                                  |
| ------------ | ---------------------------------------------- | --------------------------------------------------------------------- |
| **Core**     | Required by every site, no exceptions          | Always build. Copy from template.                                     |
| **Common**   | Needed by most content/commerce sites          | Include unless the site clearly has no use for it.                    |
| **Vertical** | Domain-specific (LMS, store, directory, SaaS…) | Build per project. Keep isolated behind a route group + feature flag. |

> **Goal:** a new site should reuse ~70% of the codebase (infra, auth, layout, SEO, forms, error handling) and only add its vertical module.

---

## Reference stack

Locked stack, shared across all sites. Do not diverge without a platform-level decision.

| Concern         | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Framework       | Next.js 16 App Router, React 19                              |
| Language        | TypeScript (strict)                                          |
| Package manager | pnpm                                                         |
| Styling         | Tailwind CSS 3 + `cn()` merge helper                         |
| UI primitives   | Radix UI + `class-variance-authority`                        |
| Server state    | TanStack Query 5                                             |
| Client state    | Zustand 4 (display data only — never tokens)                 |
| Forms           | react-hook-form + Zod resolvers                              |
| i18n            | next-intl (`localePrefix: "as-needed"`)                      |
| Theming         | next-themes                                                  |
| Payments        | Stripe (when commerce is enabled)                            |
| Monitoring      | Sentry                                                       |
| Testing         | Vitest + MSW (unit), Playwright (E2E)                        |
| Backend         | WordPress REST API, versioned namespaces (`site-backend/v1`) |

---

## 1. Core — every site

### 1.1 Project foundation

- [ ] pnpm workspace, `@/` → `src/` path alias
- [ ] `src/lib/env.ts` — single typed env surface with defaults + `boolFlag()` for feature flags. **All env reads go through this file; never `process.env` in components.**
- [ ] `.env.example` documenting every var (public vs server-only split)
- [ ] ESLint + Prettier + `prettier-plugin-tailwindcss`
- [ ] Husky pre-commit → lint-staged (lint + format on staged files)
- [ ] `CLAUDE.md` / `AGENTS.md` per repo with architecture notes

**Required env (baseline):**

```
NEXT_PUBLIC_WP_API_URL        # backend base, no trailing slash, no /wp-json
NEXT_PUBLIC_SITE_URL          # this app's public URL
NEXT_PUBLIC_API_NAMESPACE     # backend REST namespace, defaults per site
WP_API_URL                    # server-only override (keeps origin out of browser bundle)
WP_REVALIDATE_SECRET          # on-demand ISR
NEXT_PUBLIC_SENTRY_DSN
```

### 1.2 BFF security model (mandatory)

Tokens never reach browser JavaScript. Identical on every site.

```
Browser  ──credentials:include──▶  /api/* BFF routes
                                        │ reads httpOnly access_token cookie
                                        ▼
                                   proxyToWP()  ── Bearer, auto-refresh on 401 ──▶  WP REST
```

- [ ] `src/lib/api/bff.ts` — `proxyToWP()` server proxy, reads httpOnly cookie, appends Bearer, auto-refreshes on 401
- [ ] `src/lib/api/bff-client.ts` — `bffJson()` client helper (`credentials: "include"`)
- [ ] `src/lib/api/client.ts` — Axios singleton for **public** reads (direct to WP, no auth)
- [ ] `src/lib/api/server.ts` — Server Component fetch with Next.js cache tags
- [ ] `src/lib/api/endpoints.ts` — **single source** for all URL strings, grouped by namespace
- [ ] `src/lib/api/error.ts` — `ApiError` class; interceptor converts all errors to it (check `.code` / `.status`)
- [ ] `src/lib/api/parsers.ts` — `paginate()` (WP headers **and** `{items,total}` envelope) + `decodeEntities()` (WP renders HTML entities)
- [ ] `src/lib/api/auth-cookies.ts` — httpOnly cookie set/clear helpers

### 1.3 Auth

- [ ] Route group `(auth)`: `/login`, `/register`, `/forgot-password`, `/reset-password`
- [ ] BFF routes: `/api/auth/{login,register,logout,logout-all,forgot-password,reset-password}`
- [ ] Login sets httpOnly `access_token` + `refresh_token`, returns only `{ user }` to browser
- [ ] Non-httpOnly `user_logged_in=1` cookie as the middleware auth signal
- [ ] Zustand `auth.store` — `{ user }` display data in localStorage, **no tokens**
- [ ] `(auth)` layout bounces authenticated users to the app home
- [ ] Zod schemas in `src/lib/schemas/auth.ts`
- [ ] Social auth buttons component (optional providers behind flags)

### 1.4 Routing, middleware, layout

- [ ] `src/app/[locale]/` root with next-intl
- [ ] `src/proxy.ts` (Next 16 proxy, `nodejs` runtime) — route guards read `user_logged_in`, run next-intl on public routes
- [ ] Route groups: `(marketing)` public, `(auth)`, `(app)`/`(student)` protected
- [ ] Layout shell: `header` + `footer` + `site-shell`, plus a `minimal-shell` for focused flows (checkout, player)
- [ ] `profile-menu`, `theme-toggle`, mobile nav / `sheet`
- [ ] Root `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx` conventions

### 1.5 Site settings + theming (multi-tenant)

This is what makes one codebase serve many sites.

- [ ] `GET /{namespace}/settings` fetched server-side → `SiteSettingsProvider`
- [ ] `useSiteSettings()` / `useFeatureFlag()` client hooks
- [ ] Env vars (`NEXT_PUBLIC_FEATURE_*`, `SITE_NAME`, `LOGO_URL`, `PRIMARY_COLOR`, `CURRENCY`, `LOCALE`) **override** the settings endpoint
- [ ] Dynamic theme colors injected via CSS variables (`src/lib/utils/color.ts`)
- [ ] `next.config.mjs` auto-allows the WP hostname for `next/image`

### 1.6 SEO (non-negotiable for public pages)

- [ ] `src/lib/seo/server.ts` — `fetchRankMathSeo()` + `buildPageMetadata()`
- [ ] Every public server page exports `generateMetadata` with title/description/canonical fallbacks
- [ ] `generateStaticParams` on every dynamic `[slug]` page
- [ ] JSON-LD structured data injected in JSX
- [ ] `app/sitemap.ts`, `app/robots.ts`
- [ ] Canonical + JSON-LD rewritten to the headless domain

### 1.7 UI kit

`src/components/ui/` — the shared primitives, identical across sites:

`button` · `input` · `label` · `form-field` · `card` · `dialog` · `sheet` · `dropdown-menu` · `select` · `tabs` · `accordion` · `badge` · `avatar` · `pagination` · `skeleton` · `progress` · `empty-state` · `safe-image` · `parsed-html`

### 1.8 Forms engine

- [ ] Generic form renderer (Gravity Forms–style or schema-driven) — `components/forms/`
- [ ] Field library `components/gf-fields/`: text, textarea, email, phone, number, select, radio, checkbox, date, address, html, section
- [ ] react-hook-form + Zod validation, server-side submit via BFF

### 1.9 Contact / support

- [ ] `/contact-us` page + `contact-form` + `/api/contact` route
- [ ] Optional support/ticketing wizard (issue-type picker → form → success)

### 1.10 Legal + static pages

- [ ] `/privacy-policy`, `/terms-and-conditions`, `/about`, `/help`
- [ ] Catch-all `[slug]` page pulling WP pages via `pages.server.ts` (CMS-managed static pages)
- [ ] `legal-page` render component

### 1.11 Search

- [ ] `/search` page + `/api/search/suggestions` (typeahead)
- [ ] Debounced client hook (`useDebounce`)

### 1.12 Error handling + observability

- [ ] Sentry client/server/edge configs + `instrumentation.ts`
- [ ] Global `error.tsx` + per-route error banners
- [ ] `ApiError` surfaced with friendly messaging + toast (`sonner`)

### 1.13 Testing

- [ ] Vitest + MSW: services, hooks, parsers, forms, utils
- [ ] Playwright E2E: auth flow + one critical vertical flow + smoke
- [ ] `__tests__/mocks/handlers.ts`, fixtures, `test-utils.tsx`

---

## 2. Common — most content/commerce sites

### 2.1 Blog / news

- [ ] `/blog`, `/blog/[slug]` (SSR/ISR)
- [ ] `blog.server.ts` service, blog cards, post sidebar, TOC (`utils/toc.ts`)
- [ ] Feature flag `FEATURE_BLOG`

### 2.2 E-commerce (route group `(shop)`)

Include when the site sells anything.

- [ ] Cart: `/cart`, Zustand `cart.store`, `/api/cart/*` (items, coupon, checkout), mini-cart / cart-drawer
- [ ] Checkout: `/checkout`, `/checkout/pay`, billing form, payment method selector, order summary, Stripe elements
- [ ] Orders: `/order-confirmation/[orderId]`, `/api/orders/*`
- [ ] Products/catalog + product cards + add-to-cart
- [ ] Coupons, related/upsell, buy-now store
- [ ] Server-only Stripe (`lib/stripe.ts`) + webhook route with signature verification
- [ ] WooCommerce consumer keys server-only (`WC_CONSUMER_KEY/SECRET`)

### 2.3 User dashboard (route group `(student)`/`(app)`)

- [ ] `/dashboard` shell + sidebar + nav
- [ ] `/dashboard/profile` (view/edit, avatar upload via `/api/users/me/avatar`)
- [ ] `/dashboard/my-orders`
- [ ] `/api/users/me`, `/api/users/me/*`
- [ ] Dashboard theme provider (per-user or per-tenant theming)

### 2.4 Reviews / ratings

- [ ] Reviews page + submit modal + milestones hook
- [ ] Feature flag `FEATURE_REVIEWS`

### 2.5 Newsletter

- [ ] Signup component + provider integration (`NEWSLETTER_PROVIDER_API_KEY`, server-only)

---

## 3. Vertical — per site

Keep each vertical isolated behind its own route group + feature flag so the core stays clean. The current LMS vertical is the reference implementation:

| Vertical                    | Route groups                          | Key modules                                                                                                                                                                                        |
| --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LMS** (reference)         | `(learn)`, `(business)`, course pages | Course catalog/detail, curriculum, unit/quiz/assignment player (Vimeo), enrollment, progress tracking, certificates, B2B business dashboard (licences, learners, managers, credits), subscriptions |
| **Store**                   | `(shop)` heavy                        | Product variants, inventory, wishlist, category/facet filtering                                                                                                                                    |
| **Directory / marketplace** | `(listings)`                          | Listing CRUD, search facets, maps, vendor profiles                                                                                                                                                 |
| **SaaS / portal**           | `(app)`                               | Billing/subscriptions, team management, usage metering, admin console                                                                                                                              |

**Rules for a new vertical:**

1. New route group under `src/app/[locale]/`
2. Own `services/`, `hooks/`, `types/`, `components/<vertical>/`
3. Reuse core UI kit, forms, auth, BFF, SEO — do not fork them
4. Gate behind a feature flag in `env.ts` + `/settings`
5. Add one Playwright E2E covering the critical path

---

## 4. Backend contract (shared across sites)

Every backend plugin exposes the same response envelope so `parsers.ts` works unchanged:

```json
{ "success": true,  "data": { ... } }
{ "success": true,  "data": { "items": [...], "total": 100, "page": 1, "per_page": 10, "totalPages": 10 } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

- Versioned namespace per site (`site-backend/v1`)
- JWT auth (`access` + `refresh`), `/health` + `/version` utility routes
- `/settings` endpoint driving site identity + feature flags
- Thin controllers → models hold business logic
- Server-to-server shared secret (`WP_INTERNAL_SECRET`) for internal calls

---

## 5. New-site checklist (fast path)

1. Clone template → rename, set `env.ts` defaults + `.env.local`
2. Point `NEXT_PUBLIC_WP_API_URL` + namespace at the new backend
3. Configure `/settings`: name, logo, colors, feature flags
4. Toggle feature flags — disable modules the site doesn't use
5. Wire endpoints in `endpoints.ts`, add services + types for the vertical
6. Build the vertical route group + components
7. SEO pass: `generateMetadata` + `generateStaticParams` + JSON-LD on every public page
8. Tests: auth E2E + vertical E2E + service unit tests
9. Sentry DSN, deploy config, ISR revalidation secret
10. Accessibility + Lighthouse pass before launch

---

## 6. What NOT to duplicate

- Do not fork the UI kit, BFF layer, auth, or SEO helpers per site — extract shared changes upstream.
- Do not put field-aliasing / WP-shape normalization in components — that lives in `services/` only.
- Do not inline query-key strings — use `src/lib/utils/query-keys.ts`.
- Do not read `process.env` outside `env.ts`.
- Do not store tokens anywhere reachable by browser JS.
