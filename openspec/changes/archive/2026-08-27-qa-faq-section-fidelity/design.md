## Context

See `proposal.md — Why`.

**The Help measurement.** `6239:109818` is a section holding Desktop, Laptop **and Mobile** frames — the fourth page with real 440 targets. Its FAQ block rendered at 4040px and sampled:

| Sample point              | Measured        | Reading                                                                        |
| ------------------------- | --------------- | ------------------------------------------------------------------------------ |
| Page behind the container | `(250,251,251)` | `N10` #FAFBFB                                                                  |
| Container fill            | `(247,245,241)` | `secondary-50` #F5F1E9 at **50% alpha** over `N10` — 0.5·245+0.5·250 = 247.5 ✓ |
| Row divider               | `(235,237,241)` | **`N30` #EBEDF1 exactly**                                                      |
| Open answer panel         | `(245,241,233)` | **`secondary-50` #F5F1E9 solid**                                               |
| Toggle icon stroke        | `(180,144,85)`  | secondary, antialiased                                                         |

Against the blog frame's recorded values (`targets.md`, `QA-BLOGS-A7`): container `secondary-50` at 50% alpha, divider `N30` #EBEDF1, answer panel `secondary-50` solid, square corners, `+`/`−`. **Identical on every property both frames express.**

**The build.** Two implementations:

|                    | `CourseFaq`                                         | `/help`                                  |
| ------------------ | --------------------------------------------------- | ---------------------------------------- |
| Call sites         | course, category, blog single, pricing, course tabs | one                                      |
| Markup             | plain `<button>` list, `aria-expanded` only         | shadcn `Accordion` (Radix)               |
| Keyboard           | tab through buttons                                 | Radix roving focus, arrows, home/end     |
| Answer association | none                                                | `aria-controls` / region, wired by Radix |
| Container          | `secondary-50` solid, `rounded-lg`, bordered        | white, `rounded-lg`, bordered, per item  |

## Goals / Non-Goals

**Goals:**

- One component carrying the measured design, so the two rows close for the same reason.
- No accessibility regression from the convergence — the surface being deleted is the more capable one.
- The `QA-COURSE-A4` hover survives, retuned.

**Non-Goals:**

- Moving `/help`'s hardcoded questions into the CMS. Real, but it is a content-sourcing change with its own blast radius and no row asks for it. Recorded, not done.
- Restyling the shadcn `Accordion` wrapper. `my-orders` uses it with the chevron and is outside this work.
- The `/help` hero and "Still have questions?" band. `QA-HELP-E1` covers the hero and is blocked; the band is unfiled.

## Decisions

**1. Apply the frame to the shared component, and say which pages move.**
`A7` left this open pending a scoping decision. Two independent frames agreeing settles it: this is the FAQ design, not the blog's. Course detail, category, pricing and the course-tabs panel therefore change appearance. Course detail is `GREEN` and was signed off after its own slice, so its existing assertions are re-run as part of the gate rather than assumed.

**2. Build on `@radix-ui/react-accordion`, not on the shadcn wrapper.**
Converging on today's `CourseFaq` would delete Radix semantics from `/help` — arrow-key navigation, `aria-controls`, the answer exposed as a region. That is a regression a visual check cannot see, which is exactly the failure mode this branch keeps finding. The shadcn wrapper is not reusable here because `AccordionTrigger` hardcodes a `ChevronDown` and the frame uses `+`/`−`; editing the wrapper would drag `my-orders` along. Using the primitive directly gives both the semantics and the frame's icon.

**3. Keep the first item open by default.**
Both frames show the first question expanded, and `CourseFaq` already does this via `useState(0)`. Expressed as `defaultValue` on a `type="single" collapsible` root, which preserves collapse-on-second-click.

**4. Keep the hover, retuned to the new palette.**
`QA-COURSE-A4` shipped hover on the toggle and its icon, including the active row — a closed row on a page signed off since. The frames carry no hover state, so nothing contradicts it. The old hover used `secondary-100` against a `secondary-50` container; against the new half-alpha container the same token still reads, and the assertion checks that the colour _changes_, not what it becomes.

**5. Assert the frame values on both routes, not one.**
The two rows are one defect on two pages, so the guard runs on `/help` and on a blog post. A single-route assertion would let one page drift while the row claims both are fixed.

## Risks / Trade-offs

- **Four unfiled pages change appearance** → intended and stated; the alternative is per-page FAQ styling, which is how the site got two implementations. Course detail's existing assertions gate it.
- **Radix animates height; the old component did not** → the answer's presence is asserted through the accordion's state attributes rather than a raw height read, so an animation frame cannot make a passing test flap.
- **`/help`'s questions stay hardcoded** → unchanged by this work; recorded as a follow-up rather than smuggled in.
- **The frames express no hover, so hover is unverified against design** → carried deliberately from `QA-COURSE-A4`, and the assertion is "it changes", not a specific value.

## Migration Plan

None — presentational plus a markup swap on one page. Rollback is reverting the commit.
