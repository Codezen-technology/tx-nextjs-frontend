## Context

See `proposal.md — Why`. Four unrelated rows on four pages, batched because each is small and none blocks another. Measurements taken before any code changed:

| Row             | Measured                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QA-ABOUT-A1`   | `about-us/page.tsx:46` renders `<AboutBreadcrumb />`. The page's only structured data is `ABOUT_SCHEMA` (`@type: AboutPage`) — **no `BreadcrumbList`**, unlike the course page                                                              |
| `QA-BLOG-A5`    | The trending pill is `<span class="bg-secondary-600 … rounded-full px-6 py-4 text-white">Read this article</span>` — **no `hover:` class, no transition**. The card animates `box-shadow`; the title carries `group-hover:text-primary-500` |
| `QA-PRIVACY-A2` | `mailto:`/`tel:` links: colour `rgb(0,188,240)`, background `rgb(250,251,251)` → **2.14:1**, `text-decoration: none`, weight 400                                                                                                            |
| `QA-SUPPORT-A2` | `textarea-field.tsx` ships `rows={3}` with a fixed `TEXTAREA_CLASS`                                                                                                                                                                         |

A probe correction worth recording: the first hover sweep on `/blog` reported four dead controls, all of them **card titles** rather than buttons — `hasText` on a Playwright locator matches ancestors, so the CTA probe kept resolving the whole card. The pill was found by reading the served HTML directly.

## Goals / Non-Goals

**Goals:**

- Close the four rows that need no ruling, and empty Appendix B by closing the two that owe tests.
- Fix `QA-PRIVACY-A2` against a measurable floor rather than a taste judgement, so it does not need the design ruling its `Assigned` column suggests.

**Non-Goals:**

- `QA-CART-A1` (frame parity) and `QA-PRICE-A3` (which button to remove) — different kinds of work, handled separately.
- Making the trending pill an interactive element. The card is already the link.
- A general audit of link contrast site-wide. The requirement is scoped to legal long-form content, which is where the row is.

## Decisions

**1. Delete `AboutBreadcrumb` rather than hide it.**
Exactly what `QA-COURSE-A2` did. The difference is stated in the spec: the course page kept its `BreadcrumbList` JSON-LD because it had one; About has none, so there is nothing to retain and no SEO loss to weigh. Leaving a dead component behind would invite it back.

**2. Drive the pill's hover from the card's `group`, and leave it a `<span>`.**
The whole card is an `<a>`; putting a `<button>` or nested `<a>` inside it would be invalid or focus-trapping markup. The card already establishes `group` and its title already uses `group-hover:`, so the pill uses the same mechanism. This also matches what a user expects — the affordance appears when the card is hovered, not only when the pointer is over the pill itself.

**3. Fix contrast with a token that clears AA, and add an underline.**
2.14:1 fails badly, and the links also have no underline, so they fail on two independent counts: WCAG 1.4.3 (contrast) and 1.4.1 (colour as the only distinguishing cue). Fixing only the colour would leave the second. `secondary-500` on the page's `N10` is checked and used if it clears 4.5:1; otherwise the darker neutral does. The assertion computes the ratio from the rendered colours, so the choice of token cannot silently regress it — the same shape as the existing `interactive-contrast` spec, which is why this becomes its own capability rather than an edit to that one: that spec is scoped to _brand-filled controls_, not body links.

**4. Auto-grow the textarea instead of guessing a taller `rows`.**
The report asks for a box that "will cover all the text in it" and names no number. A bigger fixed height is still a guess that is wrong for some answer; growing with content is the literal request. Bounded with a maximum so a long answer cannot push the submit button off-screen. Implemented on the field itself so every Gravity Forms textarea benefits, not just this one.

**5. Four assertions, each naming its row.**
The two `GAP` rows get the tests Appendix B says they owe. The other two are `MANUAL-VISUAL` and get assertions anyway — a `MANUAL-VISUAL` row with an automated guard is strictly better than one without, and it is what emptied the equivalent rows on earlier pages.

## Risks / Trade-offs

- **`group-hover` fires from anywhere on the card** → intended; it is the card that is interactive. Noted in the spec so it is not later read as a bug.
- **Auto-grow runs on every keystroke** → it sets a height from `scrollHeight` on input, which is a layout read on a single element; bounded and cheap. No observer, no dependency.
- **The contrast fix changes link colour in all legal content**, not just privacy — terms and cancellations use the same renderer. That is the correct blast radius: the same defect exists on all three.
- **Deleting `AboutBreadcrumb` touches a spec requirement** that lists Breadcrumb in the render order, so that requirement is modified rather than left stale.

## Migration Plan

None — presentational and one form behaviour. Rollback is reverting the commit.
