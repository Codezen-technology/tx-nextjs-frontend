## 1. Add the missing BFF route

- [x] 1.1 Create `src/app/api/business/licences/balance/[courseId]/route.ts` with a `GET`
      handler that awaits `params`, reads `courseId`, and forwards to
      `/licences/balance/{courseId}` via `proxyToB2B` — mirroring `subscriptions/[id]/route.ts`.

## 2. Verify

- [x] 2.1 `pnpm typecheck` (tsc --noEmit) — no new errors.
- [x] 2.2 `pnpm lint` — clean for the new file.
- [x] 2.3 `pnpm build` — route compiled into the App Router manifest.

## 3. Ship

- [x] 3.1 Branch `sync/business-dashboard-2026-09-03`, commit, push.
- [x] 3.2 Open PR against `main`.
