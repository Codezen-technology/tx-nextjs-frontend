## Context

`CourseCard` (`src/components/courses/course-card.tsx`) is the single shared course-preview card, consumed by `courses-grid.tsx`, `featured-courses.tsx`, `courses-by-category-section.tsx`, `category-courses.tsx`, `home/popular-courses.tsx`, `course-related.tsx`, `cart/RelatedCourses.tsx`, and `bundles/bundle-detail.tsx`. It currently:

- Has a rating/bookmark row present in JSX but commented out ("Hide until bookmark section is implemented").
- Renders promo badges as tick-pills (`bg-secondary-50` / `text-secondary-900` / `Check` icon) — this part already matches the new Figma design closely, no change needed.
- Shows meta as `{count} Module(s)` / duration / `{count} Students` — value-first, pluralized module label.
- Uses a dashed divider (`border-dashed`) above the price row.
- Shows price + an outlined pill link ("View Course →").
- Conditionally renders `<SaleCountdown endsAt={course.sale.saleEndsAt} />` below everything — a live countdown to the real WooCommerce sale end date, full-width red text line, hidden once expired or absent.

The Figma reference (node `5905:90316`) shows: a live rating/bookmark row, unchanged badge pills, `Modules {n}` / duration / `Students {n}` (label-first for two of three), a solid divider, a solid full-width CTA pill ("View Course", no arrow), a compact "OFFER ENDS IN / HH : MM : SS" block beside the price (not a full-width line below), and a diagonal "TOP SELLER" ribbon on the image corner.

Per explicit product direction (not inferred from Figma, which only shows one static countdown value in the mock): the countdown must show a **static 6-hour period on a recurring cycle**, not a live countdown to the real `sale_ends_at`.

## Goals / Non-Goals

**Goals:**

- Match the Figma layout/visual design for the shared `CourseCard`.
- Implement the countdown as a synthetic, globally-synchronized recurring timer: period = 6 hours, computed from wall-clock time only, no per-course state, no dependency on `course.sale.saleEndsAt`.
- Keep the countdown gated on the course actually being on sale (`sale.isOnSale` / existing price-comparison fallback) — it should not appear on full-price courses.
- Reuse existing data only: `course.rating`, `course.ratingCount`, `course.badges` (no new API fields).

**Non-Goals:**

- No real bookmark/wishlist persistence — the bookmark button is visual-only (no click handler wired to a backend) in this change. A future change can add the real feature.
- No backend changes to `course-card-promotions`' API contract (`badges`, `sale.*`, `cpd_points` stay as-is) — `sale.sale_ends_at` remains in the API response for potential other consumers, just no longer read by this card's countdown.
- Not changing `CourseCardSkeleton`'s loading layout beyond what's needed to avoid layout shift (kept minimal/proportional, not pixel-matched to the new design).

## Decisions

- **Recurring countdown math**: `PERIOD_MS = 6 * 60 * 60 * 1000`. On each tick: `remainingMs = PERIOD_MS - (Date.now() % PERIOD_MS)`. This is stateless and self-resetting — no `useEffect`-driven reset logic needed, no server coordination, and it's automatically identical across every card and every browser (same wall-clock, same modulo result), which matches "recurring" cleanly. Alternative considered: per-mount `now + 6h` target with manual reset-on-zero (rejected — needs extra reset logic and would desync between cards mounted at different times, undermining the shared "OFFER ENDS IN" claim across a grid of cards).
- **New component**: replace `sale-countdown.tsx`'s `SaleCountdown` (takes `endsAt`, real-date-driven) with a new `OfferCountdown` (no props needed beyond optional `className` — it's derived purely from wall-clock time). `SaleCountdown` has exactly one call site (`course-card.tsx`), confirmed via repo search, so it's safe to fully replace rather than keep both. Ticks every second via `setInterval`, same pattern as the existing component (`"use client"`, `useState` + `useEffect`).
- **Display format**: `"OFFER ENDS IN"` (small uppercase label, `text-[#4a617e]`/`text-neutral-400`-equivalent) above `HH : MM : SS` (bold, red `#DB0302`/`text-red-600`-equivalent, spaced colons per the Figma text literal `02 : 14 : 32`), positioned in the price row's right side (replacing the current CTA-button position — the CTA moves to its own full-width row below, per the design).
- **Gating**: keep existing `isOnSale` derivation (`course.sale?.isOnSale ?? (originalPrice > price)`) unchanged — only the _displayed value_ of the countdown changes, not when it appears.
- **Ribbon**: `showRibbon = (course.badges ?? []).includes("bestseller")`. When true, render the ribbon and drop `"Bestseller"` from the text-pill list (avoid showing the same claim twice). Implemented as a small absolutely-positioned SVG/CSS ribbon shape (diagonal clipped rectangle) with a star + rotated "TOP SELLER" text — matches the Figma asset closely enough without needing to import a raster SVG asset (keeps it themeable/no asset-expiry risk, per the Figma-asset 7-day-URL constraint).
- **Meta row relabel**: `Modules {course.modules_count ?? 0}` (drop `pluralize`, matches the design's invariant "Modules" label), `Students {formatted count}` (swap current suffix order to prefix), duration stays value-only (already matches design, no prefix in either).
- **CTA button**: swap the outlined pill `<Link>` for a solid full-width pill (`bg-secondary-500 text-white rounded-full h-10 w-full`), text "View Course" (no arrow), still a `<Link href={`/course/${slug}`}>` for correct SEO/crawlability (not a `<button>`).
- **Rating/bookmark row**: un-comment, wire `course.rating` (fallback display only if present — do not fabricate a rating when the API returns none, unlike the old commented code's `?? "4.5"` fallback, which would have shown a fake rating on courses with no reviews). Render nothing for the rating side if `course.rating` is undefined, matching the project's "don't fabricate content" convention elsewhere in this card (e.g., duration/students already conditionally render).

## Risks / Trade-offs

- **[Risk]** The synthetic countdown displays a countdown claim ("OFFER ENDS IN") disconnected from the real sale end date — a customer could see the timer hit zero and reset while the actual underlying WooCommerce sale is unaffected (or vice versa: the real sale could end while the on-screen timer still shows time remaining). → **Mitigation**: none applied automatically — this is the explicitly requested behavior; flagged in the proposal for visibility. If this needs revisiting, the fix is straightforward (swap `OfferCountdown` back to real-`saleEndsAt`-driven `SaleCountdown` logic).
- **[Risk]** Every on-sale card across the entire site shows the exact same countdown value at the same moment (by design, since it's wall-clock-derived) — a user comparing two different course cards will notice both timers are identical, which could look like an obvious fake-urgency pattern. → **Mitigation**: accepted trade-off per explicit "recurring timer" instruction; no per-course jitter was requested.
- **[Risk]** Removing the "Bestseller" text pill when the ribbon shows changes existing visual behavior for any course that already has the `bestseller` badge today. → **Mitigation**: low risk, cosmetic only, and avoids visually redundant messaging (ribbon already says the same thing more prominently).

## Migration Plan

- Single component-level change, no data migration. Ship behind normal PR review — since `CourseCard` is shared, a visual smoke test across `/all-courses`, homepage, and a course detail page's related-courses rail is the verification step (see tasks.md).
- Rollback: revert the component/hook changes; no persisted state or API contract changes to unwind.
