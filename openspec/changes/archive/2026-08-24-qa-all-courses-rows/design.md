## Context

See `proposal.md — Why`. Item→code audit for the All Courses tab of the QA report:

| Report item                                          | Row             | Verdict            | Evidence                                                             |
| ---------------------------------------------------- | --------------- | ------------------ | -------------------------------------------------------------------- |
| `R-COURSES-1920-01` "marked pattern missing"         | `QA-COURSES-D2` | Class D, untouched | Net-new hero treatment shared with `QA-BLOG-D2` and the Pricing hero |
| `R-COURSES-1920-02` unselected checkbox fill         | `QA-COURSES-A1` | already `FIXED`    | `course-category-filter.tsx:47`                                      |
| `R-COURSES-1920-03` "courses written multiple times" | `QA-COURSES-A4` | **this change**    | `courses-by-category-section.tsx:28,51`                              |
| `R-COURSES-440-01` mobile                            | `QA-COURSES-D1` | Class D, untouched | Unbounded, needs sizing                                              |

Measured facts behind the fix:

- **API.** `GET /lms-backend/v1/course-categories?per_page=50` on the local backend returns 20 categories. 18 end in `Courses` (`Animal Care Courses`, `HACCP Courses`, `Health and Safety Courses`, …); the exceptions are `Groupon` and `Level 3,Construction Safety,Health & Safety`. Prod could not be sampled — `trainingexcellence.org.uk` answers the REST route with an SG captcha redirect — so the helper must tolerate both shapes rather than assume the suffix.
- **Frame** `3306:50109` → section `3306:50171`. Heading reads **`Care Certificate`**; both CTAs read **`View all care certificate courses`**. The frame carries the same two CTA surfaces the build does (inline link at the section head, pill button on the divider below the grid, `3306:50182`), and the button's width varies per section (291 / 332 / 332 / 279) because the label carries the category name.
- **Build.** Both CTAs interpolate `{category.name}` raw, so the rendered string is `View all Care Certificate Courses courses`.

## Goals / Non-Goals

**Goals:**

- One label-composition path shared by both CTA surfaces, so they cannot drift apart the way the checkout brand lists did.
- Behaviour that is correct for category names with and without the suffix, since the frontend does not control the names.

**Non-Goals:**

- Changing the section **heading**. The frame renders `Care Certificate` where the build renders `Care Certificate Courses`, but no report item asks for it, and `QA-COURSES-A3` already ruled that this page's headings are CMS content the frontend should not rewrite. Recorded in `targets.md` as an unfiled observation.
- Lower-casing the name (see Decision 2).
- Removing either CTA surface. The report's "remove one course" is about the duplicated word; the frame keeps both surfaces.
- Class D rows `QA-COURSES-D1` / `D2`.

## Decisions

**1. Strip the suffix in a helper, not in the component or the service.**
`src/lib/utils/category-label.ts` exporting a pure `categoryCtaLabel(name)`. Not the service layer (`normalizeCourse` and friends normalise _data_; the untouched `category.name` is still wanted for the heading, the filter list and the `/course-cat` page), and not inline in the component (two call sites, and the rule needs its own tests over the real catalogue's names). Alternative considered: fix the names in WordPress. That is the true source of the problem, but it is a CMS content change outside this repo and would silently regress the moment an editor re-adds the word — the helper is correct either way.

**2. Preserve casing; do not reproduce the frame's lower-case sample.**
The frame shows `view all care certificate courses`. Applying `toLowerCase()` would render `View all haccp courses` and `View all level 3,construction safety,health & safety courses`. `design-token-fidelity` gives the frame authority over _tokens and geometry_; the casing of an editorial string is not a token, and `QA-COURSES-A3` reached the same conclusion for this page's headings on the same reasoning. The delta is recorded on the row for a design ruling rather than shipped.

**3. Match on a trailing word boundary, and never return empty.**
Strip a trailing ` Course` or ` Courses` (case-insensitive, optional trailing whitespace) only when something remains before it. A category named exactly `Courses` keeps its name — `View all Courses` still says the word once, which is what the requirement asks. A name containing the word mid-string (`Courses for Teams`) is left alone: the requirement is about the duplicate the suffix creates, and a mid-string occurrence is the editor's wording.

**4. Two tests, at the two levels that can actually fail.**

- Unit (`src/__tests__/category-label.test.ts`) — the helper against a fixture of all 20 live category names plus the edge cases from the spec. This is the guard: it fails if the rule regresses.
- E2E (`e2e/design-fidelity.spec.ts`, alongside the other two All Courses assertions) — count `/\bcourses?\b/gi` in every `View all …` link on `/all-courses` and assert 1. This proves the helper is actually wired into both surfaces, which the unit test cannot.

The unit test carries the load because the e2e depends on the local backend serving suffixed names — true today, not guaranteed.

**5. Test-first, then mutation-check.**
Both tests are written and watched failing against the current code before the component changes (`Care Certificate Courses courses` → count 2). After the fix, revert the helper call at each site in turn and confirm each test fails with its own message. The last three slices all had to substitute a mutation check for an unwatched red; this one is small enough to do it in the right order.

## Risks / Trade-offs

- **The e2e is weak if the backend's names change** → the unit test asserts against a committed fixture of the current names, so the rule stays guarded even if the live data stops exercising it.
- **A category legitimately named "… Course Design"** would be untouched (no trailing match), which is correct; but `… Courses Bundle` also keeps both words. Accepted: the requirement is about the trailing duplicate only.
- **Divergence from the frame's lower-case copy** is a deliberate deviation, flagged on the row. If design rules for lower-case, it is a one-line change in the helper and one test update.

## Migration Plan

None — presentational, no data or route change. Rollback is reverting the commit.
