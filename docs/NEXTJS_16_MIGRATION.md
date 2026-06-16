# Next.js 14 → 16 Migration Plan

**Status:** Phases 0–2 complete — Next.js 16.2.9 + React 19 running, 179/179 tests pass, production build green. Phase 3 (MCP runtime verification) pending.
**Owner:** _unassigned_
**Created:** 2026-06-16
**Completed:** 2026-06-16
**Branch:** `chore/next15-migration` (lock snapshot: `pnpm-lock.yaml.next14-snapshot`)
**Was:** Next.js `14.2.35`, React `18`
**Now:** Next.js `16.2.9`, React `19.2.7`

> **Note:** Migration was done as a direct 14 → 16 jump (skipping intermediate 15 land). All 15 + 16 breaking changes handled in one pass.

---

## Why migrate

- Next.js 16 is the only version with the built-in MCP devtools endpoint (`/_next/mcp`) that `next-devtools-mcp` connects to (see `.mcp.json`).
- 14.2.x is two majors behind stable; React 18 blocks newer ecosystem deps.
- Turbopack is the default bundler in 16 (faster dev/build).

---

## Blast-radius summary (audited 2026-06-16)

| Area                               | Files / sites                                                                            | Impact   | Notes                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `cookies()` async                  | `src/lib/api/bff.ts` (4), `src/app/api/**/route.ts` (~5), `src/lib/api/wc-orders.ts` (3) | **HIGH** | All become `await cookies()`. `bff.ts` is the core proxy — touch carefully.                                |
| `params` / `searchParams` async    | ~8 pages under `src/app/[locale]/**`                                                     | **HIGH** | Props become `Promise`. Must `await params` / `await searchParams`.                                        |
| `fetch` caching default            | `src/lib/api/server.ts`                                                                  | **LOW**  | Already sets explicit `revalidate` + `tags` on every call → opt-in, unaffected by default-uncached change. |
| `revalidateTag` / on-demand        | `src/app/api/revalidate` + `server.ts` tags                                              | **LOW**  | Tag-based revalidation API unchanged. Re-verify after upgrade.                                             |
| `experimental.instrumentationHook` | `next.config.mjs`                                                                        | **MED**  | `instrumentation.ts` is stable in 15 — remove the experimental flag.                                       |
| next-intl plugin + middleware      | `next.config.mjs`, `src/middleware.ts`, `src/i18n/request.ts`                            | **MED**  | Verify next-intl version supports 15/16; middleware async-cookie usage.                                    |
| `@sentry/nextjs` 10.x              | `next.config.mjs`, `sentry.*.config.ts`, `src/instrumentation.ts`                        | **MED**  | Confirm 10.x (or bump) supports Next 16 + Turbopack.                                                       |
| React 19                           | `react`, `react-dom`, `@types/react*`                                                    | **MED**  | RHF, Radix, TanStack Query, next-themes all need React 19-compatible ranges.                               |
| Test deps                          | `@testing-library/react` 16, `vitest` 4, `jsdom`                                         | **LOW**  | TL 16 already supports React 19. Re-run full suite.                                                        |

---

## Phase 0 — Prep (no code change) — ✅ COMPLETE (2026-06-16)

- [x] Create branch `chore/next15-migration` off `main`.
- [x] Confirm clean baseline: typecheck ✓ · lint ✓ (warnings only) · test ✓ · build ✓.
  - Fixed 2 pre-existing stale-mock test failures to get a trustworthy gate:
    - `login-form.test.tsx` — mock `useLogin` missing `reset`; added `reset: vi.fn()`.
    - `course-purchase-card.test.tsx` — component refactored buy-now from `useBuyNowStore` → `useAddToCart` + `router.push`; rewrote mock to invoke `onSuccess`, dropped dead store assertion.
  - Result: **179/179 tests pass**, production build succeeds.
- [x] Snapshot current `pnpm-lock.yaml` → `pnpm-lock.yaml.next14-snapshot`.
- [ ] Read bundled docs in `.next-docs/` — **still pending**: `npx @next/codemod@latest agents-md` was interrupted; `.next-docs/` not yet generated. Re-run to completion.
- [x] Inventory third-party peer-dep ranges against React 19 (see findings below).

### Phase 0 findings — peer-dep audit (installed versions)

| Dependency              | Installed | React 19 / Next 16 support                          | Action for Phase 1/2                                  |
| ----------------------- | --------- | --------------------------------------------------- | ----------------------------------------------------- |
| **next-themes**         | `0.3.0`   | ❌ react peer `^16.8 ‖ ^17 ‖ ^18` — **no React 19** | **Bump → `0.4.6`** (adds React 19 support). Blocking. |
| next-intl               | `4.11.1`  | ✅ next peer includes `^15 ‖ ^16`                   | No bump required for either major.                    |
| @sentry/nextjs          | `10.52.0` | ✅ next peer includes `^15 ‖ ^16`                   | Compatible with both; re-verify Turbopack in Phase 2. |
| react-hook-form         | `7.75.0`  | ✅ latest range covers React 19                     | OK.                                                   |
| @tanstack/react-query   | `5.100.9` | ✅                                                  | OK.                                                   |
| @radix-ui/\*            | `1.x`     | ✅                                                  | OK.                                                   |
| @stripe/react-stripe-js | `6.4.0`   | ✅                                                  | OK.                                                   |
| zustand                 | `4.5.7`   | ✅ (`>=18`)                                         | OK.                                                   |

