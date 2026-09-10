## Context

See `proposal.md` — Why, for the two reproduced defects. The details that constrain the approach:

- `hero-carousel.tsx` positions three cards with `position: absolute` and a `CARD_OFFSETS` table of literal pixels (`x: 0 / 177 / 383`, `scale: 0.905 / 1.0 / 0.905`, card `w-76.5` = 306px). Right edge of the stack = `383 + 306 × 0.905` = **660px**. Because the cards are out of flow, the strip's intrinsic width is 0 and the parent's width is decided by the nav row instead.
- `hero-section.tsx:47` — the hero row is `flex-col` until `xl:flex-row` (1280px), while the carousel is `hidden lg:flex` (1024px) and the single-card fallback is `lg:hidden`. The 1024–1279px band therefore renders the carousel into column flow with `lg:items-center`, giving it `width: auto` → the 140px nav row, and hides the fallback card.
- The hero `<section>` carries `overflow-x-clip`, so the overflow is silent rather than producing a scrollbar. The existing spec requirement "The homepage never scrolls wider than the viewport" is satisfied _because_ of that clip, which is exactly why the bug went unnoticed.
- `serverApi.courses.popular(perPage)` already exists in `src/lib/api/server.ts:426` with `revalidate: 300, tags: ["courses:popular"]`, and `popular-courses.tsx` already consumes it via `normalizeCourse`. The hero is the outlier that reaches for the Axios `coursesService` instead.
- Existing coverage: `e2e/hero-carousel.spec.ts` asserts navigation behaviour only, at Playwright's default 1280px viewport, and its header comment documents the now-incorrect `lg` assumption.

## Goals / Non-Goals

**Goals:**

- One geometry model for the card stack that is correct at any container width, verified by measurement rather than by eye at 1440px.
- A single breakpoint governing "carousel vs single card", so the two presentations cannot both be off.
- The hero's course read behaves like every other server-rendered homepage read.
- Regression coverage that would have caught the 1300px clip.

**Non-Goals:**

- Redesigning the carousel's visual language (offsets ratio, scale, stacking order, shadow, transition timing, snap behaviour) — the Figma composition is preserved, only its units change.
- Making the carousel work below 1280px. The design's three-card stack needs more horizontal room than the 1024–1279px band leaves after the headline column; the fallback card is the intended presentation there.
- Touching `CourseCard` internals or the WordPress endpoints.
- Removing `overflow-x-clip` from the hero section. It stays as a backstop; this change makes it stop doing load-bearing work.

## Decisions

### 1. Express the card stack in percentages of a bounded strip, not pixels

Convert `CARD_OFFSETS` from absolute pixels to fractions of the 660px design span, and give the strip `w-full max-w-165` (660px). Each card becomes `left: (x / 660)%` with `width: (306 / 660)%` ≈ 46.36%, and the `transform` keeps only `translateY` and `scale` with `transformOrigin: top left`.

_Why not `translateX` percentages:_ a percentage in `translateX` resolves against the **element's own** width, not the parent's, so `translateX(26.8%)` of a 306px card is 82px — not the 177px intended. `left` resolves against the containing block, which is what the layout actually means. Keeping `scale` in the `transform` preserves the existing depth effect and the `transition-all duration-500` glide (which now animates `left` instead of `transform` — both are animatable, and the existing snap-vs-glide logic compares the numeric `x` from the table, so it is unit-agnostic and needs no change).

_Alternatives considered:_

- **Fixed 660px stage + CSS `scale()` on the wrapper.** Uniform shrink, visually closest to Figma at every width — but it scales the type down with it, so card text gets smaller on smaller desktops, and hit targets shrink. Rejected.
- **Container queries with `cqw` units.** Equivalent result to percentages but requires establishing a container and is harder to read; percentages already resolve against the same box. Rejected as unnecessary machinery.
- **JS `ResizeObserver` measuring the strip.** Adds a client-side measure/paint cycle and a layout-shift window for something CSS resolves natively. Rejected.

At 1280px (the narrowest width where the carousel now shows) the strip gets `1280 − 636 (headline column) − 48 (gap)` = 596px, so cards render at ~276px against the 306px design width — a ~10% squeeze, which the card's existing internal layout absorbs. `max-w-165` prevents cards ever rendering _larger_ than the Figma size on wide screens.

### 2. Move the carousel breakpoint to `xl`, matching the hero row

