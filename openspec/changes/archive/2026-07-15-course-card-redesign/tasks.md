## 1. Recurring offer countdown

- [x] 1.1 Create `src/components/courses/offer-countdown.tsx` exporting `OfferCountdown` — `"use client"`, `PERIOD_MS = 6 * 60 * 60 * 1000` constant, `remainingMs = PERIOD_MS - (Date.now() % PERIOD_MS)`, `useState` + `setInterval` (1s tick), format `HH : MM : SS` (padded, spaced colons per Figma: `02 : 14 : 32`)
- [x] 1.2 Style: small uppercase "OFFER ENDS IN" label above bold red `HH : MM : SS` value, matching Figma (`text-[#4a617e]`-equivalent label, `text-red-600`/`#db0302`-equivalent value)
- [x] 1.3 Delete `src/components/courses/sale-countdown.tsx` (confirmed single call site, in `course-card.tsx`, being replaced)

## 2. Course card: rating + bookmark row

- [x] 2.1 Un-comment and rework the rating/bookmark row in `course-card.tsx`: render rating number + star + `(N Reviews)` only when `course.rating` is defined (no `?? "4.5"` fabricated fallback); keep the bookmark button visual-only (`aria-label="Bookmark course"`, no onClick side effect)
- [x] 2.2 Match Figma spacing/sizing for this row (rating left, bookmark button right, `justify-between`)

## 3. Course card: Top Seller ribbon

- [x] 3.1 Add `showRibbon = (course.badges ?? []).includes("bestseller")` in `course-card.tsx`
- [x] 3.2 Build the ribbon as CSS/SVG (no imported raster asset — Figma asset URLs expire in 7 days): diagonal red ribbon shape, star icon, rotated "TOP SELLER" text, positioned top-right of the image (`absolute`, matches Figma's ~40px-wide ribbon)
- [x] 3.3 When `showRibbon` is true, exclude `"bestseller"` from the rendered text-pill badge list (avoid duplicating the claim) — keep `BADGE_LABELS` mapping for the other keys unchanged

## 4. Course card: meta row, divider, CTA

- [x] 4.1 Change modules meta item to `Modules {course.modules_count ?? 0}` (drop `pluralize` for this field; remove the `pluralize` import if it becomes unused in this file)
- [x] 4.2 Change students meta item to `Students {formatted count}` (swap from current suffix order to label-first, keep the existing `k+` formatting for ≥1000)
- [x] 4.3 Leave duration meta item as-is (already label-less, matches design)
- [x] 4.4 Change the divider from `border-dashed` to a solid 1px line (`border-t border-neutral-30` or equivalent solid border token)
- [x] 4.5 Replace the outlined "View Course →" pill `<Link>` with a solid full-width pill: `bg-secondary-500 text-white rounded-full h-10 w-full justify-center`, text "View Course" (no arrow), still `<Link href={`/course/${course.slug}`}>`
- [x] 4.6 Move the price row's right side to the `OfferCountdown` (task 1) when the course is on sale; move the CTA button to its own full-width row below the price row (per Figma: price+countdown row, then full-width button row)

## 5. Wire it together + verify

- [x] 5.1 Replace `<SaleCountdown endsAt={saleEndsAt} />` with `<OfferCountdown />`, gated on the same `isOnSale` condition already in the component (no change to the gating logic itself)
- [x] 5.2 Remove the now-unused `saleEndsAt` local variable if nothing else reads it
- [x] 5.3 Update `CourseCardSkeleton` proportions minimally if the new layout shifts height (rating row, split price/CTA rows) enough to cause loading-state layout shift — keep it simple/proportional, not pixel-matched
- [x] 5.4 `pnpm typecheck` passes
- [x] 5.5 `pnpm lint` passes
- [x] 5.6 Visual check in browser: `/all-courses` (grid) and homepage popular-courses section — confirmed meta labels ("Modules N", duration, "Students N"), solid divider, solid full-width "View Course" CTA, and recurring countdown all render correctly and tick down every second. Rating row and bookmark button confirmed present (no rating shown on current dataset — no course has `rating` set, which is correct per spec: no fabricated fallback). No course in the current dataset has the `bestseller` badge, so the ribbon wasn't visually confirmed live — logic (`badges.includes("bestseller")`) verified by code review and typecheck. Caught and fixed a real bug during this check: `OfferCountdown`'s initial `Date.now()`-based state caused an SSR/client hydration mismatch — fixed by starting state as `null` and setting the real value in `useEffect` (client-only)
- [x] 5.7 Confirmed: on `/all-courses`, 3 different on-sale cards all showed `02:47:03` → `02:36:34` (same value, ticking together) at the same moment; on the homepage, 4 different cards all showed `02:34:31` together — synchronized wall-clock timer confirmed working across pages
