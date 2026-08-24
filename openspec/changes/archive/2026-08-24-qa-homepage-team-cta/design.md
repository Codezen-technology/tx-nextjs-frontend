## Context

See `proposal.md — Why`. The two rows and what was measured:

**`QA-HOME-A8`.** The report pairs 9.1 ("there is an image on the right side of the section, but the image is not visible") with 9.2 ("the button has no hover effect"), so the section is the one holding the team photographs — `transform-team.tsx`, heading "Transform Your Team with Us", CTA "Request a Quote". 9.1 is already filed as `QA-HOME-C3`, `CONTENT-GAP`: prod serves `/images/team/collaboration-{1,2,3}.jpg` and all three 404.

Measured at 1920 with the section scrolled to centre:

| Property                               | Value                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| CTA classes                            | `bg-secondary-600 hover:bg-secondary-700 … transition-opacity hover:opacity-90` |
| Resting fill                           | `rgb(144, 101, 30)`                                                             |
| `transition-property`                  | `opacity` — **not** `background-color`                                          |
| `elementFromPoint` at the CTA's centre | **`img.absolute.inset-0.object-cover`**                                         |
| Backdrop `pointer-events`              | `auto`                                                                          |
| Playwright `.hover()`                  | times out — "intercepts pointer events", 60 retries                             |

The backdrop is `<Image fill className="absolute inset-0 object-cover">`, positioned; the content wrapper below it is a static `.container`. Positioned elements paint above non-positioned siblings, so the image covers the section. `pointer-events` is `auto`, so it consumes the pointer.

**`QA-HOME-A10`.** The frame's footer (`3306:50227`) was screenshotted and read: the Certificate Validator body is the same sentence the build ships, to the word. The report asks to shorten copy the design specifies, and supplies no replacement.

**Sweep.** Five routes were hit-tested for controls covered by something else. One real finding — the CTA above. The header's category links report as blocked by sibling links, which is the sweep measuring a closed dropdown, not a defect; stated as a limitation rather than filed.

## Goals / Non-Goals

**Goals:**

- Make the pointer reach the button, and prove it with a hit-test rather than with a screenshot.
- Fix the transition so the hover the row asks for is actually visible.
- Resolve `A10` honestly: the reason it cannot ship is that design and report disagree, and that belongs in Appendix A.

**Non-Goals:**

- The missing team photographs. `QA-HOME-C3` is a content gap in prod's CMS paths; this section degrades gracefully already.
- Shortening the footer copy. Doing so would put the build at odds with the frame on a row that names no target — the exact decision Appendix A exists to route.
- Auditing every overlay in the codebase. The sweep covered five routes and its result is recorded; a full audit is a separate piece of work with its own scope.

## Decisions

**1. `pointer-events-none` on the backdrop _and_ a stacking context on the content.**
Either alone would fix the click. Both are applied because they fix different things: `pointer-events-none` is what makes a decorative layer decorative, and `relative z-10` on the content is what guarantees paint order if a future backdrop gains its own `z-index`. This is the shape `category-hero.tsx` and `all-courses-hero.tsx` already use — the gradient layer sits behind `<div className="relative z-10">`. Making the third instance match the two that are correct is cheaper than reasoning about each one separately.

**2. Hit-test, do not screenshot.**
The assertion is `document.elementFromPoint(centre) === the link`. A visual check would have passed this whole time — the button renders correctly, it is just unreachable. The defect is in the hit-testing layer, so that is the layer the test has to read. Playwright's own `.hover()` timing out is corroborating evidence and is kept as a second, slower assertion via an actual hover.

**3. `transition-colors` alongside the opacity.**
The button changes both `background-color` and `opacity` on hover but only transitions the latter, so the colour snaps. Widened to cover both. Not removed: the row asks for a hover effect, and two coordinated changes are a stronger affordance than one — the frame carries no hover state for this button, so there is nothing to contradict.

**4. `A10` → `BLOCKED-DESIGN`, not `CANT-REPRODUCE`.**
The text _is_ long — that reproduces. What cannot be done is deciding how short it should be, when the design specifies the current wording. `CANT-REPRODUCE` would say the report was wrong; it is not wrong, it is in conflict with the frame. Appendix A carries it with both sources quoted so whoever rules on it sees the conflict rather than a bare request.

**5. The sweep's limitation is recorded, not hidden.**
It reported 21 header links as blocked. They are dropdown items measured while the dropdown is closed, so `elementFromPoint` returns whichever sibling is on top. Recording only the one real finding and silently dropping the rest would leave the next person to rediscover the false positive; recording the count with its cause makes the sweep reusable.

## Risks / Trade-offs

- **The hit-test is viewport-sensitive** → the element is scrolled to centre before the point is taken, and the assertion fails with the blocking element's tag and classes rather than a bare boolean.
- **`z-10` could collide with a future overlay** → the section has no other positioned content; if one is added, the assertion catches it the moment it covers the button.
- **`A10` stays open** → it moves from the open count to the blocked count, which is the honest place for it. The Homepage does not reach `GREEN` on this slice, and the index will say so.

## Migration Plan

None — a presentational fix in one component. Rollback is reverting the commit.
