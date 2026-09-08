## 1. Fix BFF Auth Gate

- [x] 1.1 Add `requiresAuth: false` to the `proxyToWP` call in `src/app/api/contact/route.ts`

## 2. Cleanup

- [x] 2.1 Remove `console.log({data})` from `src/lib/services/contact.server.ts:54`

## 3. Verify

- [x] 3.1 Run `pnpm typecheck` to confirm no type errors
- [x] 3.2 Run `pnpm lint` to confirm no lint errors
