# B2B Dashboard Integration Plan — headless frontend

> Wires the `(business)/business-dashboard` surface of `tx-headless-frontend` to the
> **`lms-b2b/v1`** REST facade served by the **`wp-lms-b2b-rest-api`** plugin.
> Companion progress tracker: [`B2B_DASHBOARD_INTEGRATION_PROGRESS.md`](./B2B_DASHBOARD_INTEGRATION_PROGRESS.md).
>
> This is the **business** counterpart to [`FRONTEND_INTEGRATION_PLAN.md`](./FRONTEND_INTEGRATION_PLAN.md)
> (which covers the marketing/shop surface: bundles, promo pages, bulk tiers, blog).
>
> Backend refs: `wp-lms-b2b-rest-api/PLAN.md`, `…/PROGRESS.md`, `…/ARCHITECTURE.md`,
> `…/docs/api-migration-tracking.md`.

---

## Plugins referenced

| Plugin (WP slug)               | Namespace          | Role                                                                                 |
| ------------------------------ | ------------------ | ------------------------------------------------------------------------------------ |
| **`wp-lms-backend-rest-api`**  | `lms-backend/v1`   | Core LMS headless API; global JWT bridge (`determine_current_user`); CORS allow-list |
| **`wplms-business-dashboard`** | `b2b-dashboard/v1` | **Legacy** B2B domain + React SPA + wp-admin UI; cookie + `X-WP-Nonce` auth          |
| **`wp-lms-b2b-rest-api`**      | `lms-b2b/v1`       | **Headless B2B facade** — JWT, `{success,data}` envelope; vendors the legacy domain  |

---

## 0. Architecture decision (settled)

The B2B dashboard is served by a **dedicated REST plugin** (`wp-lms-b2b-rest-api`), not by extending the
legacy `wplms-business-dashboard` SPA plugin. This mirrors the already-shipped core API plugin
(`wp-lms-backend-rest-api`) and is the chosen, implemented path.

| Plugin                                          | Auth           | Envelope         |
| ----------------------------------------------- | -------------- | ---------------- |
| `wp-lms-backend-rest-api` (`lms-backend/v1`)    | JWT Bearer     | `{success,data}` |
| `wplms-business-dashboard` (`b2b-dashboard/v1`) | cookie / nonce | raw              |
| `wp-lms-b2b-rest-api` (`lms-b2b/v1`)            | JWT Bearer     | `{success,data}` |

**Why a separate plugin (not extend `wplms-business-dashboard`):**

- `wplms-business-dashboard` couples REST to a frontend SPA, wp-admin screens, and a hard WPLMS-theme
  dependency — headless must not drag any of that.
- Different auth contract: headless = JWT Bearer + refresh; the SPA = same-origin cookie + nonce.
- Different response contract: headless BFF expects `{success,data}`; `wplms-business-dashboard` returns raw payloads.
- Consistency: `wp-lms-backend-rest-api` already establishes the "one clean JWT REST plugin per consumer
  surface" pattern; `wp-lms-b2b-rest-api` is the B2B instance of it.
- **No logic duplication:** `wp-lms-b2b-rest-api` does not re-implement domain rules. It vendors / delegates
  to `wplms-business-dashboard`'s services (`includes/services`, `subscription/`) and is on a 4-phase path to
  absorb that domain and decommission `wplms-business-dashboard`. The `lms-b2b/v1` contract stays **frozen**
  across all phases, so the frontend never breaks as the backend internals migrate.

The frontend's job: treat `lms-b2b/v1` as the single, stable contract and ignore the backend migration entirely.

---

## 1. Request topology

```
Browser (React Query)
   │  fetch /api/business/*            (same-origin, credentials: include)
   ▼
Next.js BFF route handler  (src/app/api/business/**/route.ts)
   │  proxyToB2B(path)  →  attaches httpOnly access_token as Bearer
   │                       refresh-on-401 via refresh_token
   ▼
WP  lms-b2b/v1/*   (wp-lms-b2b-rest-api)  →  {success,data}  →  BFF unwraps to data
```

- **Token storage:** `access_token` + `refresh_token` in **httpOnly, SameSite=Lax** cookies, set
  by `/api/auth/login`. Browser JS never sees them. (`src/lib/api/bff.ts`)
- **Refresh:** `proxyToWP` retries once on `401` via `tryRefresh()` (`POST lms-backend/v1/auth/refresh`),
  re-sets cookies, replays the request. On failure it clears cookies → client redirects to login.
- **Envelope unwrap:** `success:true` → return `data`; `success:false` → `{error,code}` with status.
- **B2B calls** go through `proxyToB2B()` = `proxyToWP(..., { namespace: env.B2B_NAMESPACE })`.

---

## 2. Conventions (follow these)

- **Data layer (client):** `businessDashboardService` (`src/lib/services/business-dashboard.ts`)
  — one method per endpoint, calls `bffJson<T>("/api/business/…")`. Never fetch WP directly from
  client components; always go through the BFF.
- **BFF routes:** `src/app/api/business/**/route.ts` — thin; one `proxyToB2B(path, opts)` call.
  Reads `requiresAuth:false` only for public endpoints (e.g. `/status`).
- **Hooks:** `src/lib/hooks/useBusinessDashboard.ts` — `@tanstack/react-query`; query keys namespaced
  `["business", …]`; mutations invalidate the relevant keys.
