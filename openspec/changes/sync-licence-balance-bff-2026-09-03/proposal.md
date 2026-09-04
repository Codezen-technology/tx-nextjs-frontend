## Why

The business dashboard's data layer exposes a per-course licence-balance read:
`businessDashboardService.getCourseLicenceBalance(courseId)` in
`src/lib/services/business-dashboard.ts` calls `GET /api/business/licences/balance/{courseId}`.
That BFF route does not exist — only `src/app/api/business/licences/balance/route.ts` (the
no-argument pool summary) is present. Any call to the per-course method therefore 404s at the
BFF boundary before it ever reaches WordPress.

The upstream contract already supports it: the `lms-b2b/v1` facade registers
`GET /licences/balance/(?P<course_id>\d+)` (`Licence_Controller::course_balance`), which the
source-of-truth plugin `wplms-business-dashboard` also exposes. So this is a headless-frontend
parity gap: the frontend has the client method and the backend has the endpoint, but the BFF
segment that bridges them was never added.

The method is not yet consumed by a hook or page (only the aggregate `getLicenceBalance()` is
wired, in `useBusinessLicenceBalance`), so today it is a latent break rather than a live bug —
but leaving a service method that cannot resolve is a parity gap waiting to become a runtime
404 the first time a component calls it.

## What Changes

- Add `src/app/api/business/licences/balance/[courseId]/route.ts` — a `GET` handler that
  forwards to the facade's `/licences/balance/{courseId}` via `proxyToB2B`, mirroring the
  existing dynamic BFF routes (`subscriptions/[id]`, `courses/[id]/learners`).
- No change to the service method, hooks, or components — they already target this path.

## Capabilities

### New Capabilities

- `business-licence-balance`: the business dashboard can read licence-pool balance both in
  aggregate and for a single course, and each read has a BFF route that reaches the facade.

### Modified Capabilities

(none — no existing spec covers the licence-balance BFF routes)

## Impact

- One new file: `src/app/api/business/licences/balance/[courseId]/route.ts`.
- No dependency, data-shape, or contract change; the facade route already exists and is frozen.
- Verified with `pnpm typecheck` and `pnpm lint`.
