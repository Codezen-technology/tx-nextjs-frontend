## Context

See `proposal.md` — Why. What shapes the approach here is that all three open rows were parked
for _missing information_, not for difficulty, and the information turned out to be in the
frames:

| Row                             | Was parked because                                       | Read from the frame                                                                                                                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QA-CART-E1`                    | "the report offers two mobile layouts and picks neither" | `6239:114085` — 344-wide controls row: stepper at x=0 (112 wide), `Frame 7657` at x=246 holding price at x=0 and close-circle at x=74. Both to the right, the report's first option                                                                      |
| `QA-CHECK-D1`                   | "a section present in Figma, absent from the build"      | `image 24` — 792×120 at desktop (`6239:134737`), 786×120 laptop, 328×120 mobile, and 261×86 in the Cart summary. Rendered: a bordered white card — lock + "Guaranteed **safe & secure** checkout", a Powered-by-Stripe chip, a rule, a row of card marks |
| `QA-CHECK-A5` (`image 24` half) | "content cannot be read from geometry"                   | Same node. Resolved by rendering the frame rather than measuring it                                                                                                                                                                                      |

Three constraints on the work:

- **The build is already close.** `SecurePaymentBadge` renders the lock line and the four
  marks; it lacks the border, the processor chip and the rule. `RelatedCourses` is complete
  and imported by nothing. `CourseTrustedStrip` is complete and used only by course pages.
  This is wiring and one component rebuild, not new surface area.
- **`/checkout` is unreachable without a cart**, which is why `QA-CHECK-A2` closed as
  `MANUAL-VISUAL` and why the 16px-dropdown assertion runs against `/support-request`. Any
  E2E here must seed a cart first.
- **`checkout-payment-presentation` already ratified a four-brand list.** The new band's
  artwork disagrees with it (below).

## Goals / Non-Goals

**Goals:**

- Close `QA-CART-E1`, `QA-CHECK-D1` and the `image 24` half of `QA-CHECK-A5` from frame
  evidence, so none of them returns to the blocked column.
- One trust band component, rendered on both purchase pages, reading one brand list.
- Assertions that survive the "unreachable without a cart" problem rather than routing around
  it a second time.

**Non-Goals:**

- Redesigning the Cart summary or the payment section beyond the rows named.
- Implementing PayPal. `QA-CHECK-A4` settled that the frame's PayPal row is the design for
  when it exists; it does not exist.
- Adding brand marks beyond the ratified four (see Decision 3).
- Removing the cart thumbnail at mobile, or interpreting `image 22` (see Open Questions).

## Decisions

### 1. Cart mobile — `justify-between` on the controls row, price and remove in one group

The controls row currently reads `flex shrink-0 items-center gap-4 pl-0 sm:gap-6 sm:pl-4`
inside a parent that is `flex-col` below `sm` and `flex-row justify-between` above it. Below
`sm` the row therefore packs left.

The frame's grouping is explicit: stepper alone at x=0, price and close-circle inside one
frame (`6239:114096`) at x=246 with 24px between them. So the fix is `justify-between` on the
controls row plus wrapping the line total and remove button in a group — not `ml-auto` on
each, which would spread all three controls evenly and lose the pairing the frame draws.

_Alternative considered:_ right-align the whole controls row (`justify-end`). Rejected — it
pulls the stepper off the left edge, where the frame anchors it, and at 440px the stepper
would float between the title above and nothing to its left.

Above `sm` nothing changes: the parent's `justify-between` already produces the desktop
arrangement, which `QA-CART-A1` verified field-by-field at 3235px.

### 2. `SecurePaymentBadge` becomes the framed band, and moves to a shared location

Rebuild the existing component rather than add a second one — there is already a lock line and
a mark row on the page, and adding a band beside them would put two safe-and-secure claims in
the same 200px. The rebuilt component gains the border, the Stripe chip and the rule.

It renders in two places: inside `PaymentMethodSelector` (where it already sits, under the pay
button) and inside `CartSummary` under "Proceed to Checkout". It moves out of
`components/checkout/` to a location both pages can import from without the Cart depending on
a checkout-namespaced component.

_Alternative considered:_ leave `SecurePaymentBadge` alone and add a separate cart band.
Rejected — two components making the same claim is exactly the divergence
`checkout-payment-presentation` was written to prevent.

### 3. The band shows four brands, not the artwork's seven — and this is a recorded conflict

⚠️ Rendered, `image 24` draws **seven** marks: Visa, Mastercard, Amex, JCB, Discover, Diners
Club, UnionPay. The design's own payment-method row (`6239:134680`) draws **four**: amex,
discover, mastercard, visa. `QA-CHECK-A3` already resolved this class of disagreement in the
four-mark direction, dropping JCB on the grounds that a card mark is a claim about what the
gateway accepts.

The band therefore renders `CARD_BRANDS` — the same four — and the spec is amended to say so
explicitly, so the next person to open the artwork does not "fix" it back to seven.

If the gateway genuinely accepts JCB, Diners and UnionPay, that is a product fact to confirm
and then a one-line change to `CARD_BRANDS` that updates every surface at once. It is not
something to infer from a Figma bitmap.

_Alternative considered:_ match the artwork exactly. Rejected — it would advertise three
brands the Stripe account may not take, on the one screen where a false acceptance claim costs
a failed payment.

### 4. The Stripe chip is set as text, not vendored as artwork

_Revised during implementation._ The intent was to export Stripe's badge from the frame and
commit it beside the brand marks. `image 24` is a flat raster — a single `rounded-rectangle`
with an image fill, not a layered group — so there is no chip to export; only a crop of a
bitmap, which would ship a fixed-resolution trademark at whatever DPI the crop happened to
have.

The band therefore sets "Powered by Stripe" as text on the artwork's dark chip. The spec asks
for "an indication of the payment processor", which naming Stripe satisfies. Setting the
_wordmark_ in a substitute typeface is exactly the approximation `CardBrandMarks` warns
against, so the chip does not attempt one. If design wants the official badge, it is Stripe's
published SVG dropped into `public/icons/payment/` and one element swapped — recorded, not
guessed at here.

### 5. The trusted strip is already rendered — nothing to add

_Resolved during implementation (task 1.1)._ Design Risk 4 asked whether a shell already
renders a strip. It does: `/cart` and `/checkout` both use `MinimalShell`, which renders
`CourseTrustedStrip` between the header and `<main>`. The `purchase-trust-signals` requirement
for the header strip is satisfied by existing code; the work is to verify and test it, not to
add it.

This also rules the strip out as a reading of `QA-CHECK-D1` — the missing section is the trust
band, as Context concluded from the frames.

### 6. E2E seeds a cart, in the checkout spec, not the fidelity spec

`e2e/checkout.spec.ts` already establishes a cart to reach `/checkout` — the `QA-CHECK-A3/A4/A5`
tests run there. The band assertions belong in that file for the same reason
`QA-CHECK-A1` was asserted on `/support-request`: seeding a cart inside `design-fidelity.spec.ts`
turns a fidelity test into a checkout test.

Cart-side assertions (mobile alignment, related courses, cart band) go in the cart spec at the
`mobile-440` and `desktop-1920` projects added in the round-1 infrastructure work.

## Risks / Trade-offs

- **The four-vs-seven brand conflict is settled by us, not by design** → Recorded here and in
  the amended spec with the reasoning, so it is visible rather than silently baked in. One
  constant to change if design or the gateway rules otherwise.
- **`RelatedCourses` has never rendered in production, and its query was wrong** →
  _Confirmed and fixed during implementation (task 1.2)._ It called `useCourses({ perPage: 3,
orderBy: "popularity" })`, but `GET /courses` accepts `orderby` of `date` or `title` only
  (`API_REFERENCE.md:409`). Wired as written, the section would have shown the three newest
  courses under a heading claiming they were also purchased.

  The backend has a dedicated endpoint for this — `GET /courses/popular`, "courses ordered by
  student count" — already wrapped by `coursesService.popular()` and called by nothing. The
  component now reads that. Enrolment count is not literally co-purchase, but it is a real
  popularity ordering rather than a mislabelled recency one.

- **Adding a section and a band lengthens both pages** → Both are below the primary control at
  every width in the frames, so neither pushes the pay button or the checkout button further
  down.
- **The trusted strip appears on `/cart` and `/checkout`, which use different layouts** →
  Check whether either page already sits inside a shell that renders a strip, to avoid two.
- **Cart mobile change is CSS-only and the row has a passing test suite** →
  `cart-item-row.test.tsx` asserts content, not geometry; the alignment assertion has to be
  E2E at 440px, where a class-name assertion would pass while the layout was wrong.

## Open Questions

- **`image 22`** — 176×40, unnamed, sits above the Cart summary card at all three widths
  (`6239:113962`, `6239:114055`, `6239:114121`). Contents unreadable from geometry, and unlike
  `image 24` it is not adjacent to anything that names it. Needs a rendered look or a design
  ruling. Out of scope here; does not affect the three rows this change closes.
- **The cart thumbnail at mobile** — `Rectangle 10` is `hidden="true"` in every mobile cart row
  (`6239:114081`, `6239:114101`), so the frame drops the product image at 440px. Hidden layers
  in Figma are as often a working state as a decision, and removing product imagery from a
  basket is a content call. Thumbnail stays; flagged for design.
