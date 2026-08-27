## Context

See `proposal.md` — Why, for the measured defect and its root cause.

Constraints that shape the approach:

- **DOM shape is fixed by the layout.** The mega menu is a full-bleed panel spanning the viewport width. It is `absolute top-full right-0 left-0` on `<header className="relative">`. The trigger is nested several levels deeper, inside `nav > div` (row 2 of the desktop nav). Trigger and panel are not siblings and their nearest common ancestor is the whole header.
- **Measured geometry** (1440×900, `localhost:3000`): trigger box `y 71.5 → 92.5`; header box `y 0 → 118`; panel box `y 118 → 678`. Dead gap = **25.5 px**, created by the header container's `py-5`.
- **The file already has a house pattern for outside-click**: `NavDropdown`, `CourseSearch`, and `CartButton` each register a `document` `mousedown` listener and compare against a `ref`. The mega menu is the only one using an overlay div, and it is the only one that is broken.
- **Live-site parity target**: `https://trainingexcellence.org.uk/` toggles `#courses-dropdown-template` between `display: none/block`, has a 42 px trigger→panel gap of its own, and closes correctly on pointer-away with no overlay in the way.

## Goals / Non-Goals

**Goals:**

- `mouseleave` on the mega menu fires when it should — i.e. nothing menu-owned sits under the pointer outside the panel's real bounds.
- The trigger→panel gap stops being a hover hazard, independent of the close-delay value.
- Outside-click dismissal keeps working, and the click that dismisses also lands on its intended target.
- The fix is verifiable by hit-testing and pointer-move E2E, not by eyeballing.

**Non-Goals:**

- Redesigning the mega menu's layout, contents, or visual treatment.
- Touching the mobile nav (`mobileOpen`), which is click-driven and unaffected.
- Adding an animated open/close transition. Out of scope; the panel stays a conditional mount.
- Introducing a headless-UI / Radix menu primitive. That is a larger refactor of all four header popovers and should be its own change if wanted.

## Decisions

### D1 — Delete the backdrop; move outside-click to a document listener

`mega-menu.tsx` drops the `<div className="fixed inset-0 -z-10" onClick={onClose} />` entirely. `header.tsx` gains a `document.addEventListener("mousedown", ...)` guard, active only while `megaMenuOpen`, that closes the menu when the event target is outside both the trigger ref and the panel. Requires a ref on the trigger button and a ref forwarded to (or a `getElementById("mega-menu")` lookup from) the panel; a ref is preferred.

_Why:_ it is the exact pattern already used three times in the same file, so there is one dismissal idiom in the header instead of two. It also fixes a second, quieter bug — with a backdrop, the first click anywhere is swallowed by `onClose` and never reaches the link the user aimed at. `mousedown` on `document` closes the menu but leaves the subsequent `click` to reach its real target.

_Alternatives considered:_

- _Keep the backdrop, move it to a sibling of `#mega-menu`._ Fixes `mouseleave`, but still covers the header (so hovering the trigger while open does nothing) and still eats the first click.
- _Keep the backdrop, add `pointer-events-none`._ Then it cannot receive the click it exists for. Self-defeating.

### D2 — Bridge the 25.5 px gap with a CSS pseudo-element, not a bigger timer

A transparent `::after` on the "Our courses" trigger, spanning from the trigger's bottom edge down past the header's bottom edge:

```
after:absolute after:top-full after:left-0 after:h-6 after:w-full after:content-['']
```

with `relative` on the button. The trigger's hover region then touches the panel's top edge with no dead space, so `mouseleave` on the trigger does not fire mid-crossing at all.

_Why:_ the gap is a geometry problem, and geometry is what CSS is for. Relying on a timer means the correct delay depends on how fast the user moves — a 150 ms budget to cross 25.5 px fails a slow or interrupted pointer, and lengthening it makes every legitimate close feel sticky. The bridge is invisible, costs nothing at runtime, and does not extend the trigger's _click_ target in a way users can perceive (it sits over the header's own padding, where there is nothing else to click).

_Alternatives considered:_

- _Raise `HOVER_CLOSE_DELAY_MS` to ~300 ms._ Papers over the gap and makes pointer-away closing feel laggy. Rejected as the primary mechanism.
- _Remove the header's `py-5` so the panel is flush._ Changes the header's visual rhythm to fix a hover bug. Rejected.
- _Give the panel a negative top offset._ Would overlap the header's bottom border and shift the panel's shadow. Rejected.

### D3 — Keep JS as the state owner; CSS handles geometry only

No `group-hover:` / `:hover` panel toggle. Rationale is in `proposal.md` — "Should this be CSS-only?": the nearest common ancestor is the whole header (so `:hover` would open on the logo), `aria-expanded` / `Escape` / click / route-change all need React state, and CSS hover would force the panel to be permanently mounted.

_Kept:_ `useHoverIntent` and `HOVER_CLOSE_DELAY_MS = 150`, unchanged. Post-fix its only job is forgiveness for a pointer that clips the panel's edge while travelling — which is what a close delay should be for.

### D4 — Verify by hit-test, not by screenshot

The E2E additions assert two things the old test could not have caught:

1. After `page.mouse.move()` to a point outside the panel and a wait longer than the close delay, `#mega-menu` is detached.
2. While the menu is open, `document.elementFromPoint()` at the logo, the search input, and the trigger each returns that control (or one of its descendants) — not a menu-owned node.

_Why:_ the defect is invisible in a screenshot — the page looks right, it just does not respond. Hit-testing states the requirement directly.

## Risks / Trade-offs

- **The `::after` bridge enlarges the trigger's clickable area downward by ~24 px** → It lies over the header container's bottom padding, which holds no other interactive element at the trigger's x-range; a click there toggles the menu, which is the same thing the trigger does. Accepted.
- **`mousedown` on `document` closes the menu before the ensuing `click`** → this is intended (it is why the first click now reaches its target), but it means a mousedown-drag started outside the panel closes the menu. Same behaviour as the three existing dropdowns in the file; consistent, so accepted.
- **Removing the backdrop removes an implicit "modal" affordance** → the mega menu was never modal (no focus trap, no `aria-modal`), so nothing is lost. `role="dialog"` on the panel is arguably wrong for a nav menu, but changing it is out of scope for this fix.
- **Once `mouseleave` starts firing, previously-masked close-timing bugs may surface** → this is why D2 ships in the same change rather than after it; the gap bridge is a prerequisite for the close path being usable, not an optional polish.
- **The bridge height is coupled to the header's `py-5`** → if the header padding changes, `after:h-6` must change with it. Mitigated by a comment at the call site naming the measured gap (25.5 px) and its source.

## Migration Plan

Single commit, no data or config change, no flag. Rollback is a straight revert of the two component files and the E2E file. Verification is `pnpm test:e2e` on the extended `qa-round-1.spec.ts` plus a manual pass at 1440 px against the live site's behaviour.
