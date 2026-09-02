## 1. Groundwork

- [x] 1.1 Confirm neither `/cart` nor `/checkout` already renders a trusted strip via a shared shell (design Risk 4) — check both route layouts in `src/app/[locale]/(shop)/`
      → **Both already do.** Each uses `MinimalShell`, which renders `CourseTrustedStrip` between the header and `<main>`. Group 5 became verification, not implementation.
- [x] 1.2 Verify `useCourses({ perPage: 3, orderBy: "popularity" })` is honoured by the WP endpoint (design Risk 2); if `popularity` is not supported, record what the fallback order actually is and decide whether "Customers Also Purchased" is still an honest heading
      → **Not supported.** `/courses` takes `orderby` of `date` or `title` only (`API_REFERENCE.md:409`), so the section would have shown the newest three under a heading about purchases. Switched to `GET /courses/popular` ("ordered by student count") via a new `usePopularCourses` hook; verified live against the local backend.
- [x] 1.3 ~~Export the Powered-by-Stripe chip from the frame and commit it to `public/icons/payment/`~~ — **not possible.** `image 24` is a single raster fill, so there is no chip to export, only a bitmap crop. Set as text instead; design Decision 4 revised with the reasoning and the swap-in path.

## 2. Cart mobile row alignment — `QA-CART-E1`

- [x] 2.1 Wrap the line total and remove button in `CartItemRow.tsx` in a single group, so they move as a pair
- [x] 2.2 Add `justify-between` to the controls row below `sm`, leaving the `sm:` and wider arrangement untouched (design Decision 1)
- [x] 2.3 Confirm at 440px that the stepper sits at the row's left edge and the total + remove sit at its right edge
- [x] 2.4 Confirm at 1280px and 1920px that nothing moved — `QA-CART-A1` verified this arrangement field-by-field

## 3. Trust band — `QA-CHECK-D1`, `QA-CHECK-A5`

- [x] 3.1 Rebuild `SecurePaymentBadge` as the bordered band: lock glyph + "Guaranteed safe & secure checkout", Stripe chip, rule, `CardBrandMarks`
- [x] 3.2 Move it out of `components/checkout/` so `CartSummary` can import it without reaching into a checkout-namespaced folder (design Decision 2); update the `PaymentMethodSelector` import
- [x] 3.3 Keep it reading `CARD_BRANDS` — four marks, not the artwork's seven — and carry the reason forward in a comment, as `CardBrandMarks` does (design Decision 3)
- [x] 3.4 Render it in `CartSummary` beneath "Proceed to Checkout"
- [x] 3.5 Check the band's width and spacing against the frame at each breakpoint: 792×120 desktop (`6239:134737`), 786×120 laptop, 328×120 mobile; 261×86 in the cart summary
      → Measured in a browser at both widths. **Widths match exactly** — checkout 792 at 1920 and 328 at 440; the cart band takes the summary's 320/392 card less its 24px padding, against the frame's 261/344. **Heights run over**: 112 vs 120 at desktop (under, content-driven) and 144 vs 120 at 440, where the assurance line and the processor chip wrap onto two lines in 328px. The frame's band is a fixed-height raster at every width, so it cannot wrap; a real one can. Left as is — forcing 120px at 440 means truncating or shrinking the assurance line, which is the part of the band worth reading.

## 4. Customers Also Purchased

- [x] 4.1 Render `RelatedCourses` on the Cart page below the items/summary grid, above or beside the upsell banner per `6239:113955`
- [x] 4.2 Return `null` from `RelatedCourses` when the query resolves with no courses, so no orphan heading is left (spec scenario "No suggestions are available")
- [x] 4.3 Confirm the grid is 3-up at desktop and laptop and stacked at 440px
      → Measured by card row positions: 3 cards on one row at 1920 and 1280, 3 rows of 1 at 440.

## 5. Trusted strip on the purchase pages

- [x] 5.1 ~~Render~~ Verify `CourseTrustedStrip` beneath the header on `/cart` — already rendered by `MinimalShell`; now covered by a test
- [x] 5.2 ~~Render~~ Verify it beneath the header on `/checkout` — same shell, same finding
- [x] 5.3 Confirm it does not double up with the breadcrumb bar the Cart page already renders, and that the two read in the frame's order
      → No duplication. ⚠️ Order differs at 1920: the desktop frames put the breadcrumb between header and strip (`6239:113881` then `6239:113884`), the build renders the strip first because it lives in the shell and the breadcrumb in the page. The mobile and laptop frames carry no breadcrumb at all, so the build matches them. Left as is — reordering means moving the breadcrumb into the shell, which is outside these rows.

## 6. Tests

- [x] 6.1 `e2e/checkout.spec.ts` — the trust band renders beneath the pay button with its lock line, processor indication and four marks (reuses the existing cart-seeding setup, design Decision 6)
- [x] 6.2 `e2e/checkout.spec.ts` — the band and the payment-method row list the same brands in the same order
- [x] 6.3 Cart E2E at `mobile-440` — the stepper's left edge and the remove control's right edge sit at the row's bounds; assert geometry, not class names (design Risk 5)
      → Mutation-checked: reverting `justify-between` fails it with "the remove control is 173px from the row's right edge".
- [x] 6.4 Cart E2E — "Customers Also Purchased" renders with at most three cards
- [x] 6.5 Cart + checkout E2E — the trusted strip is present beneath the header on both
- [x] 6.6 Unit test for the rebuilt band: it renders the four brands from `CARD_BRANDS`, not a list of its own

## 7. Verification

- [x] 7.1 `pnpm typecheck` clean
- [x] 7.2 `pnpm lint` — no new errors or warnings in changed files
- [x] 7.3 `pnpm test` — full suite passes
- [x] 7.4 `pnpm test:e2e` for the touched specs across `chromium`, `desktop-1920` and `mobile-440`; confirm any failures are in the known pre-existing baseline
- [x] 7.5 `openspec validate fix-cart-checkout-qa-gaps --strict`

## 8. Close the QA rows

- [x] 8.1 `docs/qa/QA_BY_PAGE.md` — move `QA-CART-E1` off BLOCKED-DESIGN, noting the frame resolved the report's two-option ambiguity
- [x] 8.2 `docs/qa/QA_BY_PAGE.md` — move `QA-CHECK-D1` off STILL-BROKEN and close the `image 24` note on `QA-CHECK-A5`, both pointing at the new tests
- [x] 8.3 Record the two deferrals in the same file: `image 22`, and the mobile cart thumbnail the frame hides (design Open Questions)
- [x] 8.4 Update the page-status table's Checkout row from RED

## 9. Deviations from the plan

- **1.3 — no Stripe asset.** `image 24` is a flat raster; the badge cannot be exported from it.
  The chip is text. Design Decision 4 rewritten.
- **Group 5 — nothing to build.** `MinimalShell` already rendered the strip on both pages, so the
  requirement was satisfied before the change opened. Design Decision 5 rewritten; the tasks became
  verification and two E2E assertions.
- **`RelatedCourses` data source changed.** Task 1.2's check failed, so the component reads
  `/courses/popular` rather than the `orderby=popularity` spelling `/courses` ignores.
- **Two new deferrals filed** rather than guessed: `QA-CART-E2` (`image 22`) and `QA-CART-E3` (the
  frame hides the cart thumbnail at 440).
