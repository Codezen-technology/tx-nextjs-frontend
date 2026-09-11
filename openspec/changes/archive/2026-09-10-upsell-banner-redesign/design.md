## Context

The UpsellBanner component (`src/components/cart/UpsellBanner.tsx`) displays a membership upsell in the cart and checkout pages. It fetches data from `GET /lms-backend/v1/membership-upsell` and renders a promotional banner. The current design uses a dark navy theme that doesn't match the updated Figma designs (node 6239:113930).

## Decisions

### Decision 1: Use beige gradient background

**Current**: Navy gradient (`#00204a → #1c395e`)
**New**: Beige gradient (`#f5f1e9 → #e1d2ba`) matching pricing section

**Rationale**: Consistent brand theme across promotional components.

### Decision 2: Badge uses pricing section pattern

**Current**: Blue gradient badge, absolute top-right
**New**: White background + triangle corner (same as `pricing-section.tsx:61-76`)

**Rationale**: Reuse existing pattern for consistency.

### Decision 3: Dynamic CTA label from API

**Current**: Hardcoded "Add to Cart" / "Get Started"
**New**: Use `upsell.cta_label` from API response

**Rationale**: Backend controls the CTA text, more flexible.

### Decision 4: Remove "View more details" link

**Current**: Shows link below CTA button
**New**: Remove entirely

**Rationale**: User confirmed not needed.

### Decision 5: 3-column flex layout

**Current**: Single column stack
**New**: `[name+price] [features] [button]` flex layout

**Rationale**: Matches Figma design, better use of horizontal space.

## Risks

- **API backward compatibility**: Adding `cta_label` to `MembershipUpsell` type — backend must include this field
- **Layout responsiveness**: 3-column may need stacking on mobile (already handled with `flex-col sm:flex-row`)
