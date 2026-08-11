## Why

The "Our courses" mega menu opens on hover but **never closes on hover-out**. Once open, the panel stays up until the user clicks, presses Escape, or navigates. Worse, while it is open the entire header — logo, search box, the trigger itself, every nav link — becomes unclickable and unhoverable.

Root cause, confirmed by live DOM instrumentation against `localhost:3000` (viewport 1440×900):

- `MegaMenu` renders a backdrop `<div className="fixed inset-0 -z-10" onClick={onClose} />` **as a DOM child of `#mega-menu`** (`src/components/layout/mega-menu.tsx:207`).
- `#mega-menu` is `absolute z-50`, which creates a stacking context, so the `-z-10` backdrop sits behind the panel's own content but still **above all page and header content**, and it covers the full viewport.
- Hit tests at four points while the menu is open all resolve to that backdrop:
  | point | element under pointer |
  | --- | --- |
  | trigger button (864, 82) | `DIV.fixed inset-0 -z-10` |
  | header search input (1180, 40) | `DIV.fixed inset-0 -z-10` |
  | logo (80, 60) | `DIV.fixed inset-0 -z-10` |
  | far bottom of page (200, 880) | `DIV.fixed inset-0 -z-10` |
- Because the backdrop is a descendant of `#mega-menu`, the pointer is _always_ inside the `#mega-menu` subtree. `mouseleave` therefore never fires, the `HOVER_CLOSE_DELAY_MS` timer is never armed, and `setMegaMenuOpen(false)` is never called.

Measured behaviour (`src/components/layout/header.tsx` on `qa-report-progress-tracker`):

| scenario                                        | current           | expected   |
| ----------------------------------------------- | ----------------- | ---------- |
| hover trigger                                   | opens ✅          | opens      |
| slow pointer across trigger→panel gap           | stays open ✅     | stays open |
| pointer moved to (200, 880), 600 ms wait        | **stays open ❌** | closes     |
| pointer wandered across the whole viewport      | **stays open ❌** | closes     |
| header search/logo/trigger clickable while open | **no ❌**         | yes        |

Reference behaviour on the live WordPress site (`https://trainingexcellence.org.uk/`, `#courses-dropdown-template` toggling `display: none/block`): opens on hover, survives a slow crossing of its 42 px trigger→panel gap, and **closes when the pointer moves away**. The live site uses no viewport-covering backdrop; the element under the far point is ordinary page content (`<p>`). The headless rebuild is a regression against the site it replaces.

A secondary defect: there is a **25.5 px dead gap** between the trigger's bottom edge (`y=92.5`) and the panel's top edge (`y=118`, `absolute top-full` on the `<header>` whose `py-5` padding creates the gap). Today that gap is bridged only by the 150 ms JS close timer. Once the backdrop bug is fixed and `mouseleave` starts firing, a slow diagonal pointer across that gap will start closing the menu — so the gap must be closed structurally as part of this fix, not left to the timer alone.

## What Changes

- Remove the full-viewport backdrop from inside `#mega-menu`. Outside-click dismissal moves to a document-level `mousedown` listener (the pattern already used by `NavDropdown`, `CourseSearch`, and `CartButton` in the same file), so no element ever covers the header or the page.
- Bridge the 25.5 px trigger→panel dead gap with a CSS-only hover bridge (a transparent `::after` on the trigger spanning the gap), so hover intent survives the crossing regardless of pointer speed — the JS timer stops being load-bearing for geometry.
- Keep the JS-owned open state and the 150 ms close delay. The delay stays as forgiveness for diagonal travel along the panel edge, not as the gap bridge.
- Keep all existing non-hover affordances working: click toggle, `Escape`, `aria-expanded`, focus/blur, and close-on-route-change.
- Add regression coverage: an E2E case asserting the menu closes on pointer-away, and one asserting the header stays interactive while the menu is open. `e2e/qa-round-1.spec.ts:184` currently only covers the open path.

### Should this be CSS-only?

No — evaluated and rejected. A pure `group-hover:` / `:hover` solution is not viable here:

- **Wrong DOM shape.** The trigger lives in `nav > div` (row 2), the panel is `absolute top-full` on `<header>`. Their nearest common ancestor is `<header>`, so a CSS `:hover` rule would open the mega menu when the pointer is anywhere in the header — including the logo and the search box.
- **Non-hover entry points still need state.** Click toggle, `Escape`, focus/blur, `aria-expanded`, and the `useEffect` that closes on `pathname` change all require a React state value. CSS cannot drive `aria-expanded`.
- **Mount cost.** CSS hover requires the panel to be permanently mounted (`{megaMenuOpen && <MegaMenu/>}` would become unconditional), putting 9 category links plus the promo block and its images in the DOM on every page.

The change therefore keeps JS as the state owner and uses CSS only for the geometry problem (the hover bridge), which is exactly what CSS is good at here.

## Capabilities

### New Capabilities

- `site-header-navigation`: hover, click, and keyboard behaviour of the desktop site header's "Our courses" mega menu and dropdowns — open, close, dismissal, and the requirement that the rest of the page stays interactive while a menu is open.

### Modified Capabilities

None — no existing spec in `openspec/specs/` covers header navigation behaviour.

## Impact

- `src/components/layout/mega-menu.tsx` — remove the child backdrop div; the panel no longer owns dismissal.
- `src/components/layout/header.tsx` — outside-click listener for the mega menu; CSS hover bridge on the "Our courses" trigger; `useHoverIntent` unchanged in shape.
- `e2e/qa-round-1.spec.ts` — extend the existing mega-menu test with close-on-pointer-away and header-interactivity assertions.
- No API, data, or dependency changes. Desktop (`lg` and up) only; mobile nav uses the separate `mobileOpen` click flow and is untouched.
