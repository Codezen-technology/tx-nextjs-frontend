## Context

See `proposal.md — Why`. Two removals already landed under this rule: the single-course
page (QA-COURSE-A2) and `/about-us` (QA-ABOUT-A1, report item R-ABOUT-1920-02). Both left
e2e assertions behind that forbid a breadcrumb bar on their page, and the course removal
established that `BreadcrumbList` JSON-LD stays.

The seven remaining trails are not one component. There is no shared `Breadcrumb`
primitive in the codebase — each page hand-rolls its own markup, in three shapes:

- a dark full-bleed bar above the page body (cart, checkout, pricing hero),
- an inline trail inside a hero band (blog single, course hero),
- a plain inline trail above the content column (product single),

plus a skeleton row in the course-category `loading.tsx`.

Constraint: `buildBreadcrumbSchema` on the course and course-category pages, and the
`CourseBreadcrumb` type feeding it from `src/lib/services/courses.ts`, are on the SEO
path, not the render path.

## Goals / Non-Goals

**Goals:**

- Delete the seven trails at their source, so no page can regain one by re-mounting a
  shared component.
- Leave each page's first visible band with correct vertical rhythm after the trail is
  gone.
- Keep every `BreadcrumbList` JSON-LD block byte-identical.

**Non-Goals:**

- Building a shared breadcrumb component, hidden or otherwise. Nothing renders a trail,
  so there is nothing to share.
- Removing breadcrumb source data or schema builders — see the specs.
- Changing RankMath's own JSON-LD, which already supplies `BreadcrumbList` on pages where
  it is configured and is passed through untouched.
- Adding e2e coverage for each of the seven pages. The two existing per-page assertions
  stay; broader coverage is a separate change.

## Decisions

**Delete the markup rather than hide it.** Alternative: a feature flag or a
`display: none` wrapper, which would keep the trail reachable to screen readers and leave
dead links in the DOM for crawlers. Deleting is also what the two prior removals did, so
the codebase stays internally consistent.

**No shared no-op component.** Alternative: introduce `<Breadcrumb />` that renders
`null`, so a future re-enable is one edit. Rejected: it invents an abstraction for a
behaviour that is "nothing renders", and would leave seven call sites to mislead readers.

**Absorb the spacing at each call site, individually.** Each trail carried its own
spacing idiom — a bar contributed `py-2.5` plus its own background, an inline trail
contributed `mb-4`/`mb-8`, and the blog hero's next sibling carried a compensating
`mt-8`. There is no single rule to apply; each removal drops the trail and then adjusts
only the neighbour that depended on it. The course-hero and pricing-hero bands already
own their padding, so those need no adjustment.

**Prune imports the removal orphans.** `Link`, `ChevronRight` and `Home` become unused in
several files. `tsc` does not flag unused imports under this project's config, so they
must be removed by inspection rather than relied on to surface in `pnpm typecheck`.

**Keep `course.breadcrumb` in the domain type.** Alternative: drop the field and build the
schema from the category taxonomy instead. Rejected as scope creep — it would change the
schema's contents, which the specs require to stay put.

## Risks / Trade-offs

- **A page collapses visually where the bar was its only top spacer** → check each page's
  first band after removal; the blog hero's `mt-8` is the known instance.
- **Removing a trail also removes the only import consumer, leaving an unused import that
  lint does not error on** → grep each edited file for `Link`, `ChevronRight` and `Home`
  after the edit.
- **Unwrapping a now-single-child fragment (pricing hero) breaks the JSX comment that sat
  beside it** → a comment left as `{/* … */}` at the top level of a `return` is a second
  expression; convert it to a line comment above `return`.
- **A JSON-LD builder gets deleted along with the trail it describes** → the specs assert
  `BreadcrumbList` survives on the course and course-category pages; verify the schema
  blocks are untouched in the diff.
- **Trade-off: no new per-page e2e assertion** for the seven pages, so a future
  regression on, say, `/cart` would not be caught automatically. Accepted for this change;
  the site-wide spec records the rule so the coverage can be added later.

## Migration Plan

No data, route or API migration. Ship as one commit; rollback is a revert.