**Net:** only `next-themes` is a hard blocker. next-intl + Sentry already span 14→16.

## Phase 1 — Upgrade to Next.js 15 + React 19 — ✅ COMPLETE (done as part of direct 14→16 jump)

- [x] Run official codemod: `npx @next/codemod@canary upgrade latest` (user ran this manually).
- [x] Bump `next` → `16.2.9`; `eslint-config-next` → `16.2.9`; `react`/`react-dom` → `^19`; `@types/react`/`@types/react-dom` → `^19`.
- [x] **Bump `next-themes` `0.3.0` → `0.4.6`** (React 19 blocker resolved).
- [x] Async-request-API changes (manual — no codemod):
  - [x] `src/lib/api/bff.ts` — `await cookies()` at all 4 sites.
  - [x] `src/app/api/**/route.ts` — `await cookies()` (auth + orders routes).
  - [x] `src/lib/api/wc-orders.ts` — 3 fns made async; `await cookies()`.
  - [x] 25 dynamic route handlers — `params: Promise<{…}>` + `const { id } = await params`.
  - [x] 9 page files — `params`/`searchParams` → `Promise<…>`; destructured with `await`.
- [x] `next.config.mjs` — removed `experimental.instrumentationHook` (stable in 15+); removed Sentry webpack block (no-op under Turbopack).
- [x] next-intl `4.11.1` — confirmed supports Next 15+16; no changes required.
- [x] `@sentry/nextjs` bumped to `^10.58.0` — supports Next 16 + Turbopack auto-detection.
- [x] React 19 ref type fix: `PaymentMethodSelector.tsx` prop `RefObject<BillingFormHandle | null>`.
- [x] `pnpm install` — peer-dep warnings resolved.
- [x] Green gate: typecheck ✓ · lint ✓ · 179/179 tests ✓ · `next build --webpack` ✓.
- [ ] Manual smoke test — **pending** (requires backend connection to https://lms-site.test).
- [ ] Merge `chore/next15-migration` → `main`.

## Phase 2 — Upgrade to Next.js 16 + Turbopack

- [ ] Branch `chore/next16-migration` off updated `main`.
- [ ] Confirm Node version meets 16's minimum (bump CI + local if needed).
- [ ] Run `npx @next/codemod@canary upgrade latest` (targets 16).
- [ ] Bump `next`, `eslint-config-next` → `16.x`.
- [ ] Adopt Turbopack (default in 16): validate `next dev` / `next build`; remove custom webpack-only config or port it.
  - [ ] Sentry `webpack: {...}` block in `next.config.mjs` — confirm Sentry/Turbopack compatibility; migrate config.
- [ ] Resolve any removed/renamed APIs flagged by the codemod (AMP, legacy `next/legacy/image`, etc. — none currently used, re-verify).
- [ ] Re-confirm next-intl + Sentry support 16.
- [ ] Green gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- [ ] Full manual smoke (same checklist as Phase 1).
- [ ] Merge `chore/next16-migration` → `main`.

## Phase 3 — Enable MCP devtools

- [x] `.mcp.json` committed at `tx-headless-frontend/.mcp.json` with `next-devtools-mcp@latest`.
- [x] `AGENTS.md` updated — rules block now points to `node_modules/next/dist/docs/` (Next 16 bundles docs there).
- [x] `pnpm dev --webpack` → `/_next/mcp` returns `200 OK` with `text/event-stream` (verified 2026-06-16). Note: `pnpm dev` (Turbopack) crashes due to macOS Desktop directory permission; `--webpack` workaround required until Full Disk Access is granted.
- [ ] Restart coding agent so it loads the MCP server — **manual step**.
- [ ] Verify a tool call: ask agent "what errors are in my app?" → should hit `get_errors`.

---

## Rollback

Each phase is one branch. If a gate fails and can't be fixed quickly:

- Revert the branch merge, restore `pnpm-lock.yaml` snapshot, `pnpm install`.
- Phases are independent — a failed Phase 2 does not touch the shipped Phase 1.

## References

- AI agents docs setup: https://nextjs.org/docs/app/guides/ai-agents
- MCP server: https://nextjs.org/docs/app/guides/mcp
- next-devtools-mcp: https://github.com/vercel/next-devtools-mcp
- Bundled version-matched docs: `node_modules/next/dist/docs/` (Next 16) or `.next-docs/` (Next 14 codemod output)