The carousel becomes `hidden xl:flex`, and the single-card fallback becomes `xl:hidden`. Both now switch at the same 1280px boundary where the hero row turns horizontal.

_Why raise the carousel rather than lower the row to `lg`:_ dropping the row to `lg:flex-row` would hand the carousel `1024 − 636 − 48` = 340px, rendering cards at ~157px wide — a stack too small to read. The 1024–1279px band is better served by the single-card presentation that already exists and is already styled for it. This is the one deliberate behaviour change users will notice, and it replaces a band that currently shows _no_ usable card at all.

### 3. Reuse `serverApi.courses.popular` and mirror `popular-courses.tsx`

Replace `coursesService.list({ perPage: 4, orderBy: "popularity" })` with `serverApi.courses.popular(4)` + `normalizeCourse`, exactly as `popular-courses.tsx` does. This puts the read in the Next data cache under the `courses:popular` tag, makes it revalidatable on demand via `/api/revalidate`, and drops the RSC-side Axios call.

_Why this matters beyond tidiness:_ `WP_REST_BASE` (`src/lib/env.ts:94`) is derived only from `NEXT_PUBLIC_WP_API_URL` and ignores the server-only `WP_API_URL` override, so the Axios path in a Server Component is also the one path that silently misconfigures itself in deployments that set only the private var. `serverFetch` uses `getServerWpJsonBase()`, which honours both.

### 4. Route the hero read through the cached fetcher, and keep degrading on failure

The first draft of this design also removed the `catch { return [] }`, on the theory that a transient failure was being baked into a 300s ISR page cache. The build manifest disproves the premise: `/[locale]` builds as `ƒ` (Dynamic, server-rendered on demand), not `●`. There is no prerendered homepage and no stale copy for Next.js to fall back on, so the "keep serving the last successfully generated page" behaviour that justified propagating does not apply here. Throwing would simply turn a hero missing its carousel into a 500 for the entire homepage.

So the change is narrower than first planned: swap the transport, keep the degradation.

- **Successful response, empty list** → render the hero without a course region.
- **Fetch threw** → return `[]`. Next.js does not cache a failed fetch, so the next request retries rather than serving an empty list for the rest of the window.

This also preserves the invariant `src/lib/api/fetch-timeout.ts` (#32) depends on — "Every server-side caller in this app already degrades on a thrown error" — which a propagating hero would have broken, reintroducing exactly the deploy failure that commit fixed.

_What the transport swap still buys:_ the read joins the Next data cache under the `courses:popular` tag with `revalidate: 300`, so a successful response is shared across requests instead of re-fetched per render, and it can be purged on demand through the `POST /api/revalidate` endpoint added in #38. It also drops an RSC-side Axios call whose base URL comes from `WP_REST_BASE` (`src/lib/env.ts`), which reads only `NEXT_PUBLIC_WP_API_URL` and ignores the server-only `WP_API_URL` override; `serverFetch` uses `getServerWpJsonBase()`, which honours both.

_Consequence for the reported bug:_ the intermittency the user saw is explained by the layout defect alone (decisions 1 and 2), which is width-determined and reproducible. The data path was a second hypothesis that assumed full-page ISR caching; it does not hold, and this decision no longer claims it.

## Risks / Trade-offs

- **1024–1279px loses the carousel** → Accepted and intentional: that band currently shows a 140px-wide clipped stack and no fallback card, so a single readable card is strictly better. Called out explicitly in the spec so it is not mistaken for a regression later.
- **Cards render ~10% narrower at 1280–1439px than the Figma frame** → The card's internal layout is already fluid (`w-full` media, `line-clamp-2` title with fixed `h-14`, wrapping badge row), so this compresses rather than breaks. Verified by measurement at 1280 and 1300 as part of the task list.
- **A failed hero fetch still renders a hero with no course region**, silently → Accepted: the homepage is dynamic, so the alternative is a 500 for every visitor rather than a degraded hero for the few requests that fail. The failure surfaces through Sentry and through the `courses:popular` tag going unfilled, not through the page.
- **`transition-all` now animates `left`** → `left` on an absolutely positioned element is not GPU-composited the way `transform` is, so the glide could jank on low-end hardware with four cards. Four small nodes at 500ms is well within budget; if it proves visible, the fallback is a fixed-width stage with a wrapper scale (decision 1's rejected alternative).
- **`overflow-x-clip` keeps masking future geometry regressions** → Mitigated by asserting card right edges against the container in E2E, not just `document.scrollWidth`, since the clip guarantees the latter passes regardless.
