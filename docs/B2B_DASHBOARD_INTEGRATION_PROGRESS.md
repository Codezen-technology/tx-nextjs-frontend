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

| Layer                                                   | State                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| BFF proxy routes (`/api/business/**`)                   | **72 route files / 84 handlers** → `lms-b2b/v1` ✅                     |
| BFF paths sourced from `endpoints.business`             | **all routes** — no hardcoded path strings ✅                          |
| Client service (`businessDashboardService`)             | **84 methods** ✅                                                      |
| React Query hooks (`useBusinessDashboard.ts`)           | **76 hooks**, all on `queryKeys.business` ✅                           |
| Types (`business-dashboard.ts` + `business-pricing.ts`) | present ✅                                                             |
| Pages (`(business)/business-dashboard/**`)              | **21 route segments** ✅                                               |
| Auth (JWT Bearer + refresh, httpOnly cookies)           | wired in `bff.ts` ✅                                                   |
| Unit tests for business surfaces                        | `business-learners`, `business-csv`, `business-licences` (27 cases) ✅ |
| **Parity with the legacy WP dashboard**                 | **parity reached** — pending live verification ❗                      |
| **End-to-end verification per surface**                 | **pending** ❓                                                         |

Backend (`wp-lms-b2b-rest-api`) readiness: contract **179/179**, all tiers (A, B, C) closed — see
`docs/B2B_API_GAPS.md`. Pending backend: CORS origins (deploy), Postman collection. The controller
table below still records which routes reach the backend via a legacy alias rather than directly;
that is a routing detail, not an outstanding gap. See `wp-lms-b2b-rest-api/PROGRESS.md`.

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

- [x] `business-learners` — `deriveLearnerStatus` (3 cases; `partitionLearners` deleted in Tier B, replaced by `GET /team/stats`)
- [x] `business-csv` — parser, header detection, column mapping, row projection (10 cases)
- [ ] Flow tests: assign course, add learner, licence + subscription checkout
- [ ] Contract fixtures mirroring `lms-b2b/v1` payloads (`src/__tests__/fixtures`)

## B9 — Live verification (2026-09-05)

Swept every business BFF route against a real site with real data.

**Bug found and fixed: licence figures were rendering as concatenated strings.** `$wpdb` returns
every column as a string, so a pool arrived as `available: "2", quantity: "3", used: "1"`.
`sumAvailableLicences` reduced with `+`, so one pool showed `"02"` and two pools of 2 and 5 showed
`"025"` instead of `7`. The Overview's licence KPI read `"01 / 03"`. Separately, `course_id` arrived
as `"0"` for universal pools, so `course_id === 0` never matched and neither
`formatPoolCourseName` nor `isMigratedCreditPool` could identify one.

Fixed by coercing in `normaliseLicencePool()` in the service — the only layer allowed to know about
WP's shape — rather than at the call sites. Six regression tests added in
`src/__tests__/business-licences.test.ts`.

Worth noting the shape was valid throughout: `LicenceBalanceResponse` type-checks against a payload
of strings, because TypeScript only describes the shape we _expect_. Neither typecheck nor the
contract test could have caught this; only running it could.

Confirmed working against live data: settings, departments (tree + flat, `member_count`),
membership `PUT` (replaces the set), saved views (`filters` round-trips verbatim), activity,
learner-courses, matrix, course options, team stats, seat roster, certificates, orders (with the
Tier B `invoice_url` / `is_paid` / `billing_name`), quiz scores, and the summary's four Tier B
fields.

Two things the sweep clarified rather than broke:

- `GET /team/{id}` takes the **team member row id**, not the user id. The learners table already
  links with the row id and the rail uses `user_id` only for the department routes, which is
  correct — but it is an easy one to get backwards.
- `/api/business/status` is the only BFF route reachable unauthenticated; every other one
  short-circuits to 401 in `proxyToWP` before calling WordPress. Unauthenticated sweeps therefore
  cannot validate path construction.

---

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
- [x] Server-side auth gate — `proxy.ts:9` has `/^\/business-dashboard/` in `PROTECTED` and
      redirects to `/login?next=…`. Verified live (307). An earlier note here claiming it was
      ungated was wrong.
- [ ] Server-side **role** gate — authentication is enforced at the proxy, but the business-role
      check is still client-side in `BusinessAccessGuard`. A logged-in learner reaches the shell
      before the denial renders, though every API call 403s server-side
- [x] Assign-course modal shows subscription coverage before assigning
      (`POST /business/check-learners-subscriptions`) — a covered learner spends no licence
- [x] **Live verification of the frontend** (2026-09-05, against `tx-local-site` with the tier
      plugin installed). Logged in through `/api/auth/login` as a `b2b_customer`, then swept all
      33 parameterless GET routes plus the parameterised ones, and exercised the department,
      membership and saved-view write paths end to end. Every route answered; test data removed
      afterwards. One real bug found and fixed — see below.
- [ ] Browser pass over the pages themselves (rendering, empty states, interaction). The sweep
      covered the API contract, not the UI.

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
