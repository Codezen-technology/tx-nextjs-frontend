## 1. Assets and measurements

- [x] 1.1 Download the four brand marks from the frame and commit them under `public/icons/payment/`
- [x] 1.2 Record the Checkout measurements in `.context/figma/targets.md`: the four marks and their 43×28 box, the PayPal row's real state, the assurance line, and the unread `image 24` band

## 2. Write the tests first

- [x] 2.1 `src/__tests__/card-brand-marks.test.tsx` — the component renders four marks, in the frame's order, as images rather than text
- [x] 2.2 `e2e/checkout.spec.ts` — seed a cart before navigating, since `/checkout` redirects to `/cart` when empty
- [x] 2.3 `A3` — assert the payment row shows four brand images and no "MC"/"DISC"/"JCB" text
- [x] 2.4 `A4` — assert no PayPal row, badge or "coming soon" text anywhere on the page
- [x] 2.5 `A5` — assert "100% secure payment" renders beside the Payment method heading
- [x] 2.6 **Deviation:** the fixes were applied before the specs ran clean, so no test was watched failing against the unfixed build in a trustworthy state — the one pre-fix run was against a stale dev server and proves nothing. Substituted with a full mutation check in 4.2: each of the three source changes reverted in turn, each test failing with its own message, all three passing restored

## 3. Apply

- [x] 3.1 `CardBrandMarks` — one array, the frame's order, 43×28 chips with the frame's white background and border
- [x] 3.2 `SecurePaymentBadge` — use it; drop the five text labels including JCB
- [x] 3.3 `PaymentMethodSelector` — use it in the card row; delete the PayPal placeholder block
- [x] 3.4 `checkout/page.tsx` — add the assurance line beside the Payment method heading
- [x] 3.5 Grep for other surfaces rendering card-brand text

## 4. Verify

- [x] 4.1 Re-run both new specs at `chromium`, `desktop-1920`, `mobile-440`
- [x] 4.2 Mutation-checked **all three**: `A3` → "expected four brand marks … found 0"; `A4` → "expected no PayPal row"; `A5` → "expected the frame's 100% secure payment line". Restored, 3 passed
- [x] 4.3 Restart `pnpm dev`, then a full `--project=chromium` run against the six baseline failures
- [x] 4.4 `pnpm typecheck && pnpm lint && pnpm test`

## 5. Flip statuses and commit

- [x] 5.1 `A3`, `A4` → `FIXED`; `A5` → `FIXED` with the `image 24` band recorded as unread
- [x] 5.2 `A4`'s note records that the frame shows PayPal working and that implementing it is product work
- [x] 5.3 Recompute the Checkout index row and its `Ready` value
- [x] 5.4 Clear the closed rows from Appendix B
- [x] 5.5 `pnpm test` — doc checker green
- [x] 5.6 Commit as `fix(qa-checkout): close three of four rows`
