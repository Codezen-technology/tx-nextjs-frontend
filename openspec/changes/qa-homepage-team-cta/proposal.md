## Why

The Homepage holds the last two open Class A rows, and measuring them split them the same way the Category page split:

**`QA-HOME-A8` — "the button has no hover effect" — is real, and it is worse than the row says.** The button is "Request a Quote" in the "Transform Your Team with Us" section. Its hover classes are present and correct; they never fire. The section's decorative backdrop is an `<Image fill>` with `absolute inset-0` and no `pointer-events-none`, and the content below it is not lifted into a stacking context — so the image paints over the whole section and takes every pointer event. `document.elementFromPoint` at the button's centre returns **`img.absolute.inset-0.object-cover`**, not the link. Playwright cannot even hover it: it retries for 30 seconds and times out with "intercepts pointer events".

So the CTA is not merely un-hoverable — **it is unclickable**. It is the homepage's lead-generation action, and it has been dead.

**`QA-HOME-A10` — "Certificate Validator has a longer body text, shorten it" — cannot be closed by this team.** The frame's own footer carries the identical 149-character sentence the build ships, word for word: "Quickly and easily check the validity of your Training Excellence course certificates with Training Excellence's Course Certificate Validator tool." The report is asking to overrule the design, and it names no target length. That is a copy decision for product, not a defect with a measurable target.

## What Changes

- **`QA-HOME-A8`** — the decorative backdrop stops taking pointer events and the section's content is lifted above it, so hover and click both reach the CTA. Guarded by an assertion that hit-tests the button and one that checks the hover actually changes its fill.
- The CTA's `transition-opacity` is widened to cover the colour it also changes on hover — today `hover:bg-secondary-700` applies instantly while only the opacity animates.
- **`QA-HOME-A10`** → `BLOCKED-DESIGN` with the frame evidence attached and an Appendix A entry, replacing a row that read "closes on a copy decision" without saying that the design and the report disagree.
- A **pointer-interception sweep** across five routes is recorded, with its own limitation stated: header dropdown links report as blocked by their siblings because the sweep measures them while the menu is closed. One real finding, the one above.

## Capabilities

### New Capabilities

- `homepage-team-section`: the homepage's "Transform Your Team" band — that its decorative backdrop stays decorative and its call to action stays reachable.

### Modified Capabilities

_None._

## Impact

- `src/components/home/transform-team.tsx` — backdrop pointer events, content stacking, CTA transition
- `e2e/design-fidelity.spec.ts` — hit-test and hover assertions
- `docs/qa/QA_BY_PAGE.md` — `A8` closed, `A10` re-verdicted, Appendix A entry, page index
- `.context/figma/targets.md` — the hit-test evidence, the footer-copy comparison, the sweep and its limitation

No API, data-shape or route change.
