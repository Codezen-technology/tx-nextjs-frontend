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

| Layer                                                   | State                                                |
| ------------------------------------------------------- | ---------------------------------------------------- |
| BFF proxy routes (`/api/business/**`)                   | **52 route files / 58 handlers** → `lms-b2b/v1` ✅   |
| BFF paths sourced from `endpoints.business`             | **all routes** — no hardcoded path strings ✅        |
| Client service (`businessDashboardService`)             | **58 methods** ✅                                    |
| React Query hooks (`useBusinessDashboard.ts`)           | **45 hooks**, all on `queryKeys.business` ✅         |
| Types (`business-dashboard.ts` + `business-pricing.ts`) | present ✅                                           |
| Pages (`(business)/business-dashboard/**`)              | **18 route segments** ✅                             |
| Auth (JWT Bearer + refresh, httpOnly cookies)           | wired in `bff.ts` ✅                                 |
| Unit tests for business surfaces                        | `business-learners`, `business-csv` (17 cases) ✅    |
| **Parity with the legacy WP dashboard**                 | **partial** — 7 clusters still blocked on backend ❗ |
| **End-to-end verification per surface**                 | **pending** ❓                                       |

Backend (`wp-lms-b2b-rest-api`) readiness: Phase 1 **8/10**, contract **117/117** standalone. Pending backend: CORS
origins (deploy), Postman collection; 4 controllers still proxy-only. See `wp-lms-b2b-rest-api/PROGRESS.md`.

### Parity gap with `wplms-business-dashboard`

The legacy SPA calls 92 distinct endpoints. `lms-b2b/v1` served 55 of them; backend **Tier A**
(2026-09-04) closed clusters 9, 10 and 12 outright and 8 and 11 in part, plus defects D1–D9. The
rest are specified in **[`B2B_API_GAPS.md`](./B2B_API_GAPS.md)**.

Blocked in this frontend until those land: `/settings`, the onboarding wizard, Departments,
Training Matrix, Status Reports, Saved Views, the Overview activity feed, reminder actions
(`remind` / `remind-behind`), learner invite + password-reset + name editing, the certificate
register's course and date filters, the subscription seat-roster tab, and invoice download.

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
- [?] Reports — courses / members / certificates (`analytics` ← `useBusinessReportCourses`, `useBusinessReportMembers`, `useBusinessReportCertificates`)
- [?] Certificates + per-course (`certificates`, `certificates/[courseId]` ← `useBusinessCertificates`)
- [?] Orders (`orders` ← `useBusinessOrders`)
- [?] Pricing page (`pricing` ← `useBusinessPricing`)
- [?] Reviews (`reviews` ← `useBusinessReviewHas`)

## B3 — Write surfaces (mutations)

All mutation hooks exist; verify invalidation + error-toast + success UX:

- [?] `useAddBusinessLearner`, `useUpdateBusinessLearner`, `useCheckLearnerEmail`
- [?] `useConvertBusinessLearnerRole`
- [?] `useAssignBusinessCourse`
- [?] `useUpdateBusinessProfile`
- [?] `useGenerateBusinessCertificate`
- [?] Licence checkout + **subscription checkout** (`licenceCheckout`, `licenceSubscriptionCheckout`, `licenceQuote` in service)
- [?] `useSubmitBusinessReview`
- [?] `useAddBusinessManager`

## B4 — Licence + subscription model (v4)

- [x] Credit system UI removed; licence pools + subscriptions always available
- [x] Assignment auto-routes via backend (`409 no_licence_available` surfaced in assign modal)
- [x] Historical `assignment_type = credit` rows show Legacy badge

## B5 — i18n, nav, polish

- [ ] Audit business strings → locale dictionary (no hardcoded copy)
- [ ] `[locale]` switching verified inside dashboard
- [x] Nav restructured to the legacy `NAV_TREE` (Courses / Reports / More groups, Reviews surfaced)
- [x] Active-state resolution fixed — locale-stripped longest-prefix match, no `includes()` misfires
- [x] Capability-shaped nav gating via `useBusinessCapabilities` (roles today; swaps to an API call
      once the facade exposes a "my capabilities" route — `B2B_API_GAPS.md` cluster 6)
- [ ] Skeleton + empty-state consistency with marketing surface

## B6 — Observability & errors

- [x] Envelope `{error,code}` normalization in `bff.ts` (`success:false` → `{error,code}` + status)
- [ ] Client error→toast mapping by `code`; 401→login, 403→permission page (verify wired uniformly)
- [ ] Sentry breadcrumbs on BFF `401`/`502`

## B7 — Tests

- [x] `business-learners` — `deriveLearnerStatus` + `partitionLearners` (7 cases)
- [x] `business-csv` — parser, header detection, column mapping, row projection (10 cases)
- [ ] Flow tests: assign course, add learner, licence + subscription checkout
- [ ] Contract fixtures mirroring `lms-b2b/v1` payloads (`src/__tests__/fixtures`)

