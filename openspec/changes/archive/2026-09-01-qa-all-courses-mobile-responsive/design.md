## Context

See `proposal.md` — Why for the measured defect. Design-relevant current state:

- `all-courses-client.tsx` is the only consumer of `course-category-filter.tsx` and `courses-by-category-section.tsx`. It is a client component already (`useState` for the selection), so adding disclosure state costs nothing structurally.
- The page's horizontal geometry comes from `container` / `--page-grid-*` in `globals.css`. Nothing in this change may restate those values — `page-grid` forbids it, and the 1280 assertion `all-courses content sits on the page grid at 1280` measures exactly that.
- Two existing e2e assertions pin desktop geometry: hero inset **112** at 1920 (`3306:50115`) and content edge **128** at 1280. Both must keep passing untouched; they are the regression net for this change.
- There is **no Figma frame for `/all-courses` at 440**. The report item says only "the mobile responsive needs to be done properly". Mobile values therefore come from the site's own established mobile conventions (`blog-hero.tsx`, `category-courses.tsx`, `--page-grid-pad` = 24, `py-section` = 20), not from a measured node. Every such value is a decision recorded here, not a design target — the same distinction `page-grid` draws between a measured target and a written decision.
- Local verification: the WP API in `.env.local` (`tx-local-site.test`) was unreachable when this was written and came back up before implementation, so the specs ran locally after all. Playwright's `webServer` spawns `pnpm dev` on port 3000; when that port belongs to another workspace, run with `CI=1 PLAYWRIGHT_BASE_URL=http://localhost:<port>` against an already-running dev server. Baseline evidence in the proposal came from the deployed page and reproduced locally (660 against 440).

## Goals / Non-Goals

**Goals:**

- One breakpoint governs the whole page's mobile/desktop split, so the hero, the rail and the grid cannot disagree.
- Desktop rendering at 1280 and 1920 is byte-for-byte what ships today.
- The collapse behaviour survives SSR without a hydration mismatch and without a JS media query.

**Non-Goals:**

- Any change to the 1280 or 1920 layout, including the hero inset and the page grid.
- Pagination, lazy-mounting or virtualisation of the 297 rendered cards (see `proposal.md` — What Changes).
- A mobile treatment for the hero's decorative wave. It is clipped by its own `overflow-hidden` wrapper, contributes no scroll width, and `QA-COURSES-D2` owns it.

## Decisions

### The breakpoint is `lg` (1024), applied mobile-first

Below `lg` the page is one column; at `lg` and above it is the rail layout that ships today. `lg` is the smallest width at which the 306px rail, the 24px gap and a three-column card grid all fit inside the content column, and it is the breakpoint `category-courses.tsx` already uses for its grid ramp.

The classes are written mobile-first — base values are the 440 ones, `lg:` re-applies the desktop ones — rather than adding `max-lg:` overrides on top of the current desktop-first classes. Desktop-first is how the current defect arose: a value with no breakpoint reads as "all widths" and nobody notices until 440.

Alternative considered: `md` (768). Rejected — the rail plus a two-column grid inside a 768 viewport leaves the card column under 400px, which is the same squeeze in a milder form.

### The filter collapses via CSS class, not a media query hook

`CourseCategoryFilter` gains `open` state and renders:

- a toggle button with `lg:hidden`, so it is absent from the desktop accessibility tree;
- the category list with `${open ? "block" : "hidden"} lg:block`, so it is always open at `lg` and above regardless of the state value.

This keeps the server and first client render identical (state starts closed, CSS decides visibility), which a `useMediaQuery`-style hook cannot do — it renders the mobile branch on the server and flips after hydration. The trade-off is that the collapsed list stays in the DOM at 440; that is acceptable here (seventeen `<li>` on the deployed catalogue) and it keeps the toggle a pure visibility control.

The toggle carries `aria-expanded` and `aria-controls`, and its label reports the active count (`Course Categories (2 selected)`), which is the same information the desktop rail conveys by simply being visible.

### The hero re-applies its measured values at `lg`

`gap-[179px] py-[112px] text-[40px]` become `lg:` variants over mobile-first bases (column stack, `py-12`, smaller H1, `text-base` body). `lg:` — not `2xl:` — because 1280 currently renders the 112px inset and the report signs 1280 off as working; gating at `2xl` would silently change the 1280 band this change is not scoped to touch.

The `minHeight: 320` inline style stays: at 440 the stacked content exceeds it, so it is inert there, and removing it would change the desktop band.

### The scroll effect is guarded by a mount ref

`useEffect` keyed on `selected` keeps firing after the results have re-rendered — which is what makes the scroll land correctly — but a `useRef(false)` guard skips the first invocation. The alternative, calling `scrollIntoView` inside the toggle handler, runs before React commits the new list and scrolls to the pre-update layout.

Setting `history.scrollRestoration` or otherwise touching browser scroll restoration is out — the ref guard already leaves a restored position alone, because a restore is not a selection change.

### The 440 guard asserts overflow, not pixels

The new e2e assertions run in the existing `mobile-440` project and check `document.scrollWidth === clientWidth`, the filter's collapsed/expanded state, and the toggle's `aria-expanded`. They deliberately do not assert mobile paddings or font sizes: those are decisions taken here, not measured targets, and pinning them would make an unreviewed value read as a design contract — the failure mode `QA-COURSES-A2` records.

## Risks / Trade-offs

- **The mobile values have no design authority** → recorded as decisions in this document and in the row's Manual note, asserted only as "fits the viewport". A later frame supersedes them without invalidating the tests.
- **Regressing the 1280/1920 layout while editing shared components** → every desktop value moves to an `lg:` variant in the same edit that adds its mobile base, and the two existing all-courses assertions are the acceptance gate.
- **A row marked FIXED on an unrun test** is the exact failure `docs/qa/QA_BY_PAGE.md` was rebuilt to prevent → resolved: the all-courses specs ran green at 1920, 1280 and 440 (16 passed, 8 viewport-skipped) against the local backend before the row was moved.
- **297 cards still ship to the phone** → out of scope and stated as such; the layout fix makes the page usable, not fast. Worth filing separately once this lands.
- **Collapsed-by-default hides the filter from mobile users who want it** → the toggle reports the active count so a filtered state is never silently invisible, and selecting a category still scrolls to the results.
