# Cart Hardening Plan — worst first

Companion to `CART.md`. Tracks the staged removal of the conditions that made the
quantity-update infinite loop possible. Phase 0 (event-driven writes) is shipped;
the loop is dead. This plan removes the _conditions_ that allowed it.

## Framing

Problems #1 and #2 are the **same disease**: two copies of the cart (Zustand on disk +
server truth) that must be manually reconciled. #1 is the cheap, high-value slice of #2.
Do the cheap slice now; schedule the full collapse; defer #4 until a feature needs it.
Never big-bang the money path.

## Blast radius (measured, not guessed)

`store.items` is read by **12 files**, including marketing pages (`course/[slug]`,
`bundles/[slug]`, home hero/categories) that decide the add-to-cart "Added" state via
`items.some(...)`. Every one of those pages renders the header, which mounts
`useCartQuery()`, so the store still populates after fetch. Removing disk persistence only
costs a brief "Add" → "Added" correction on first paint — the flicker, which is the correct
tradeoff. `.some()` on `[]` is safe, so no reader breaks.

---

## Phase 0 — Event-driven writes ✅ SHIPPED

`CartItemRow.tsx`: quantity `PUT` fires only from the +/- click handler (debounced 400ms),
never from a `useEffect` watching cart data. The store→display sync effect is display-only and
suppressed while an edit is queued. See `CART.md` § "The quantity loop".

---

## Phase 1 — Kill disk persistence + add staleTime (#1 + #3) ✅ DONE

Highest-leverage change. #1 and #3 ship together: same two files, both close race windows.

- **1a. `cart.store.ts` — persist only `itemCount`.** `partialize` drops `items` and `totals`;
  keeps `itemCount` (header badge needs a number pre-hydration). A cart is server-owned state;
  caching it to `localStorage` is what hydrated the stale value that fought the server.
- **1b. `useCart.ts` — `staleTime: 30_000` on `useCartQuery`.** Stops the mount/focus refetch
  storm. Mutations already `invalidateQueries(cart.detail)`, so post-write freshness is intact.
- **1c. Guard the empty first frame.** `cart/page.tsx` gates on `useCartQuery().isLoading`; the
  12 `s.items` readers degrade to "Add" for ~1 fetch cycle then correct. No reader throws.

**Acceptance:**

- Hard-reload `/cart` → one `GET /api/cart`, zero PUTs, correct quantities, no wrong-total flicker.
- Tab away and back → no refetch within 30s.
- `localStorage.lms-cart` contains only `itemCount`.
- `cart.hooks.test.tsx` green; `cart.store.test.ts` asserts the persisted shape.

**Rollback:** single-file revert of `partialize`. No schema/API change.

---

## Phase 2 — Collapse to one source of truth (#2) — DISPLAY LAYER DONE (store-strip deferred)

TanStack Query becomes sole owner of cart data; Zustand keeps only UI state.

1. ✅ **Facade hook `useCart()`** → `{ cart, items, totals, itemCount, currency, errors, isLoading }`
   from `useCartQuery().data` (`useCart.ts`). The seam the rest of the migration builds on.
2. ✅ **Migrate readers to `useCart()`, delete `cart ?? store` hedges.** Done — every data/display
   reader now reads `useCart()`: `CartSummary`, `CheckoutOrderSummary`, `cart/page.tsx`, `MiniCart`,
   `product-add-to-cart`, `UpsellBanner`, `dashboard-shell`, `cart-drawer`, `PaymentMethodSelector`.
   No `cart ?? store` hedge remains. Surviving `useCartStore` reads are **not** data divergence:
   UI state (`isOpen`/`toggleCart` in `bundle-add-to-cart`), the pre-hydration `itemCount` +
   `hasHydrated` badge/gate (`header`, `checkout/page`), the `clearCart` action (`checkout/page`),
   and a lone `currency` selector in `CartItemRow` (per-row — migrating would mount N redundant
   queries, so left as a plain projection read).
3. ⛔ **Strip store to `{ isOpen, toggleCart }` + derived `itemCount`.** NOT done. High risk.
4. ⛔ **Delete `setCart` dual-writes in `useCart.ts`.** NOT done — `cart.hooks.test.tsx` asserts
   mutations update the store directly with no `useCartQuery` mounted, so removing the dual-write
   is a tested behavior change, not a no-op. Requires test rewrite + checkout QA.

**Why 3–4 are deferred:** they touch mutation hooks + 15 files on the checkout/money path and
change a tested contract. The display-layer slice (1–2 partial) removes the `cart ?? store`
divergence on the surfaces that had it, zero checkout-behavior change, all tests green. The
store-strip should land as its own reviewed PR with manual QA over add-to-cart / quantity /
coupon / checkout.

**Acceptance (full):** `grep 's.items\|s.totals'` returns only the store definition + the "in cart"
detection readers' replacement. All cart tests green after rewrite.

---

## Phase 3 — Serialize writes (#4) — DEFERRED

Only if a feature adds rapid distinct edits (e.g. a typeable quantity field). Today the 400ms
debounce coalesces the realistic case. When triggered: `await qc.cancelQueries(cart.detail)`
before each mutation, or a single-flight queue keyed by cart-item. No user-visible payoff today.

---

## Sequencing

| Phase | Problem | Effort    | Status                                                           |
| ----- | ------- | --------- | ---------------------------------------------------------------- |
| 0     | loop    | done      | ✅ shipped                                                       |
| 1     | #1 + #3 | ~30 min   | ✅ done                                                          |
| 2     | #2      | ~half day | ✅ display layer done (2.1–2.2); ⛔ store-strip 2.3–2.4 deferred |
| 3     | #4      | small     | deferred                                                         |