- **Types:** `src/types/business-dashboard.ts` + `business-pricing.ts` (domain types, camelCase-ish to
  match backend payloads).
- **Pages:** App Router under `src/app/[locale]/(business)/business-dashboard/…`; client components for
  interactive dashboards, server components where SEO/SSR adds value (low — this is an authed app).
- **Components:** `src/components/business/…`; reuse `components/ui/*`.
- **i18n:** all user-facing strings via the locale dictionary; `[locale]` segment already in the path.

---

## 3. Feature areas (B-IDs)

Surface is **already scaffolded** end-to-end (service + hooks + BFF + pages). The plan below frames the
work as **completion + hardening + verification**, not greenfield. See PROGRESS for live status.

### B0 — Config & deploy wiring (do first)

- Confirm `NEXT_PUBLIC_B2B_NAMESPACE=lms-b2b/v1` and `NEXT_PUBLIC_WP_API_URL` / `WP_API_URL` per env.
- **CORS (deploy, backend):** register this app's origin in `wp-lms-backend-rest-api`
  `LMS_BACKEND_API_ALLOWED_ORIGINS`. Without it, browser→WP preflight fails in prod. Blocking for non-localhost.
- Confirm `/api/business/status` (public, `requiresAuth:false`) gates the dashboard when
  `wp-lms-b2b-rest-api` is inactive (graceful "B2B unavailable" rather than a hard crash).

### B1 — Auth, route guard & role gate

- `(business)` route group must be **auth-gated**: unauthenticated → redirect to `(auth)/login`.
- **Role gate:** only `b2b_customer` (owner) and B2B managers reach the dashboard; learners must not.
  Enforce in layout/middleware from the session/role, not just by hiding nav.
- Verify refresh-on-401 round-trips (expired access token → silent refresh → success, no logout flash).
- Logout / logout-all clear cookies and React Query cache.

### B2 — Read surfaces (per-page verification)

Each page wired to its hook with **loading / empty / error** states + pagination where the endpoint paginates:
overview (summary), profile, learners (+ detail, courses), managers, courses (+ available, assign targets),
assignments, licences (balance/courses/pricing), subscriptions (+ summary, assigned), credits (transactions,
product, discount-tiers), reports (courses/members/certificates), certificates (+ per-course), orders,
analytics, reviews.

### B3 — Write surfaces (mutations)

Verify each mutation: optimistic where safe, cache invalidation, error toast from envelope `code`:
add/update learner, check-email, convert-role, assign course, update profile, generate certificate,
purchase credits, licence checkout, **subscription checkout**, submit review, switch system, add manager.

### B4 — Dual access model (credits ⇄ licences/subscriptions)

Backend is mid-migration: **credit** system and **licence/subscription V2** coexist, switchable via
`/business/system-type` + `/business/switch-system`. Frontend must:

- Read `system-type` once per session and **conditionally render** credits vs licences UI.
- Not show both purchase paths simultaneously unless the business genuinely has both.
- Treat credits UI as **deprecation-track** (backend plans credit removal) — keep it isolated so it can be deleted cleanly.

### B5 — i18n, nav, polish

- Business dictionary keys for all strings; verify `[locale]` switching inside the dashboard.
- Dashboard nav/breadcrumbs/active-state; deep-link correctness.
- Skeletons + empty illustrations consistent with marketing surface.

### B6 — Observability & errors

- Map envelope `{error,code}` → typed client errors → toasts; 401→login, 403→permission page.
- Sentry breadcrumbs on BFF failures (`502`/`401` from WP).

### B7 — Tests

- Component/integration on key flows (assign course, add learner, checkout).
- Contract alignment: assert frontend types match `lms-b2b/v1` payloads (the backend already ships
  contract tests — mirror the critical shapes in `src/__tests__/fixtures`).

---

## 4. Phasing

1. **B0** env + CORS (unblocks prod).
2. **B1** auth guard + role gate (security-critical; do before exposing any page).
3. **B2 / B3** per-surface read + write verification (the bulk; audit-driven — see PROGRESS checklist).
4. **B4** dual-system conditional rendering.
5. **B5 / B6** i18n, nav, error taxonomy.
6. **B7** tests.

---

## 5. Risks / decisions

- **Contract freeze:** `lms-b2b/v1` is frozen across the backend migration. Code **only** against it; never
  call `b2b-dashboard/v1` directly from the BFF. If a field is missing, request a backend change, don't reach
  into `wplms-business-dashboard`.
- **Proxy-only backend routes:** Subscription, Manager, Reviews, CourseCategory controllers in
  `wp-lms-b2b-rest-api` are still proxy-only (no direct callback yet). Functionally fine; watch for latency /
  payload drift until they're directized.
- **CORS at deploy:** the single most common prod breakage — origin not in `LMS_BACKEND_API_ALLOWED_ORIGINS`.
- **Dual credit/licence model:** avoid hardcoding either; gate on `system-type`. Credits are on the removal track.
- **`wp-lms-b2b-rest-api` standalone vs `wplms-business-dashboard` present:** the facade serves the full
  surface whether the legacy plugin is active or not; the frontend must behave identically in both — verify
  against an environment with `wplms-business-dashboard` deactivated before release.
