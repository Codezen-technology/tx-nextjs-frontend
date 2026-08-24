## Why

Checkout has four open rows. The report's node (`6239:134328`) is a section holding
**Desktop, Laptop and Mobile** frames, and reading it settles three of them — and corrects
the report on two points:

| Row           | Ref               | Report says                                                   | Frame says                                                                                                              |
| ------------- | ----------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `QA-CHECK-A3` | `R-CHECK-1920-01` | "the logos of the VISA, **JCB** etc. are not actual logos"    | Four marks — **amex, discover, mastercard, visa**. No JCB anywhere                                                      |
| `QA-CHECK-A4` | `R-CHECK-1920-02` | "the paypal coming soon is not needed here"                   | PayPal is a **real, selectable row** — with no "coming soon" badge and no dimming                                       |
| `QA-CHECK-A5` | `R-CHECK-1920-05` | "add trusted lines like money back guarantee, secure payment" | One line — **"100% secure payment"** beside the Payment method heading — plus a 792×120 image band under the pay button |
| `QA-CHECK-D1` | `R-CHECK-1920-03` | a missing section                                             | Class D, untouched                                                                                                      |

The build renders brand names as **text in boxes** — `["VISA","MC","AMEX","DISC","JCB"]` in
`SecurePaymentBadge` and `["VISA","MC","AMEX","DISC"]` in `PaymentMethodSelector`. Two
lists, neither matching the other or the frame.

## What Changes

- **`A3`** — the four brand marks from the frame, exported and committed as SVGs, rendered
  through one shared component so the two lists cannot drift again. JCB goes: the frame
  does not have it, and a payment mark is a claim about what the gateway accepts
- **`A4`** — remove the PayPal placeholder. The frame shows PayPal as a working option, and
  the build cannot process one, so what ships today advertises a method that does not work.
  Implementing PayPal is product work, recorded on the row
- **`A5`** — add the frame's "100% secure payment" line beside the Payment method heading.
  The 792×120 image band stays open on the row: it is an unnamed rectangle in the frame and
  what it contains cannot be read from geometry
- **`D1`** — untouched

## Capabilities

### New Capabilities

- `checkout-payment-presentation`: what the checkout page may claim about payment — which
  brand marks it shows, and that it does not advertise a method it cannot process

## Impact

**Code**

- `src/components/checkout/CardBrandMarks.tsx` — new, one source for the mark list
- `src/components/checkout/SecurePaymentBadge.tsx`, `PaymentMethodSelector.tsx`
- `src/app/[locale]/(shop)/checkout/page.tsx` — the secure-payment line
- `public/icons/payment/*.svg` — four marks exported from the frame

**Tests**

- `e2e/checkout.spec.ts` — new; seeds a cart first, because `/checkout` redirects to
  `/cart` when empty
- `src/__tests__/card-brand-marks.test.tsx` — new

**Not affected:** the Stripe flow, billing, order summary, `/checkout/pay`.
