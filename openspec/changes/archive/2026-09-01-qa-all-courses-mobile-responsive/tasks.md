## 1. Baseline

- [x] 1.1 Point `.env.local` at a reachable WordPress backend and confirm `/all-courses` renders a populated catalogue locally (the API in `.env.local` is currently unreachable — nothing below can be verified without this)
- [x] 1.2 Record the pre-change baseline: `pnpm test:e2e --project=desktop-1920 --project=chromium -g "all-courses"` passes, and `document.scrollWidth` at 440 is 660 against a 440 viewport

## 2. Hero

- [x] 2.1 Rewrite `all-courses-hero.tsx` mobile-first: base is a column stack with a reduced gap, `py-12`, H1 at the smaller size and body at `text-base`
- [x] 2.2 Re-apply the desktop values at `lg:` — `lg:flex-row`, `lg:gap-[179px]`, `lg:py-[112px]`, `lg:text-[40px]`, `lg:text-[20px]` — leaving `minHeight: 320` and the gradient untouched
- [x] 2.3 Confirm the 1920 hero-inset assertion still measures 112 on all four edges

## 3. Filter disclosure

- [x] 3.1 Add `open` state to `course-category-filter.tsx` and a toggle button gated `lg:hidden`, labelled `Course Categories` with the active-selection count when any category is selected
- [x] 3.2 Wire `aria-expanded` and `aria-controls` on the toggle to the category list's id
- [x] 3.3 Render the list as `${open ? "block" : "hidden"} lg:block` so it is unconditionally open from `lg` up and no toggle is present there
- [x] 3.4 Keep the existing "Clear all" control reachable in both states (visible when the list is open, and at `lg` and above as today)

## 4. Catalogue layout

- [x] 4.1 In `all-courses-client.tsx`, make the wrapper `flex-col lg:flex-row` and the `aside` full-width below `lg` (`w-full lg:w-[306px]`), keeping `sticky` only from `lg` up
- [x] 4.2 Verify no in-flow element exceeds the content column at 440 — filter, section headings, category descriptions, CTAs and card grid
- [x] 4.3 Guard the scroll effect with a `useRef` mount flag so `scrollIntoView` runs only on a user selection change

## 5. Tests

- [x] 5.1 Add a `mobile-440`-gated e2e test asserting `/all-courses` has zero horizontal overflow (`scrollWidth === clientWidth`)
- [x] 5.2 Add a `mobile-440`-gated e2e test asserting the category list is hidden on load, the toggle reports `aria-expanded="false"`, and activating it reveals every category
- [x] 5.3 Add an e2e assertion that loading `/all-courses` leaves `window.scrollY` at 0 and that selecting a category moves it
- [x] 5.4 Run `pnpm test:e2e -g "all-courses"` across `desktop-1920`, `chromium` (1280) and `mobile-440`; all pass, including the two pre-existing desktop assertions unchanged

## 6. Close out

- [x] 6.1 `pnpm typecheck`, `pnpm lint`, `pnpm test` clean
- [x] 6.2 Update `docs/qa/QA_BY_PAGE.md`: `QA-COURSES-D1` → `FIXED` with its test reference, Manual note recording that the mobile values are decisions (no 440 frame exists), page index All Courses `1 open` → `0 open` with the colour re-derived
- [x] 6.3 Run `node scripts/qa-doc-check.mjs` (or `pnpm test src/__tests__/qa-doc-check.test.ts`) and confirm the doc's structural assertions pass
- [x] 6.4 Re-check the deployed-page evidence numbers in `proposal.md` against the local build and note any drift in the row
