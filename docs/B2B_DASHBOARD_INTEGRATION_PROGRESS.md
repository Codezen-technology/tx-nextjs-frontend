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
| BFF proxy routes (`/api/business/**`)                   | **71 route files / 83 handlers** → `lms-b2b/v1` ✅ |
| BFF paths sourced from `endpoints.business`             | **all routes** — no hardcoded path strings ✅      |
| Client service (`businessDashboardService`)             | **83 methods** ✅                                  |
| React Query hooks (`useBusinessDashboard.ts`)           | **75 hooks**, all on `queryKeys.business` ✅       |
| Types (`business-dashboard.ts` + `business-pricing.ts`) | present ✅                                         |
| Pages (`(business)/business-dashboard/**`)              | **21 route segments** ✅                           |
| Auth (JWT Bearer + refresh, httpOnly cookies)           | wired in `bff.ts` ✅                               |
| Unit tests for business surfaces                        | `business-learners`, `business-csv` (14 cases) ✅  |
| **Parity with the legacy WP dashboard**                 | **parity reached** — pending live verification ❗  |
| **End-to-end verification per surface**                 | **pending** ❓                                     |

Backend (`wp-lms-b2b-rest-api`) readiness: Phase 1 **8/10**, contract **117/117** standalone. Pending backend: CORS
origins (deploy), Postman collection; 4 controllers still proxy-only. See `wp-lms-b2b-rest-api/PROGRESS.md`.

### Parity gap with `wplms-business-dashboard`

The legacy SPA calls 92 distinct endpoints. Backend Tiers **A**, **B** and **C** (all 2026-09-04)
closed every one, and this frontend consumes them. **[`B2B_API_GAPS.md`](./B2B_API_GAPS.md)** is now
the record of what was specified and where the implementation deliberately differs.

No feature is blocked on the backend. What remains is verification, i18n and the server-side guard.

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
- [x] Catalogue sort + category filter, server-side exclusions (cluster 12)
- [x] Licence revoke on `/learners/assignments` (cluster 10)
- [x] Per-quiz score breakdown on `/certificates/[courseId]` (cluster 8)
- [x] `GET /businesses/subscriptions/active` replaced a client-side sum over a capped page
- [x] **Bug fix:** `PATCH /businesses/{owner_user_id}` was sent `Business.id` instead of
      `Business.user_id`, so profile saves targeted the wrong record

Landed after backend **Tier B** (2026-09-04):

- [x] **New page** `/business-dashboard/settings` — appearance, passing mark, certificate download
      control (one-way, renders a Locked chip once set), inert security/integration toggles, and a
      two-step reset
- [x] **New** `OnboardingWizard` behind `OnboardingGate` — six steps, writes nothing until the final
      `POST /settings/onboarding`, fails open if settings cannot be read
- [x] **New page** `/analytics/reports` — the five status views, filters held in the URL, CSV export
- [x] **New page** `/analytics/matrix` — sticky-column grid, label/colour toggle, per-course
      completion footer, CSV export
- [x] Overview: activity feed, real `GET /team/stats` (the sampled partition is deleted), and
      "Remind all behind" that distinguishes "nobody was behind" from "all failed"
- [x] Learner options rail: send login invite, send password reset
- [x] Assigned Courses: per-course Remind button
- [x] Subscriptions: Assigned Learners seat roster
- [x] Certificates: course and date-range filters
- [x] Billing: invoice download, `is_paid` pill, billed-to name
- [x] Reports landing: `total_enrolments`, `enrolments_completed`, `total_in_progress`,
      `compliance_rate`

Landed after backend **Tier C** (2026-09-04):

- [x] Departments — full tree CRUD in Settings (inline rename, reparent, confirmed removal that
      states members are detached rather than deleted)
- [x] Department membership on the learner options rail; `PUT` sends the whole set
- [x] `department_id` filter on the learner list and the status report
- [x] Saved Views on `/analytics/reports` — shared per business, select / save / rename / delete
- [x] CSV import now sends one `POST /team/bulk` instead of a request per row. Rows created whose
      course assignment failed are reported separately from genuine skips, because the backend
      distinguishes them
- [x] The CSV `dept` column is live again — it was parsed and discarded while there was nowhere to
      send it

Remaining, and not blocked on anything:

- [ ] Learner name/email editing — `PATCH /team/{id}` accepts it, but no UI surfaces it yet
- [ ] i18n: every business string is still hardcoded English despite the `[locale]` segment
- [ ] Server-side route guard — `BusinessAccessGuard` is client-only and `proxy.ts` does not gate
      `/business-dashboard`
- [x] Assign-course modal shows subscription coverage before assigning
      (`POST /business/check-learners-subscriptions`) — a covered learner spends no licence
- [ ] **Live verification of the frontend.** The backend was verified live (contract 179/179,
      golden 39 routes); nothing on this side has been exercised against a real site

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
