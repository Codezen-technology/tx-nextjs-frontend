## 1. Evidence

- [x] 1.1 Record the cart field-by-field enumeration against `6239:113878`
- [x] 1.2 Record the Pricing categories-section read, and **why the earlier read was inconclusive** — a left-third crop hides a right-aligned link
- [x] 1.3 Record that the Homepage frame keeps the link, citing `QA-HOME-A7`'s measurement

## 2. Failing tests first

- [x] 2.1 Restart `pnpm dev`, warm `/cart` and `/pricing`
- [x] 2.2 `QA-CART-A1` — assert a cart row labels its unit price; watch it fail
- [x] 2.3 `QA-PRICE-A3` — assert `/pricing`'s categories heading row has no "view all courses" link **and** the homepage's still does; watch the Pricing half fail and the Homepage half pass

## 3. Implementation

- [x] 3.1 Add the `Price:` label to `CartItemRow`'s unit price
- [x] 3.2 Give `CategoriesGrid` a flag for its CTA, defaulting to shown
- [x] 3.3 Opt the Pricing page out
- [x] 3.4 Re-run 2.2 and 2.3 green

## 4. Mutation check

- [x] 4.1 Remove the `Price:` label, confirm its assertion fails, restore
- [x] 4.2 Flip the Pricing call site back, confirm the Pricing half fails, restore
- [x] 4.3 Remove the link from the shared component entirely, confirm the **Homepage** half fails — the guard against closing this row by breaking the other page

## 5. Docs

- [x] 5.1 Both rows → `FIXED` with their test references and what was measured
- [x] 5.2 `QA-CART-A1`'s note records that only one field was missing
- [x] 5.3 `QA-PRICE-A3`'s note records the crop correction
- [x] 5.4 Page index — Cart and Pricing recounted; `Ready` recomputed
- [x] 5.5 State the board's remaining shape: Class D and Class E only

## 6. Gate

- [x] 6.1 `pnpm typecheck` clean
- [x] 6.2 `pnpm lint` — no new errors
- [x] 6.3 `pnpm test` — green including the doc checker
- [x] 6.4 Restart `pnpm dev`, warm the routes, full `pnpm test:e2e`; compare against the baseline
- [x] 6.5 `openspec validate qa-cart-pricing-rows --strict`
- [x] 6.6 Commit
