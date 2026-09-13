## Why

The current UpsellBanner component uses a dark navy design that doesn't match the updated Figma designs. The banner needs to be restyled to use the beige gradient theme consistent with the pricing section, with proper badge treatment, dynamic CTA label from the API, and removal of the unused "View more details" link.

## What Changes

- **Background**: Navy gradient → beige gradient (`#f5f1e9 → #e1d2ba`)
- **Badge**: Blue gradient absolute position → white background with triangle corner (matching pricing section pattern)
- **Badge text**: Dynamic from API `badge` field (styling only, not hardcoded)
- **Product name color**: `#01aee0` → `#9e6f21` (secondary-500)
- **Price color**: White → `#00204a` (neutral-900), strikethrough `#dc3545` for regular price
- **Features**: White text → `#00204a`, icons → green tick-circle SVG (matching pricing section)
- **CTA button**: Gradient border → solid `#9e6f21` background, text from API `cta_label` field
- **Remove**: "View more details" link
- **Layout**: Single column → 3-column flex (`[name+price] [features] [button]`)
- **Padding**: `p-6` → `p-8` (32px)
- **Border + Shadow**: Add `border-[#ebedf1]` and `shadow-[0px_2px_2px_rgba(0,0,0,0.08)]`
- **Type update**: Add `cta_label` field to `MembershipUpsell` interface

## Capabilities

### New Capabilities

- `upsell-banner`: Redesigned membership upsell banner with beige theme, dynamic badge, and 3-column layout

### Modified Capabilities

<!-- None — this is a visual redesign of an existing component, no spec-level behavior changes -->

## Impact

- `src/types/settings.ts` — Add `cta_label` to `MembershipUpsell` interface
- `src/components/cart/UpsellBanner.tsx` — Full JSX redesign per Figma
- `src/components/home/pricing-section.tsx` — Reference for badge pattern (no changes)
- `/icons/tick-circle-green.svg` — Existing icon used for feature checkmarks
