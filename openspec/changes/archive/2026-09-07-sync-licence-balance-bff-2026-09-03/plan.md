# Plan — sync-licence-balance-bff-2026-09-03

## Context

Part of the three-repo B2B parity sync (2026-09-03): `wplms-business-dashboard` (source of
truth) → `wp-lms-b2b-rest-api` (`lms-b2b/v1` facade) → this frontend.

## What the audit found (frontend slice)

Parity was measured by what the frontend actually consumes. Every one of the ~46 BFF
`/api/business/*` routes the frontend calls maps to an existing facade route, **except** one:

- `businessDashboardService.getCourseLicenceBalance(courseId)` calls
  `GET /api/business/licences/balance/{courseId}`.
- The facade exposes `GET /licences/balance/{course_id}` (`Licence_Controller::course_balance`).
- But the BFF has only `licences/balance/route.ts` — no `[courseId]` segment. The per-course
  call 404s at the BFF before reaching WP.

The method is currently unconsumed (only the aggregate `getLicenceBalance()` is wired into
`useBusinessLicenceBalance`), so this is a latent gap, not a live user-facing bug. It is closed
here because a service method with no reachable route is a parity gap waiting to fire.

## Decision

Add the missing BFF route rather than delete the service method: the facade and the
source-of-truth plugin both expose the per-course balance, so wiring the route restores
frontend↔facade parity and keeps the capability available. One file, no behaviour change to the
existing aggregate route.

## Ordered task list

See `tasks.md`: add `[courseId]/route.ts` → typecheck + lint + build → branch/commit/PR.

## Not in scope

The broader question of _when_ to consume this per-course balance in the UI is a product/design
decision, not a parity concern, and is left alone.
