## Why

Round 1 of the QA report shipped all six Class B functional bugs, the Playwright
viewport projects, and the two homepage image failures. Triage of those homepage
images turned up a defect pattern rather than a one-off: `next/image` sized with
`w-auto h-auto` collapses to a 0×0 box whenever its source fails to decode, and
the CMS is serving frontend-relative paths for assets that were never added to
`public/`. Six more Class C image failures are still open across About Us,
Category, Blog, Single Blog and Single Course, and none of them has a verdict yet.
The same collapse is the most likely cause for several, so they should be settled
as one pass rather than six ad-hoc fixes.

Alongside them, five Phase 1 housekeeping items are blocking a clean start on
Phase 2: `openspec/changes/` misrepresents what is in flight, `test-results/` is
committed so every Playwright run dirties the tree, and a dead component still
carries a `/checkout` CTA that would reintroduce a bug that was just fixed.

Class A (~27 items) is deliberately excluded — it cannot proceed honestly until
the six divergent Figma node pairs are resolved by the team. Class D and Class E
remain out of round 1 per the execution plan.

## What Changes

- **Establish a single rule for CMS-supplied images.** Any image whose `src` comes
  from WordPress must occupy its reserved box regardless of whether the source
  loads, and must degrade to a fallback or to nothing — never to a collapsed
  element or a broken-image glyph. `FallbackImage` and the explicit-width pattern
  introduced on the homepage become the standard, applied across every remaining
  Class C surface.
- **Triage and resolve the six open Class C image failures**, each with a recorded
  `component-bug` vs `CONTENT-GAP` verdict: About Us ×2, Category "Why Choose Us"
  (desktop + mobile), Blog hero, Single Blog hero, Single Course.
- **Sweep the codebase for the `w-auto`/`h-auto` collapse pattern** so the same
  defect cannot resurface on surfaces QA did not happen to look at.
- **Extend the E2E image assertions** in `e2e/qa-round-1.spec.ts` to cover every
  resolved surface at all three reported widths, asserting both that the source
  decodes and that the element has a non-zero layout box.
- **Hand off the confirmed content gaps** as a single itemised list of CMS paths
  that 404, so they can be fixed outside this repo.
- **Clear Phase 1 housekeeping**: archive `fix-seo-metadata-defects`, gitignore
  `test-results/`, delete the dead `course-info-card.tsx`, and complete the
  verbatim tracker grid.
- Non-goal, stated explicitly: no Class A spacing or token work, no Class D
  builds, no guesses at the seven Class E items.

## Capabilities

### New Capabilities

- `cms-image-resilience`: How the frontend renders images whose source comes from
  WordPress — reserved layout box independent of load success, fallback and
  graceful-absence behaviour, and the prohibition on intrinsic-size-dependent
  sizing for remote sources.

### Modified Capabilities

- `about-us-page-content`: the page's images currently fail to render; the spec
  gains a requirement that they render, and that a missing source degrades
  without leaving an empty framed box.

## Impact

**Code**

- `src/components/ui/fallback-image.tsx` — the standard, already introduced
- `src/components/about/*` — About Us imagery
- `src/components/courses/category-why-choose-us.tsx` — Category "Why Choose Us"
- `src/components/home/blog-hero.tsx` — Blog hero
- `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` — Single Blog hero
- `src/components/courses/*` — Single Course imagery
- `e2e/qa-round-1.spec.ts` — per-surface image assertions

**Repo hygiene**

- `.gitignore` — add `test-results/`
- `openspec/changes/fix-seo-metadata-defects` — archive
- `src/components/courses/course-info-card.tsx` — delete (235 lines, zero importers)
- `.context/qa-tracker.md` — complete the verbatim grid

**External / handed off**

- WordPress `lms-backend/v1` content: image fields pointing at frontend paths that
  return 404 (`/images/team/collaboration-{1,2,3}.jpg` confirmed; others pending
  triage). Fixing these is a CMS task, not a frontend one.

**Not affected**

- No API contract changes, no new dependencies, no routing changes.
