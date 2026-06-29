# B2B Dashboard Integration — Progress Tracker

Companion to [`B2B_DASHBOARD_INTEGRATION_PLAN.md`](./B2B_DASHBOARD_INTEGRATION_PLAN.md).
Keep feature IDs (B0–B7) in sync with the plan.

## Status legend

- [ ] Not started
- [~] In progress / partial
- [x] Done
- [?] Built but **needs end-to-end verification** (structure exists; UX/states/contract not yet audited)
- [!] Blocked / needs decision

> **Audit note:** items marked `[x]` are confirmed present in code. Items marked `[?]` exist
> structurally (service method + hook + BFF route + page) but have **not** been verified for
> loading/empty/error states, pagination, or live payload-shape correctness. Convert `[?]`→`[x]`
> only after a real run against a seeded WP + `wp-lms-b2b-rest-api`.

---

## Snapshot

| Layer                                                   | State                                              |
| ------------------------------------------------------- | -------------------------------------------------- |
| BFF proxy routes (`/api/business/**`)                   | **42 routes** — all `proxyToB2B` → `lms-b2b/v1` ✅ |
| Client service (`businessDashboardService`)             | **~50 methods**, 472 LOC ✅                        |
| React Query hooks (`useBusinessDashboard.ts`)           | **~40 hooks**, 362 LOC ✅                          |
| Types (`business-dashboard.ts` + `business-pricing.ts`) | present ✅                                         |
| Pages (`(business)/business-dashboard/**`)              | **~14 route segments** scaffolded ✅               |
| Auth (JWT Bearer + refresh, httpOnly cookies)           | wired in `bff.ts` ✅                               |
| **End-to-end verification per surface**                 | **pending** ❓                                     |

Backend (`wp-lms-b2b-rest-api`) readiness: Phase 1 **8/10**, contract **117/117** standalone. Pending backend: CORS
origins (deploy), Postman collection; 4 controllers still proxy-only. See `wp-lms-b2b-rest-api/PROGRESS.md`.

---

## B0 — Config & deploy wiring

- [x] `env.ts`: `B2B_NAMESPACE` (`NEXT_PUBLIC_B2B_NAMESPACE` → `lms-b2b/v1`) + `WP_API_URL`
- [x] `proxyToB2B()` helper in `bff.ts` (namespace override over `proxyToWP`)
- [?] `/api/business/status` public gate (`requiresAuth:false`) — exists; verify graceful "C inactive" UX
- [!] **Prod CORS**: register this origin in `wp-lms-backend-rest-api` `LMS_BACKEND_API_ALLOWED_ORIGINS` (deploy task, backend)
- [ ] Confirm env values per environment (local / staging / prod)

## B1 — Auth, route guard & role gate

- [x] JWT in httpOnly cookies; Bearer attach + **refresh-on-401** (`tryRefresh`) in `bff.ts`
- [x] Auth BFF flows present: login, logout, logout-all, register, forgot-password, reset-password
- [?] `(business)` route group **auth guard** (unauth → login) — verify middleware/layout actually blocks
- [!] **Role gate** (only `b2b_customer` + managers; exclude learners) — confirm enforced server-side, not just nav hiding
- [?] Logout clears React Query cache + cookies — verify no stale business data after switch-user

## B2 — Read surfaces (per-page verification)

Structure exists for all; each needs loading/empty/error + pagination audit.

- [?] Overview / summary (`page.tsx` ← `useBusinessSummary`)
- [?] Profile (`profile` ← `useBusinessProfile`)
- [?] Learners list + detail + learner courses (`learners`, `learners/[id]` ← `useBusinessLearners`, `useBusinessLearner`, `useBusinessLearnerCourses`)
- [?] Managers (`managers` ← `useBusinessManagers`)
- [?] Courses + available + assign (`courses`, `courses/available`, `courses/assign` ← `useBusinessCourses`, `useBusinessAvailableLearners`, `useBusinessCourseLearners`)
- [?] Assignments + assignment list (`learners/assignments` ← `useBusinessAssignments`, `useBusinessAssignmentList`)
- [?] Licences — balance / courses / pricing (`licences` ← `useBusinessLicenceBalance`, `useBusinessLicenceCourses`, `useBusinessLicencePricing`)
- [?] Subscriptions + summary + assigned (`subscriptions` ← `useBusinessSubscriptionSummary`, `useBusinessSubscriptionAssigned`)
- [?] Credits — transactions / product / discount-tiers (`credits/transactions` ← `useBusinessCreditTransactions`, `useBusinessCreditProduct`, `useBusinessCreditDiscountTiers`)
- [?] Reports — courses / members / certificates (`analytics` ← `useBusinessReportCourses`, `useBusinessReportMembers`, `useBusinessReportCertificates`)
- [?] Certificates + per-course (`certificates`, `certificates/[courseId]` ← `useBusinessCertificates`)
- [?] Orders (`orders` ← `useBusinessOrders`)
- [?] Pricing page (`pricing` ← `useBusinessPricing`)
- [?] Reviews (`reviews` ← `useBusinessReviewHas`)
- [?] System type read (`useBusinessSystemType`)

