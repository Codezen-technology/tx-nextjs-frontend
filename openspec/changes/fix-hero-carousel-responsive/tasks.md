## 1. Card stack geometry

- [x] 1.1 In `src/components/home/hero-carousel.tsx`, add a `DESIGN_SPAN` constant (660) and a card design width constant (306), documenting that they come from the Figma node the existing `CARD_OFFSETS` comment already cites.
- [x] 1.2 Convert each `CARD_OFFSETS` entry's `x` into a percentage of `DESIGN_SPAN` at render time; keep the raw pixel `x` in the table so the existing snap-vs-glide comparison and its `SNAP_THRESHOLD` keep working unchanged.
- [x] 1.3 Replace each card's `w-76.5` and `translateX(...)` with `left: <x/660>%` and `width: <306/660>%`, leaving `translateY` and `scale` in the `transform` and keeping `transformOrigin: "top left"`.
- [x] 1.4 Give the strip a bounded width — `w-full max-w-165` on the `h-130` container — so cards never render wider than the 306px design size on large screens.
- [x] 1.5 Update the `CARD_OFFSETS` comment block itself (not the style prop) to describe the fraction-of-span model and state why `left` is used instead of a percentage `translateX`.

## 2. Breakpoint parity

- [x] 2.1 Change the carousel root in `hero-carousel.tsx` from `hidden lg:flex lg:flex-1 lg:flex-col` to the `xl` equivalent so it appears only where the hero row is horizontal.
- [x] 2.2 Change the single-card fallback in `src/components/home/hero-section.tsx` from `lg:hidden` to `xl:hidden` so exactly one presentation renders at every width.
- [x] 2.3 Re-check the hero row's `lg:` utilities in `hero-section.tsx:47` (`lg:max-w-350`, `lg:items-center`, `lg:py-20`) against the now-`xl` row direction, and move any that only make sense in row layout.

## 3. Hero course data source

- [x] 3.1 Replace `coursesService.list({ perPage: 4, orderBy: "popularity", order: "desc" })` in `hero-section.tsx` with `serverApi.courses.popular(4)` plus `normalizeCourse`, mirroring `src/components/home/popular-courses.tsx`.
- [x] 3.2 Keep degrading to `[]` on a thrown fetch. An earlier draft propagated the error to avoid caching a failure; the build manifest shows `/[locale]` is `ƒ` (Dynamic), so there is no prerendered page to preserve and throwing would 500 the homepage instead of dropping one section. Degrading also preserves the invariant `src/lib/api/fetch-timeout.ts` (#32) relies on.
- [x] 3.3 Drop the now-unused `coursesService` import if the categories fetch is the only remaining consumer, and leave a comment on the categories fetch noting it still uses the Axios path.
- [x] 3.4 Compare the hero's course list before and after the swap against the local WordPress backend. Note that the two endpoints differ by contract: `/courses` documents `orderby` as `date` or `title` only (`API_REFERENCE.md:409`), so the old call's `orderby=popularity` was silently ignored, while `/courses/popular` genuinely orders by student count (`API_REFERENCE.md:501`). Both returned the same four slugs in the same order on the local backend, but the ordering is not guaranteed identical in general — the new path is the one that actually honours the intent.

## 4. Regression coverage

- [x] 4.1 In `e2e/hero-carousel.spec.ts`, correct the stale `hidden lg:flex` header comment to reflect the `xl` breakpoint.
- [x] 4.2 Add an E2E case that, at 1280, 1300, 1440 and 1920px viewports, asserts every hero card's `getBoundingClientRect().right` is `<=` the hero content container's right edge — measuring against the container, not `document.scrollWidth`, because `overflow-x-clip` makes the latter pass regardless.
- [x] 4.3 Add an E2E case that at 440, 768 and 1024px the single fallback card is visible and the carousel nav (`Previous course` / `Next course`) is absent, and that at 1280px the inverse holds.
- [x] 4.4 Verify `document.documentElement.scrollWidth` still equals the viewport width at every asserted breakpoint, preserving the existing homepage-overflow requirement.

## 5. Verification

- [x] 5.1 Run `pnpm typecheck` and `pnpm lint`.
- [x] 5.2 Run `pnpm test` and `pnpm test:e2e` against a running dev server.
- [x] 5.3 Manually confirm at 1024, 1280, 1300, 1440 and 1920px that exactly one course presentation shows and nothing is clipped.
- [x] 5.4 Run `openspec validate fix-hero-carousel-responsive --strict`.
