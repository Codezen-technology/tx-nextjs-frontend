## 1. Remove the viewport-covering backdrop

- [x] 1.1 Delete the `<div className="fixed inset-0 -z-10" aria-hidden="true" onClick={onClose} />` block from the end of `MegaMenu` in `src/components/layout/mega-menu.tsx` (currently line 207).
- [x] 1.2 Drop `onClose` from `MegaMenuProps` if the Escape-key `useEffect` is the only remaining consumer — decide whether Escape handling stays in the panel or moves to the header alongside the other close paths; keep it in one place, not both.
- [x] 1.3 Add a `ref` (or forwarded ref) on the panel root `#mega-menu` so the header can test containment without a `getElementById` lookup.
- [x] 1.4 Verify by hit-test: with the menu open, `document.elementFromPoint()` at the logo, the header search input, the "Our courses" trigger, and a point in the page body below the panel must each resolve to that control or to page content — never to a menu-owned node.

## 2. Restore outside-click dismissal in the header

- [x] 2.1 Add a `ref` to the "Our courses" trigger button in `src/components/layout/header.tsx`.
- [x] 2.2 Register a `document` `mousedown` listener while `megaMenuOpen` is true that calls `setMegaMenuOpen(false)` when the event target is outside both the trigger ref and the panel ref — mirroring the existing pattern in `NavDropdown`, `CourseSearch`, and `CartButton` in the same file.
- [x] 2.3 Confirm the dismissing click still reaches its intended target: with the menu open, clicking a link in the page body must both close the menu and navigate.

## 3. Bridge the trigger → panel gap in CSS

- [x] 3.1 Add `relative` plus a transparent `::after` bridge to the "Our courses" trigger — `after:absolute after:top-full after:left-0 after:h-7 after:w-full after:content-['']` — so the trigger's hover region reaches the panel's top edge. (`h-7` = 28 px, not the 24 px of `h-6`: the gap measured 25.5 px, so `h-6` would leave a 1.5 px dead strip.)
- [x] 3.2 Add a short comment at the call site recording the measured 25.5 px gap and that it comes from the header container's `py-5`, so the bridge height is maintainable.
- [x] 3.3 Re-measure after the change: trigger hover-region bottom must be ≥ the panel top (`y = 118` at 1440×900), leaving no dead space.
- [x] 3.4 Leave `HOVER_CLOSE_DELAY_MS` at 150 ms and update the comment above it — its job is now diagonal-travel forgiveness, not gap bridging.

## 4. Confirm the non-hover paths still work

- [x] 4.1 Click toggle on the trigger opens and closes the menu.
- [x] 4.2 `Escape` closes the menu, from both the trigger and inside the panel.
- [x] 4.3 `aria-expanded` on the trigger tracks the open state in every path (hover, click, Escape, outside click, navigation).
- [x] 4.4 Following a link inside the panel closes the menu on the destination page (the `pathname` effect).
- [x] 4.5 The `Resources` `NavDropdown` is unchanged and still opens on hover, focus, and click.

## 5. Regression tests

- [x] 5.1 Extend the mega-menu test in `e2e/qa-round-1.spec.ts` (currently line 184) with a close-on-pointer-away case: open the menu, `page.mouse.move()` to a point outside the panel, then assert `#mega-menu` is detached and `aria-expanded` is `"false"`.
- [x] 5.2 Add a header-interactivity case: with the menu open, assert `elementFromPoint` at the logo, the search input, and the trigger each resolves outside `#mega-menu`.
- [x] 5.3 Add a slow-gap-crossing case: step the pointer from the trigger into the panel with waits longer than the close delay between steps, and assert the panel stays visible.
- [x] 5.4 Run `pnpm test:e2e` against a running dev server and confirm the whole `qa-round-1` suite is green.

## 6. Verification and sign-off

- [x] 6.1 Run `pnpm typecheck` and `pnpm lint`.
- [x] 6.2 Manual pass at 1440 px: side-by-side against `https://trainingexcellence.org.uk/` — open on hover, survive the gap, close on pointer-away, header stays interactive.
- [x] 6.3 Check the mega menu at the `lg` breakpoint boundary and confirm the mobile nav (`mobileOpen`) is untouched.