## B8 — Parity pass against the legacy WP dashboard

Done with the endpoints the facade already serves:

- [x] Overview: 4 legacy KPI cards, expandable per-course learner roster, assign-from-row
- [x] Nav: legacy group structure + capability gating (see B5)
- [x] Billing: WooCommerce status filter, billing-information and payment-method cards
- [x] Learners: archived toggle, per-page selector, `deriveLearnerStatus` pills, Added column
- [x] Learner profile: options rail (role, last login, convert role, archive/restore)
- [x] Add learners: CSV import mode with column mapping + per-row results; assign-courses-on-create
- [x] Certificates: real learner-level register off `GET /certificates` (was per-course rollup)
- [x] Course catalogue: card grid with rating, access period, lesson count, certificate badge;
      excluded categories applied client-side

Landed after backend **Tier A** (2026-09-04):

- [x] Business logo upload / remove on `/profile` (cluster 9)
- [x] Catalogue sort + category filter, server-side exclusions (cluster 12) — the client-side
      exclusion filter added in the first parity pass is gone
- [x] Licence revoke on `/learners/assignments` (cluster 10) — a licence spent on the wrong learner
      was previously unrecoverable through the UI
- [x] Per-quiz score breakdown on `/certificates/[courseId]` (cluster 8, part)
- [x] `GET /businesses/subscriptions/active` replaces the client-side sum over a capped
      `?per_page=50` page (cluster 11, part)
- [x] **Bug fix:** `PATCH /businesses/{owner_user_id}` was being sent `Business.id` (the row id)
      instead of `Business.user_id`, so profile saves targeted the wrong record. Surfaced by the
      backend's D6 rename.

Still blocked — see [`B2B_API_GAPS.md`](./B2B_API_GAPS.md):

- [!] `/settings` page and onboarding wizard (clusters 1–2)
- [!] Departments and every `department_id` filter (cluster 3)
- [!] Status Reports, Training Matrix, Saved Views, CSV exports (cluster 4)
- [!] Overview activity feed (cluster 5)
- [!] Learner invite / password reset / name editing; bulk import endpoint (cluster 6)
- [!] Remind and remind-behind (cluster 7)
- [!] Certificate course + date-range filters (cluster 8, rest)
- [!] Subscription seat-roster tab (cluster 11, rest)
- [!] Invoice download (cluster 13)

---

## Backend contracts (reference — `lms-b2b/v1`, `wp-lms-b2b-rest-api`)

All routes JWT-gated, `{success,data}`. `→` = proxies to legacy `b2b-dashboard/v1` internally.

| Controller     | Routes (selected)                                                                                     | Direct / proxy      |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------------------- |
| Team           | `/team` GET·POST · `/team/{id}` GET·PATCH · `/team/check-email` · `/team/{id}/convert-role`           | direct              |
| Business       | `/businesses` · `/businesses/current` · `/businesses/{id}` GET·PATCH                                  | direct              |
| Course         | `/courses` · `/courses/assign` · `/courses/assignments` · `/courses/{id}/learners`                    | direct              |
| Licence        | `/licences/courses` · `/balance` · `/balance/{courseId}` · `/pricing` · `/pricing/calculate`          | direct              |
| Reports        | `/reports/summary` · `/courses` · `/members` · `/certificates`                                        | direct              |
| Certificate    | `/certificates`                                                                                       | → `/certificate`    |
| Subscription   | `/businesses/subscriptions` · `/summary` · `/assigned`                                                | direct              |
| Manager        | `/managers` GET·POST · `/managers/{id}` GET·PATCH·DELETE · `/managers/{id}/status` · `/permissions/*` | **proxy-only**      |
| Reviews        | `/reviews/has` · `/reviews` POST                                                                      | **proxy-only**      |
| CourseCategory | `/course-categories/excluded` GET·POST                                                                | **proxy-only**      |
| Theme          | `/settings/theme`                                                                                     | → `/settings/theme` |
| Utility        | `/health`                                                                                             | self-report         |

> v4 contract: credit and system-type endpoints removed from `lms-b2b/v1`. Some service methods still proxy via legacy controllers (managers, reviews) — treat the contract as stable regardless.

---

## Changelog

| Date       | Item                    | Status | Notes                                                                                                    |
| ---------- | ----------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| 2026-06-28 | Plan + progress created | x      | Headless B2B dashboard surface; architecture decision documented (separate `wp-lms-b2b-rest-api` plugin) |
| 2026-06-28 | Inventory audit         | x      | 42 BFF routes, ~50 service methods, ~40 hooks, ~14 pages confirmed present                               |
| 2026-07-06 | B4 v4 licence migration | x      | Removed credit/system-type UI; licence KPIs, Legacy badges, 409 assign handling                          |
