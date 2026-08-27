## Context

See `proposal.md` — Why. What is already known, measured rather than assumed:

- **The design is unambiguous.** 1296 content / 312 side padding at 1920,
  1024 / 128 at 1280, 392 / 24 at 440. Consistent across every page measured
  (`6013:89909`, `6015:127034`, `6015:127141`, blog responsive `4118:68465`).
- **The padding ramp already shipped.** `0c9b097` brought 1280 and 440 to their
  targets exactly. Only the 1920 row is short — 292 against 312 — because
  `max-width: 1400px` caps it.
- **1400 is load-bearing in five places:** the `container` utility, `header.tsx`,
  `minimal-header.tsx`, `mega-menu.tsx`, and a
  `calc((100vw-1400px)/2+1rem)` bleed in `trusted-orgs.tsx`. The bleed is the
  subtle one — it computes a left offset from the grid, so it silently breaks if
  the grid moves and nothing else changes.
- **No QA item asks for this.** The report has no "page is too wide" entry. This
  is being fixed because the value is unowned, not because it was reported.

The gap at 1920 is 20px of padding and 40px of content width — small in
isolation, which is exactly why it has survived. The cost is not the pixels; it
is that five files each carry their own copy of the number.

## Goals / Non-Goals

**Goals:**

- One definition of the grid, referenced everywhere.
- 1920 matching its target the way 1280 and 440 already do.
- A check that catches divergence between surfaces, since that is the actual
  failure mode.

**Non-Goals:**

- No other visual values. Not spacing, not typography, not colour.
- Not a Figma-to-CSS sync.
- Not changing breakpoint definitions themselves.

## Decisions

### D1 — Do not implement until the width is decided

The measurement is settled; the choice is not. 1296 is what the design says;
1368 is what ships today; the live WordPress site says neither. Picking one is a
product and design call.

This change exists so the decision has somewhere to live, with the evidence
attached. Tasks are ordered so everything that does not depend on the answer —
consolidating five copies into one token — can proceed first and is worth doing
under any outcome.

_Alternative considered:_ implement 1296 immediately, since it is what the design
says. Rejected — it reflows every public page, and "the design says so" is not
sufficient authority for a change no one asked for on a site already in use.

### D2 — Consolidate first, change the value second

Replacing five literals with one token is behaviour-preserving and independently
valuable: it makes the eventual value change a one-line edit instead of a
five-file sweep, and it makes the current disagreement visible.

Sequencing it first means that if the decision lands on "keep 1368", this change
still delivers something real rather than being abandoned.

_Alternative considered:_ one commit doing both. Rejected — it entangles a safe
refactor with a high-blast-radius visual change, and makes the visual diff
impossible to review on its own.

### D3 — The token is a CSS custom property, not a Tailwind arbitrary value

`max-w-[1400px]` repeated in four components is the current problem; a shared
arbitrary value would repeat the same mistake with a different literal. A custom
property in `@theme` can be referenced from CSS (including the `calc()` bleed)
and from Tailwind, which the bleed in `trusted-orgs.tsx` specifically needs.

_Alternative considered:_ a shared React layout component wrapping every page.
Rejected — far larger change, and it does not help the `calc()` bleed, which is a
CSS expression rather than a wrapper.

### D4 — The check compares surfaces to each other, not only to a number

Asserting each surface against a constant would pass even if they disagreed with
each other by construction. The defect being prevented is divergence, so the
check asserts the header's inner edges against the page content's edges at the
same breakpoint, in addition to both against the recorded target.

_Alternative considered:_ assert only the container. Rejected — the header,
minimal header and mega menu each carry their own copy today, which is precisely
how they could drift.

### D5 — If the decision is "keep 1368", record it as a decision

A deliberate divergence from the design is legitimate; an undocumented one is
not. Either outcome ends with a written rationale, so the next fidelity pass does
not re-open it. The `page-grid` spec requires the recorded target to cite a
decision when it differs from the design.

## Risks / Trade-offs

- **Every public page reflows horizontally** → Scoped alone, one commit for the
  refactor and one for the value, each independently revertable. Verified at all
  three breakpoints before and after.

- **The `calc()` bleed breaks silently** → It is the one consumer that fails
  without an obvious visual error at every width. Explicitly enumerated in the
  tasks and covered by the check rather than left to review.

- **Conflicts with `header-acf-content`** (0/20, queued to touch the header) →
  Reason to do this first, while that change is unstarted. If it starts first,
  this one waits rather than racing it.

- **Narrowing to 1296 makes existing content feel cramped** → Possible, and a
  legitimate reason to decide against it. Whoever decides should look at a
  rendered page at 1920, not at the number.

## Migration Plan

Frontend visual change behind existing routes. No data, no API, no deploy
coupling.

1. Consolidate the five literals into one token, value unchanged at 1400. Purely
   behaviour-preserving; verify all three breakpoints are byte-identical before
   and after.
2. Add the grid check against current values, so it is green before anything moves.
3. _(Blocked on the decision)_ Change the token, extend the ramp to 1920, update
   the recorded targets.
4. Re-run the check; the diff is now one value.

Rollback is per-commit. Step 1 is safe to ship regardless of the outcome.

## Open Questions

None that block. The single open item is the decision itself, which is the
subject of the change rather than a detail within it.
