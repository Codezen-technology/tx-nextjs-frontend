## Why

The course purchase card's tab system needs to match the updated Figma designs. Currently, the "Individual" and "Business" tabs share similar content with auto-switching behavior tied to quantity changes. The new designs call for distinctly different experiences: Individual shows pricing with a toggleable bulk pricing table, while Business presents a team-focused value proposition with a "Request a Quote" CTA.

## What Changes

- **Remove auto-tab-switch**: Quantity changes no longer trigger tab switches. The tab stays on whichever the user selected.
- **Individual tab gains bulk pricing toggle**: A "See Bulk Pricing" / "Hide Bulk Pricing" link toggles visibility of the bulk discount table within the Individual tab.
- **Bulk pricing table moves**: From Business tab to Individual tab (shown only when toggled open).
- **Business tab completely reworked**: Removes price display, quantity stepper, and bulk table. Replaces with "Built for Your Whole Team" heading, descriptive text, team benefit bullet points, and "Request a Quote" CTA linking to `/contact-us/`.
- **"Extra X% saved" badge**: Shows on Individual tab when quantity > 1 and a bulk tier applies.
- **Tab labels already updated**: "For me" → "Individual", "For teams" → "Business" (completed in prior work).
- **Currency formatting**: Bulk discount table uses `Intl.NumberFormat` to properly display currency symbols (e.g., "GBP" → "£").

## Capabilities

### New Capabilities

- `purchase-card-tabs`: The tab system governing Individual vs Business purchase experiences, including tab selection, content rendering per tab, and the bulk pricing toggle.

### Modified Capabilities

- `single-course-page`: Tab names changing from "For me"/"For teams" to "Individual"/"Business". Tab behavior changing (no auto-switch). Business tab content completely replaced.

## Impact

- `src/components/courses/course-purchase-card.tsx` — Major rewrite of tab content and state logic
- `src/__tests__/course-purchase-card.test.tsx` — Tests need updating for new behavior
- `src/components/courses/bulk-discount-table.tsx` — Restyle to match Figma (remove checkmark column, update colors)
- `openspec/specs/single-course-page/spec.md` — Requirements about tab names and hover behavior need updating
