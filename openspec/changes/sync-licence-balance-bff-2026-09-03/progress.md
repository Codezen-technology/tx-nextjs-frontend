# Progress — sync-licence-balance-bff-2026-09-03

Base commit: `366bf53` on `main`. Branch: `sync/business-dashboard-2026-09-03`. 2026-09-03 (UTC).

| Task                          | Status | Evidence                                                  |
| ----------------------------- | ------ | --------------------------------------------------------- |
| 1.1 add `[courseId]/route.ts` | done   | new file, mirrors `subscriptions/[id]/route.ts`           |
| 2.1 `pnpm typecheck`          | done   | `tsc --noEmit` exit 0 (see below)                         |
| 2.2 `pnpm lint`               | done   | 0 errors (44 pre-existing warnings, none in the new file) |
| 2.3 `pnpm build`              | done   | route present in App Router manifest (see below)          |
| 3.1 branch/commit/push        | done   | this branch                                               |
| 3.2 PR                        | done   | link in run report                                        |

## Evidence

### 2.1 typecheck

```
$ pnpm typecheck
> tsc --noEmit
(exit 0, no output)
```

### 2.2 lint

```
$ pnpm lint
✖ 44 problems (0 errors, 44 warnings)
```

All 44 are pre-existing `react-hooks/*` warnings in unrelated files
(`useBusinessPricing.ts`, `usePlayerSections.ts`, impersonation hook, …). None is in
`src/app/api/business/licences/balance/[courseId]/route.ts`. Exit code 0.

### 2.3 build

```
$ pnpm build
...
├ ƒ /api/business/licences/balance
├ ƒ /api/business/licences/balance/[courseId]
...
(exit 0)
```

Both the aggregate route and the new per-course route are compiled as dynamic (ƒ) App Router
routes. Build artifacts confirmed under `.next/server/app/api/business/licences/balance/[courseId]`.
