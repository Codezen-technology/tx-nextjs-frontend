## Context

See `proposal.md` → Why for the defect and the measured payload diff.

The structural facts that shape the approach:

- `/` and `/pricing` already mount the **same** component, `PricingSection`
  (`src/components/home/pricing-section.tsx`). Nothing about the markup, the card
  variants, the badge rendering or the quantity stepper differs between the pages. The
  divergence is entirely in the `HomePricingSection` object each page hands it.
- Both endpoints return that object under the _same_ TypeScript type:
  `HomePageData.pricing` and `PricingPageData.pricing` are both `HomePricingSection`
  (`src/types/home.ts`). So either payload is a drop-in for the other — no adapter, no
  normalisation, no type change.
- `/pricing` **already** calls `serverApi.home.get()`. It uses that response for the
  topbar, trusted orgs and testimonials. The homepage's pricing block is therefore already
  in hand on that page; using it costs no additional fetch and no additional cache tag.
- `PricingCta` branches on `plan.product`: present → add to cart, absent → `router.push`.
  This is why the `/pricing` payload's `product: null` silently degrades the CTA rather
  than erroring. Nothing in the component is wrong; it is faithfully rendering a plan that
  has no product.
- The two `serverApi` calls carry different cache tags (`home`, `pricing`) and both
  revalidate at 300s. Sourcing from `home` means the pricing section on `/pricing`
  revalidates on the `home` tag.

## Goals / Non-Goals

**Goals:**

- One source for the pricing section, so parity is structural rather than maintained.
- No extra network work on `/pricing`.
- Leave the homepage's rendering byte-identical — this change must not be able to regress
  the page that is currently correct.

**Non-Goals:**

- Redesigning the plan card, the badge mapping, or the stepper.
- Fixing or removing the `lms-backend/v1/pricing` endpoint's stale `pricing` block. That
  is backend work in a different repo; this change is deliberately independent of it.
- Reconciling the _local_ backend's plan data with production's three-card layout. The
  screenshots show production serving a third "Business Training" plan that the local
  fixture does not have. The section already renders `plans.length` cards in a
  `lg:grid-cols-3` grid, so a third plan appears with no code change. Card count is data.
- Deduplicating the `PricingPageData` type. See Decisions.

## Decisions

### Source `/pricing`'s pricing section from the home payload, not the pricing payload

`<PricingSection data={pricing?.pricing} />` becomes `<PricingSection data={home?.pricing} />`.

_Why this over the alternatives:_

- **Fix the backend's `/pricing` response instead.** Correct in the long run, and the
  cleanest place for the fix to live. Rejected as the move _here_ because it is a different
  repo and a different work stream, and because it leaves the underlying flaw intact: two
  field groups feeding one section will drift again the next time one is edited. Routing
  the frontend through a single source removes the class of bug, not just today's instance.
  The two are compatible — if the backend block is later corrected, this page keeps
  working, it just stops mattering which one is right.
- **Merge the two payloads field-by-field, preferring whichever is non-empty.** Rejected:
  it makes "which price is showing" depend on which fields an editor happened to fill,
  which is exactly the ambiguity being removed. It would also have picked the _wrong_
  price today (the `/pricing` block is fully populated — it is populated with stale values).
- **Fetch `/home` client-side on `/pricing`.** Rejected: the page is server-rendered and
  already has the data.

_The home payload is the canonical one_ because it is the maintained one: it carries
`product` (WooCommerce ids, sale prices, add-to-cart URLs), current sale pricing
(`£49.00` was `£199.00`), and the badges matching the published design. The `/pricing`
block carries none of that.

_Failure mode:_ if `serverApi.home.get()` fails, `/pricing` loses its pricing section —
where previously it would have shown the stale one. This is the right trade: the section
falls back to absent (already the component's behaviour for empty data, `return null`)
rather than to wrong. The same failure already blanks the topbar, trusted orgs and
testimonials on that page, so it is not a new dependency, only a wider one.

### Gate the header CTA with a prop, defaulted to visible

`PricingSection` gains `showHeaderCta?: boolean` (default `true`); `/pricing` passes
`false`. The existing render condition (`header.ctaHref && header.ctaLabel`) gains this
conjunct.

_Why a prop over the alternatives:_

- **Strip `ctaHref`/`ctaLabel` from the data on the page.** Rejected: mutating a payload to
  drive presentation hides the intent at the point of use, and the next reader has to
  work out why the object was clipped.
- **Have the component compare `ctaHref` to the current route and self-suppress.** Rejected:
  makes a presentational component route-aware, and `usePathname` would force it client-side.
- **Two components.** Rejected: duplicates the thing this change exists to unify.

Defaulting to `true` is what keeps the homepage untouched — the homepage passes nothing and
its behaviour is unchanged by construction. This mirrors `CategoriesGrid`'s `showViewAll`,
already used on this same page for the same reason (recorded in `pricing-page-layout` and
in a comment in `pricing/page.tsx`), so the page reads consistently.

### Keep `PricingPageData.pricing` in the type

The endpoint still returns the field; deleting it from the type would describe the response
inaccurately, and `serverApi.pricing.get()` is still called for `faq`. Marked with a comment
pointing at this change so the next reader does not "restore" the old wiring.

## Risks / Trade-offs

- **The homepage regresses via the shared component** → The only component edit is an
  optional prop defaulting to the current behaviour. Covered by a test asserting the
  homepage still renders the header link.
- **`/pricing` shows no pricing section if `/home` fails** → Accepted deliberately, argued
  above: absent beats wrong when the wrong version quotes an unbuyable price. The page's
  other three sections already share this dependency.
- **Someone later "fixes" the backend `/pricing` block and expects the page to follow** →
  Mitigated by the comment on the type and by the spec requirement, which states the
  single-source rule as behaviour rather than as an implementation note.
- **Cache tag shift**: revalidating the `pricing` tag no longer refreshes the plans on
  `/pricing`; the `home` tag does → Worth stating in the change, but low impact — both tags
  revalidate on the same 300s window, and the page already depends on `home`.

## Migration Plan

Single deploy, no data migration, no feature flag. Rollback is reverting the two files.

## Open Questions

None blocking. One to note for the backend work stream, not for this change: whether
`lms-backend/v1/pricing` should keep returning a `pricing` block at all once no client
reads it, or narrow to `{ faq }`. That decision does not affect these specs, this
approach, or these tasks.
