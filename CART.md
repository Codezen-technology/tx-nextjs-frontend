# Cart — Developer Guide

How the cart works end-to-end: WooCommerce Store API, the BFF proxy, the session
token, the Zustand store, and the hooks. Read this before touching anything under
`src/components/cart/`, `src/lib/hooks/useCart.ts`, or `src/app/api/cart/`.

The cart is the money path. Treat every change here as production-critical.

---

## TL;DR for the impatient

- Cart data lives in **WooCommerce**, reached through the **Store API** (`/wc/store/v1/cart`).
- The browser never calls WooCommerce directly. It calls our **BFF routes** (`/api/cart/*`),
  which attach the WC **Cart-Token** and the JWT, then proxy to WordPress.
- Client UI reads from the **Zustand store** (`useCartStore`), not from the query directly.
  `useCartQuery()` fetches and pushes the result into the store via `setCart`.
- **Quantity writes are event-driven only** (fired from the +/- click handler). Never fire a
  cart mutation from a `useEffect` that watches cart data — that caused an infinite PUT loop.
  See [The quantity loop](#the-quantity-loop-history--do-not-reintroduce).

---

## Architecture

```
Browser (React)
  │  reads ← useCartStore (Zustand, source of truth for UI)
  │  writes → useCart hooks (TanStack mutations)
  ▼
src/lib/services/cart.ts            normalizes WC ⇄ domain `Cart`
  ▼
src/lib/api/bff-client.ts           cartFetch(): attaches Cart-Token + Nonce
  ▼  credentials: include
/api/cart/*  (Next.js route handlers, src/app/api/cart/)
  ▼
src/lib/api/bff.ts  proxyToWCStore()  attaches Bearer JWT + Cart-Token, echoes token back
  ▼
WordPress  /wp-json/wc/store/v1/cart
  ▼
WooCommerce_Cart_Rules.php (lms-backend-rest-api)  fixed-price coupons, bulk discount, exclusives
```

WC Store API cart response shape:
<https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart/#cart-response>

---

## The session model (Cart-Token) — the part that bites people

The Store API is **stateless per request**. It identifies which cart you mean via a
**Cart-Token** (a JWT embedding a WooCommerce session id) plus a **Nonce**. There is no
server-side cookie doing this for us in the headless setup.

**Where the token lives:** `localStorage` — `wc-cart-token` and `wc-cart-nonce`
(see `bff-client.ts`, `CART_TOKEN_KEY` / `CART_NONCE_KEY`).

**Round-trip (`cartFetch` in `bff-client.ts`):**

1. First write with no token → bootstrap by calling `GET /api/cart`; WC mints a token, we save it.
2. Every request sends `x-cart-token` / `x-wc-store-api-nonce` headers.
3. `proxyToWCStore` forwards them as WC's `Cart-Token` / `Nonce` headers, and — if the user
   is logged in — the `Authorization: Bearer <JWT>` from the httpOnly `access_token` cookie.
4. WC echoes a (possibly rotated) `Cart-Token` / `Nonce` back; the BFF re-exposes them as
   `x-cart-token` / `x-wc-store-api-nonce`; `cartFetch` persists them again.

**Logged-in carts.** `Global_Jwt_Auth` (backend) resolves `get_current_user_id()` from the
Bearer token on _every_ REST namespace via the `determine_current_user` filter. That is what
lets the Store API associate the cart with the customer.

**The gotcha — stale token across identity changes.** A Cart-Token minted while anonymous
keeps pointing at that anonymous session even after login; the Bearer token does **not**
retarget it. So we **clear the token on every identity transition** — login, register
auto-login, logout, logout-all, switch-user, switch-back (see `useAuth.ts`, all call
`clearCartToken()`). If you add a new auth transition, clear the cart token there too, or the
user will see the wrong cart.

`clearCartToken()` also fires on `woocommerce_rest_cart_invalid_key` (stale session) so the
next write bootstraps a fresh token.

---

## Endpoints & BFF routes

| Action        | Client service call          | BFF route (`src/app/api/cart/`)  | WC Store API               |
| ------------- | ---------------------------- | -------------------------------- | -------------------------- |
| Get cart      | `cartService.fetchCart()`    | `GET /api/cart`                  | `GET /cart`                |
| Add item      | `cartService.addItem()`      | `POST /api/cart/items`           | `POST /cart/add-item`      |
| Update qty    | `cartService.updateItem()`   | `PUT /api/cart/items/[key]`      | `PUT /cart/items/{key}`    |
| Remove item   | `cartService.removeItem()`   | `DELETE /api/cart/items/[key]`   | `DELETE /cart/items/{key}` |
| Empty cart    | `cartService.emptyCart()`    | `DELETE /api/cart`               | `DELETE /cart/items`       |
| Apply coupon  | `cartService.applyCoupon()`  | `POST /api/cart/coupon`          | `POST /cart/apply-coupon`  |
| Remove coupon | `cartService.removeCoupon()` | `DELETE /api/cart/coupon/[code]` | `POST /cart/remove-coupon` |

Two field-name quirks the BFF papers over — do not "fix" them in components:

- **`product_id` vs `id`.** The service sends `product_id`; the Store API wants `id`.
  `POST /api/cart/items` maps it (`route.ts`).
- **Remove coupon is a POST, not a DELETE.** Our route accepts `DELETE /api/cart/coupon/[code]`
  for REST cleanliness but proxies to WC's `POST /cart/remove-coupon` with `{ code }`.

Single source for URL strings: `src/lib/api/endpoints.ts` → `endpoints.cart`. Never inline.

---

## Data flow: read path

```
useCartQuery()  (src/lib/hooks/useCart.ts)
  → cartService.fetchCart()          GET /api/cart → WCStoreCart
  → normalizeWCCart()                WCStoreCart → domain Cart
  → useEffect: setCart(query.data)   pushes into Zustand
```

**Critical:** every cart UI component (`cart/page.tsx`, `CartSummary`, `CartItemRow`,
`MiniCart`, `cart-drawer`, header badge, checkout) reads from **`useCartStore`**, not from
`useCartQuery().data`. If you comment out the `setCart` sync in `useCartQuery`, the store
never updates and the UI shows stale/empty data even though the fetch succeeded. It must stay.

`useCartQuery` is mounted in multiple places at once (header + cart page + coupon input…).
That is fine — they share query key `queryKeys.cart.detail` (`["cart"]`), so TanStack dedupes
to one network request.

### Normalization — read `cart.store.ts`, not the WC response, in components

`normalizeWCCart()` (`src/lib/stores/cart.store.ts`) is the **only** place WC's raw shape is
translated. It handles the landmines:

- **Money is in minor units** (`"1499"` = £14.99). Everything is divided by
  `10 ** currency_minor_unit`. Never read a raw `prices.*` / `totals.*` string as a float.
- **VAT rate** comes from `tax_lines[0].rate` when present; falls back to a ratio calc rounded
  to 1dp to avoid integer-division artifacts (e.g. 20.016%).
- **HTML entities** in `name` / `currency_symbol` are run through `decodeEntities()`.
- **Bulk discount** arrives as a **negative fee** in `fees[]`, not a line-item price change.
  `CartSummary` renders negative fees in green.

---

## Data flow: write path (mutations)

All in `src/lib/hooks/useCart.ts`. Every mutation, on success, writes to **both** the Zustand
store (`setCart`) and the TanStack cache (`qc.setQueryData(queryKeys.cart.detail, ...)`) so the
two never diverge.

- **`useAddToCart`** — `onSuccess` → `setCart` + `setQueryData`.
- **`useUpdateCartItem`** — `onSuccess` → `setCart` + `setQueryData`; `onError` → invalidate;
  `onSettled` → invalidate with `refetchType: "none"` (mark stale without a refetch storm).
- **`useRemoveCartItem`** — optimistic: `onMutate` snapshots + `optimisticRemove`; `onError`
  rolls back to the snapshot; `onSuccess` commits server truth.
- **`useApplyCoupon` / `useRemoveCoupon`** — `onSuccess` → `setCart` + `setQueryData`.

`removeItem` and `emptyCart` in the service issue the DELETE then re-`fetchCart()` because WC's
DELETE responses are not always the full cart envelope.

---

## The quantity loop (history — DO NOT reintroduce)

**Symptom:** on `/cart`, an endless `PUT /api/cart/items/{key}` → `GET /api/cart` → `PUT …`
storm, all `200`, with the PUT body quantity ping-ponging between two values (e.g. 8↔9).

**Root cause:** the quantity write was fired from a `useEffect` that watched cart-derived state.
The persisted Zustand store (`localStorage: lms-cart`) hydrated a **stale** quantity (9); the
server refetch said 8; the write-effect dutifully PUT the stale value back; the refetch
reasserted the server value; repeat forever. A naive "don't send the same value twice" guard
does **not** help — alternating 8→9→8→9 differs every time.

**Fix (current design in `CartItemRow.tsx`):**

- Quantity writes are **event-driven** — the debounced `PUT` is fired from the `+`/`-` click
  handler (`handleQty`), never from an effect reacting to `item.quantity`.
- The store→display sync effect is **display-only**: it calls `setLocalQty(item.quantity)` and
  is skipped while an edit is queued (`pendingWrite` ref). It never triggers a mutation.
- The debounce (400 ms) coalesces rapid clicks; the write is skipped if it already equals the
  server value.

**Rule:** a `useEffect` may read cart state to update _display_, but must never fire a cart
_mutation_. Mutations originate from user events. If you find yourself adding
`updateQty`/`addItem` inside an effect dependent on cart data, stop — you are rebuilding the loop.

Self-heal: a stuck cart clears itself on the next full `/cart` load — `useCartQuery` GET returns
server truth and no PUT fires without a click. Fast Refresh is **not** enough (it preserves
component + localStorage state); hard-reload (`Cmd+Shift+R`) when verifying.

---

## Backend pricing rules (where cart totals actually come from)

`lms-backend-rest-api/includes/Infrastructure/WooCommerce_Cart_Rules.php` hooks the core WC
cart pipeline, which the Store API executes server-side. The frontend receives already-priced
totals — **do not** re-implement any of this client-side:

- **Fixed-price coupons** (`loyal7` → £7, etc.) — reprice eligible items via
  `woocommerce_before_calculate_totals`. Excluded categories: `bundle-courses`, `ex-deals`.
- **Tiered bulk discount** — added as a negative `Bulk Discount` fee via
  `woocommerce_cart_calculate_fees` (default tiers: 10+ →10%, 20+ →25%, 50+ →50%, 101+ →70%).
  A bulk-discounted item is flagged `lms_no_coupon` so a coupon can't stack on top.
- **Exclusive products** (lifetime membership, "All Courses & CPD") — force every other item
  out of the cart, both on add and on recalculation.
- **Order parity** — orders created via `POST /wc/v3/orders` bypass the cart pipeline, so the
  same repricing is re-applied on `woocommerce_rest_insert_shop_order_object`. If you change a
  cart rule, change the order path too, or the cart total won't match the charge.

Admin-editable via `lms_backend_cart_rules` option (React admin app). Bulk tiers are also
exposed to the frontend read-only for display (`cartRulesService`, `useBulkTiers`).

---

## Store API contract (verified against official docs)

Verified against the WooCommerce Store API docs — endpoints, methods, and money handling
all match:

- Cart: <https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart/>
- Cart Items: <https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart-items/>

**Cart response — top-level fields.** WC returns more than we consume. We normalize only what
the cart page renders (`items`, `coupons`, `fees`, `totals`, `items_count`, `billing_address`).
Deliberately ignored (checkout/shipping concerns the cart page doesn't own): `needs_payment`,
`needs_shipping`, `payment_requirements`, `payment_methods`, `has_calculated_shipping`,
`shipping_rates`, `items_weight`, `cross_sells`, `extensions`.

**Cart item — fields we read** (`WCStoreCartItem` in `cart.store.ts`): `key`, `id`, `quantity`,
`name`, `sold_individually`, `quantity_limits`, `images`, `prices`, `totals`. WC also returns
`type`, `sku`, `permalink`, `variation`, `low_stock_remaining`, `backorders_allowed`,
`prices.sale_price`, `prices.raw_prices`, `_links`, etc. — unused.

**Known coverage gaps (not bugs — pick up when touching this area):**

1. **`errors[]` in the cart response is dropped.** WC surfaces item-level problems (out of stock,
   quantity exceeded, item auto-removed) in the top-level `errors` array. `WCStoreCart` doesn't
   type it and `normalizeWCCart` ignores it, so the user can see a changed total with no reason.
   To fix: add `errors` to the type, carry it into the domain `Cart`, render a notice.
2. **`quantity_limits.editable` unused.** The stepper's visibility is driven by `sold_individually`;
   `quantity_limits.editable` is the Store API's dedicated signal (also covers stock/backorder
   caps). `max_quantity` already comes from `quantity_limits.maximum`.
3. **`variation` not sent on add-to-cart.** Simple products only. Variable products would need the
   `variation` param on `POST /cart/add-item`.

---

## Key files

| File                                                      | Responsibility                                            |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `src/lib/stores/cart.store.ts`                            | Zustand store + `normalizeWCCart()` (WC → domain `Cart`)  |
| `src/lib/hooks/useCart.ts`                                | TanStack query + mutations; store/cache sync              |
| `src/lib/services/cart.ts`                                | Thin service; calls `cartFetch`, normalizes               |
| `src/lib/api/bff-client.ts`                               | `cartFetch()` + Cart-Token/Nonce persistence              |
| `src/lib/api/bff.ts`                                      | `proxyToWCStore()` — server-side proxy, JWT + token relay |
| `src/app/api/cart/**`                                     | BFF route handlers                                        |
| `src/components/cart/CartItemRow.tsx`                     | Line item + **event-driven** quantity stepper             |
| `src/components/cart/CartSummary.tsx`                     | Totals, fees, coupon, checkout button                     |
| `src/components/cart/CouponInput.tsx`                     | Apply/remove coupon                                       |
| `src/components/cart/MiniCart.tsx`                        | Header dropdown cart                                      |
| `src/app/[locale]/(shop)/cart/page.tsx`                   | Cart page shell                                           |
| `.../lms-backend-rest-api/.../WooCommerce_Cart_Rules.php` | Server-side pricing rules                                 |

Tests: `src/__tests__/cart.hooks.test.tsx` (mutation store/cache sync, optimistic remove +
rollback, error paths).

---

## Gotchas checklist (paste into your PR self-review)

- [ ] Reading cart in a component? Use `useCartStore`, not `useCartQuery().data`.
- [ ] Firing a cart mutation? From a user event, **never** from a cart-watching `useEffect`.
- [ ] Added an auth transition? Call `clearCartToken()` there.
- [ ] Reading money? Divide by `10 ** currency_minor_unit` — the Store API sends minor units.
- [ ] New endpoint URL? Add it to `endpoints.cart`, don't inline the string.
- [ ] Changed a backend cart rule? Mirror it in the order-parity path.
- [ ] Verifying a cart fix in the browser? Hard-reload — Fast Refresh keeps stale state.
