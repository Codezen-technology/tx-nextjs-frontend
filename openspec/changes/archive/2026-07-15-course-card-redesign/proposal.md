## Why

The shared course card (`src/components/courses/course-card.tsx`) — used across `/all-courses`, the homepage, related-courses rails, cart, and search — no longer matches the approved Figma design (node `5905:90316`). The design adds a rating/bookmark row (currently commented out in code), a "Top Seller" ribbon, reordered meta labels, a solid full-width CTA button, and replaces the full-width "Offer expires in HH:MM:SS" bar with a compact "OFFER ENDS IN" block beside the price. Per explicit direction, the countdown itself becomes a synthetic marketing-urgency timer (fixed 6-hour recurring cycle) rather than a live countdown to the real `sale.sale_ends_at` from the API.

## What Changes

- Enable the currently-commented-out rating row (`course.rating` / `course.ratingCount`) and add a decorative bookmark button (visual only — no wishlist/persistence backend exists, out of scope here).
- Reorder meta-row labels to match the design: `Modules {count}` and `Students {count}` (label-first), duration unchanged (no label prefix).
- Change the section divider from dashed to a solid 1px line.
- Replace the outlined "View Course →" pill link with a solid full-width pill button (`bg-secondary-500`, white text, "View Course", rounded-full, no arrow).
- Add a "TOP SELLER" ribbon on the image, driven by the existing `badges` array containing `"bestseller"` (reuses existing data, no new API field). When the ribbon is shown, suppress the redundant "Bestseller" text pill to avoid duplicate messaging.
- **BREAKING (display semantics)**: Replace `SaleCountdown` (real countdown to `course.sale.saleEndsAt`) with a new synthetic recurring countdown: a fixed 6-hour period, computed purely from wall-clock time (`Date.now() % 6h`), so it resets automatically every 6 hours and is perfectly synchronized across every card/page-load — independent of the actual `sale.sale_ends_at` value. Still gated on `sale.isOnSale` (or the existing price-comparison fallback) so it only appears alongside a real discount. Visual style changes from a full-width red text line to a compact two-line "OFFER ENDS IN" / "HH : MM : SS" block next to the price.

## Capabilities

### New Capabilities

(none — this extends the existing course-card-promotions capability)

### Modified Capabilities

- `course-card-promotions`: the countdown requirement changes from "live countdown to the API's `sale.sale_ends_at`" to "synthetic recurring 6-hour countdown, gated on `sale.isOnSale`". New requirements added for the rating/bookmark row, the Top Seller ribbon, and the updated meta-row/CTA layout.

## Impact

- **Frontend files**: `src/components/courses/course-card.tsx` (main edit), a new/replaced countdown component (`src/components/courses/sale-countdown.tsx` repurposed or replaced), possibly a small shared `useRecurringCountdown` hook.
- **No backend changes** — all data already available (`badges`, `rating`, `ratingCount`, `sale.isOnSale`); the countdown display no longer depends on `sale.sale_ends_at` at all.
- **Blast radius**: every consumer of `CourseCard` (courses grid, featured courses, homepage popular courses, related courses, cart related-courses, bundle detail, search/blog embeds) picks up the new design automatically since it's the single shared component.
- **Risk**: the synthetic countdown is a deliberate product/marketing decision (explicitly requested) that decouples the on-screen "offer ends in" claim from the real sale end date — flagged here for visibility, not something introduced silently.
