## Why

The "Enjoy Unlimited Training, Save More!" section renders differently on `/` and `/pricing`,
even though both pages mount the same `PricingSection` component. The homepage shows the
current, sale-priced, cart-wired plans; `/pricing` — the page a visitor lands on _after_
clicking "View more details" from that very section — shows a stale, cheaper-looking,
non-purchasable variant of the same offer.

Measured against the live backend (`tx-local-site.test`), the two payloads disagree on
every field that matters:

|                                    | `GET /home` → `pricing` (homepage) | `GET /pricing` → `pricing` (`/pricing` page) |
| ---------------------------------- | ---------------------------------- | -------------------------------------------- |
| Monthly Access price               | `£49.00`, was `£199.00`            | `£29` `/Year`, no was-price                  |
| Monthly Access badge / variant     | `best-value` / `navy`              | none / `default`                             |
| Premium Access badge               | `most-popular`                     | `best-value`                                 |
| Premium Access CTA                 | `Get Started`                      | `Join Now`                                   |
| `product` (WooCommerce id + price) | present on both plans              | **`null` on both plans**                     |
| Header CTA                         | `View more details` → `/pricing`   | empty                                        |

The `product: null` row is the damaging one. `PricingCta` adds to cart only when
`plan.product` exists; with no product it falls through to `router.push(plan.ctaHref)`.
So on `/pricing` the quantity stepper is decorative, "Get Started" and "Join Now" merely
navigate to `/register`, and the price shown is one no longer sold. A visitor who follows
the homepage's own link is quoted the wrong price and cannot buy.

Two separate editor-managed field groups feed the same section. That is the defect: the
section has two sources of truth, and only one of them is maintained.

## What Changes

- `/pricing` renders its pricing section from the **home** payload — the same object the
  homepage renders — making the two sections identical by construction rather than by
  two editors keeping two field groups in step. The home payload is already fetched on
  `/pricing` (for the topbar, trusted orgs and testimonials), so this costs no extra request.
- The header call to action is suppressed on `/pricing`. Its target is `/pricing`; left in
  place it becomes a link to the page you are already on. `PricingSection` takes a prop for
  this, matching the `showViewAll={false}` precedent already established for
  `CategoriesGrid` on this page.
- `serverApi.pricing.get()` stays — `/pricing` still reads its FAQ from that payload. Only
  the `pricing` block of that response goes unused.
- Not changed: the `PricingSection` component's markup, the plan card design, badge
  mapping, quantity stepper, or `PricingCta` behaviour. The section is already correct; only
  the data reaching it on one page is wrong.

## Capabilities

### New Capabilities

None. The behaviour belongs to a spec that already exists.

### Modified Capabilities

- `pricing-page-layout`: adds a requirement that the pricing section on `/pricing` is
  sourced from the same payload as the homepage's, and that its header call to action is
  omitted on `/pricing` (the same per-page configuration rule the categories section
  already follows in this spec).

## Impact

- `src/app/[locale]/(marketing)/pricing/page.tsx` — pass `home?.pricing`; add the
  header-CTA opt-out.
- `src/components/home/pricing-section.tsx` — new optional prop gating the header CTA;
  defaults to showing it so the homepage is untouched.
- `src/types/home.ts` — `PricingPageData.pricing` becomes unread by the app. Left in the
  type: the endpoint still returns it, and removing the field would misdescribe the
  response.
- No backend change required, and none assumed. The `lms-backend/v1/pricing` endpoint's
  own `pricing` block remains stale; this change routes around it rather than waiting on
  it. Correcting or retiring that field group is separate backend work.
- Tests: `/pricing` gains coverage asserting parity with the homepage's rendered plans.
