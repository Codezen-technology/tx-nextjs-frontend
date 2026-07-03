# Currency Plan — kill hardcoded `£`, drive currency from the backend

The store currency must come from the backend, not a hardcoded `£`. Today the symbol is
inlined in **44 places across 24 files** even though every price already ships with its
currency metadata from WooCommerce. This is a correctness bug waiting for the first non-GBP
store, and an inconsistency bug now (some paths use `Intl`, most concatenate `£`).

## Current state (audited)

**Backend already provides currency — three sources, in order of authority:**

1. **WC Store API responses** (cart + products) carry the real transaction currency:
   `currency_code`, `currency_symbol`, `currency_minor_unit`, `currency_prefix`,
   `currency_suffix`. This is authoritative wherever a cart/product is in scope.
   - Cart: `normalizeWCCart` already reads `totals.currency_symbol` → `Cart.currency`.
   - Products: `WCStorePrices` (`types/product.ts`) already types all five fields.
2. **Site settings** (`useSiteSettings().currency`, from `GET /lms-backend/v1/settings`) — a
   currency **code** (e.g. `"GBP"`). The site-wide default for bare numbers with no WC response.
3. **`env.CURRENCY`** — final fallback (already the default in `settings.ts`).

**Fragmentation to consolidate:**

- `formatCurrency(amount, currency="GBP")` — `lib/utils/student-dashboard.ts` (Intl-based).
- `formatCurrency(value?)` — a **duplicate** local copy in `business-dashboard/licences/page.tsx`.
- `formatCoursePrice(price, currency)` — `course-purchase-card.tsx`.
- 44 raw `£{x}` / `£{x.toFixed(2)}` concatenations everywhere else.

## Target design

**One money formatter, currency injected — never hardcoded.**

```ts
// src/lib/utils/money.ts
type CurrencyLike =
  | string // an ISO code, e.g. "GBP"
  | { code: string; symbol?: string; minorUnit?: number; prefix?: string; suffix?: string };

/** Format a MAJOR-unit amount (e.g. 79.0) in the given currency. */
export function formatMoney(amount: number, currency: CurrencyLike, locale?: string): string;
```

Two rendering tiers, by data in scope:

- **Tier A — WC data in scope (cart, product cards, checkout):** format from the response's own
  currency fields (`prefix + amount(minorUnit) + suffix`). Highest fidelity — matches exactly
  what WC would render, including custom symbols and symbol placement.
- **Tier B — bare number, no WC response (certificates, business-pricing derived totals, static
  "from £X"):** use the site-settings currency **code** via `Intl.NumberFormat(locale, { style:
"currency", currency: code })`. Locale-aware symbol + decimals, no hardcoding.

**Currency access hook** for Tier B components that only have a number:

```ts
// returns the active currency code from useSiteSettings(), env fallback
export function useCurrency(): string;
```

## Phased migration

Money path first (highest risk if wrong), then catalog, then peripheral.

### Phase A — Foundation

- Add `src/lib/utils/money.ts` (`formatMoney`) + `useCurrency()` hook.
- Fold the existing `formatCurrency` / `formatCoursePrice` into `formatMoney` (keep thin
  re-export shims so nothing breaks in one commit); delete the duplicate in `licences/page.tsx`.
- Unit-test `money.ts`: GBP/USD/EUR, zero-decimal (JPY), minor-unit rounding, prefix/suffix.

### Phase B — Cart + checkout (WC currency already in scope)

Replace hardcoded `£` with the cart's own currency (`useCart().currency`, already backend-driven):
`CartItemRow`, `CartSummary`, `CheckoutOrderSummary`, `MiniCart`, `cart-drawer`,
`PaymentMethodSelector`, `OrderPaymentForm`, `checkout/pay`, `order-confirmation`.
Manual QA the money path after.

### Phase C — Catalog (product currency in scope)

`course-card`, `course-info-card`, `course-purchase-card`, `bundle-card`, `bundle-detail`,
`bulk-discount-table`. Prefer the product's `prices.currency_*`; fall back to `useCurrency()`.

### Phase D — Business pricing + peripheral

`business/pricing/*` (order-summary, order-table, seat-picker, sub-order-summary,
course-search-input), `certificate-form`, `subscription-plans`. These are mostly Tier B →
`formatMoney(x, useCurrency())`.

### Phase E — Enforce

- ESLint `no-restricted-syntax` rule banning the `£` literal in JSX/strings under `src/`
  (allow-list `money.ts`), so it can't creep back.
- Delete the `currency = "£"` default params (`CartSummary`, `useCart`) once every caller passes
  a real currency — the default is a silent hardcode.

## Acceptance

- `grep -rn "£" src | grep -v __tests__` returns only `money.ts` (symbol map, if any).
- Switching the WooCommerce store currency to USD renders `$` end-to-end with no code change.
- One formatter; no duplicate `formatCurrency`. All tests green; money path QA'd.

## Gotchas

- **Minor units:** WC sends integer minor units; `normalizeWCCart` already divides to major. Do
  not double-convert — `formatMoney` takes major-unit numbers.
- **`Intl` vs WC symbol:** `Intl` renders the locale's symbol for a code, which can differ from
  WC's configured `currency_symbol`. Where WC data is in scope (Tier A), use WC's fields for
  exact parity; only use `Intl` for Tier B.
- **SSR locale:** pass an explicit locale (from `next-intl`) into `formatMoney` on server-rendered
  paths, or SSR/CSR output can mismatch and hydration warns.
- **HTML entities:** WC `currency_symbol` can arrive entity-encoded — keep running it through
  `decodeEntities()` (cart already does).

## Sequencing

| Phase | Scope                              | Risk             | Status  |
| ----- | ---------------------------------- | ---------------- | ------- |
| A     | `money.ts` + `useCurrency` + tests | low              | pending |
| B     | cart + checkout                    | med (money path) | pending |
| C     | catalog cards                      | low              | pending |
| D     | business pricing + certificates    | low              | pending |
| E     | ESLint guard + drop `"£"` defaults | low              | pending |