## B3 — Write surfaces (mutations)

All mutation hooks exist; verify invalidation + error-toast + success UX:

- [?] `useAddBusinessLearner`, `useUpdateBusinessLearner`, `useCheckLearnerEmail`
- [?] `useConvertBusinessLearnerRole`
- [?] `useAssignBusinessCourse`
- [?] `useUpdateBusinessProfile`
- [?] `useGenerateBusinessCertificate`
- [?] `usePurchaseBusinessCredits`
- [?] Licence checkout + **subscription checkout** (`licenceCheckout`, `licenceSubscriptionCheckout`, `licenceQuote` in service)
- [?] `useSubmitBusinessReview`
- [?] `useSwitchBusinessSystem`
- [?] `useAddBusinessManager`

## B4 — Dual access model (credits ⇄ licences/subscriptions)

- [?] `useBusinessSystemType` read exists; `useSwitchBusinessSystem` exists
- [ ] Conditional render: show credits **xor** licences UI per `system-type` (verify no double purchase paths)
- [ ] Isolate credits UI for clean future removal (backend credit-removal track)

## B5 — i18n, nav, polish

- [ ] Audit business strings → locale dictionary (no hardcoded copy)
- [ ] `[locale]` switching verified inside dashboard
- [ ] Nav / breadcrumbs / active-state pass
- [ ] Skeleton + empty-state consistency with marketing surface

## B6 — Observability & errors

- [x] Envelope `{error,code}` normalization in `bff.ts` (`success:false` → `{error,code}` + status)
- [ ] Client error→toast mapping by `code`; 401→login, 403→permission page (verify wired uniformly)
- [ ] Sentry breadcrumbs on BFF `401`/`502`

## B7 — Tests

- [ ] Flow tests: assign course, add learner, licence + subscription checkout
- [ ] Contract fixtures mirroring `lms-b2b/v1` payloads (`src/__tests__/fixtures`)

---

## Backend contracts (reference — `lms-b2b/v1`, `wp-lms-b2b-rest-api`)

All routes JWT-gated, `{success,data}`. `→` = proxies to legacy `b2b-dashboard/v1` internally.

| Controller     | Routes (selected)                                                                                                                                                        | Direct / proxy      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Team           | `/team` GET·POST · `/team/{id}` GET·PATCH · `/team/check-email` · `/team/{id}/convert-role`                                                                              | direct              |
| Business       | `/businesses` · `/businesses/current` · `/businesses/{id}` GET·PATCH                                                                                                     | direct              |
| Course         | `/courses` · `/courses/assign` · `/courses/assignments` · `/courses/{id}/learners`                                                                                       | direct              |
| Licence        | `/licences/courses` · `/balance` · `/balance/{courseId}` · `/pricing` · `/pricing/calculate`                                                                             | direct              |
| Credit         | `/credits/balance` · `/credits/transactions`                                                                                                                             | direct              |
| Reports        | `/reports/summary` · `/courses` · `/members` · `/certificates`                                                                                                           | direct              |
| Certificate    | `/certificates`                                                                                                                                                          | → `/certificate`    |
| Subscription   | `/business/system-type` · `/business/switch-system` · `/businesses/subscriptions` · `/summary` · `/assigned` · `/assign-user` · `/{id}/status` · `/{id}/seats/{seat_id}` | **proxy-only**      |
| Manager        | `/managers` GET·POST · `/managers/{id}` GET·PATCH·DELETE · `/managers/{id}/status` · `/permissions/*`                                                                    | **proxy-only**      |
| Reviews        | `/reviews/has` · `/reviews` POST                                                                                                                                         | **proxy-only**      |
| CourseCategory | `/course-categories/excluded` GET·POST                                                                                                                                   | **proxy-only**      |
| Theme          | `/settings/theme`                                                                                                                                                        | → `/settings/theme` |
| Utility        | `/health`                                                                                                                                                                | self-report         |

> Some service methods (e.g. `creditProduct`, `purchaseCredits`, `creditDiscountTiers`,
> `subscriptionAssigned`) map to routes still being directized in C — they work via the proxy.
> Treat the contract as stable regardless.

---

## Changelog

| Date       | Item                         | Status | Notes                                                                                                    |
| ---------- | ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| 2026-06-28 | Plan + progress created      | x      | Headless B2B dashboard surface; architecture decision documented (separate `wp-lms-b2b-rest-api` plugin) |
| 2026-06-28 | Inventory audit              | x      | 42 BFF routes, ~50 service methods, ~40 hooks, ~14 pages confirmed present                               |
| 2026-06-28 | Per-surface E2E verification | ❓     | Bulk of remaining work — convert `[?]`→`[x]` against seeded WP + `wp-lms-b2b-rest-api`                   |
