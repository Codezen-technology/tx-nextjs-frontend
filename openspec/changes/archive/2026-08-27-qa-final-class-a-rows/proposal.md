## Why

Four Class A rows remain that can be worked without a design ruling, one on each of four pages. All four were measured before this proposal:

- **`QA-ABOUT-A1`** — `/about-us` still renders a breadcrumb bar the report asks to remove. Identical to the fix shipped as `QA-COURSE-A2`. Unlike that page, About carries **no `BreadcrumbList` JSON-LD**, so there is nothing to preserve.
- **`QA-BLOG-A5`** — the trending card's "Read this article" is a **`<span>`**, not a link or a button, and carries **no hover classes and no transition**. The card animates its shadow and its title; the pill does nothing. That is exactly the report's "the button color doesn't change at all."
- **`QA-PRIVACY-A2`** — the `mailto:`/`tel:` links render at `rgb(0,188,240)` on `rgb(250,251,251)`: **2.14:1**, against WCAG AA's 4.5:1 floor, with `text-decoration: none`. Low contrast _and_ no underline, so they are neither readable nor identifiable as links.
- **`QA-SUPPORT-A2`** — the Additional Details textarea ships `rows={3}`. The report asks for a box that "will cover all the text in it".

Closing `QA-ABOUT-A1` and `QA-SUPPORT-A2` empties Appendix B — one of the three "Done" conditions in the runbook.

## What Changes

- **`QA-ABOUT-A1`** — the breadcrumb bar is removed and `about-breadcrumb.tsx` deleted, matching `QA-COURSE-A2`.
- **`QA-BLOG-A5`** — the trending pill gains a hover state driven by the card's existing `group`, the same mechanism its title already uses. It stays a `<span>`: the whole card is the link, and nesting an interactive element inside it would be worse markup than the row asks for.
- **`QA-PRIVACY-A2`** — legal-content links get a treatment that clears AA and carries an underline, so they no longer depend on colour alone.
- **`QA-SUPPORT-A2`** — the textarea grows with its content rather than being given a taller fixed guess, which is what "cover all the text" asks for and needs no invented number.
- Each row gets an assertion; the two `GAP` rows get the tests they owe.

## Capabilities

### New Capabilities

- `legal-content-links`: how links inside long-form legal copy are presented, so contact details stay readable and identifiable.
- `auto-growing-textarea`: the behaviour of a free-text form field that must show what has been typed into it.

### Modified Capabilities

- `about-us-page-content`: the page no longer renders a breadcrumb bar.
- `blog-category-page`: the trending card's call to action carries a hover affordance.

## Impact

- `src/app/[locale]/(marketing)/about-us/page.tsx`, `src/components/about/about-breadcrumb.tsx` (deleted)
- `src/components/blog/` — the trending card's pill
- `src/components/legal/` — link treatment for legal long-form content
- `src/components/gf-fields/textarea-field.tsx`
- `e2e/design-fidelity.spec.ts`, `e2e/qa-round-1.spec.ts` — four assertions
- `docs/qa/QA_BY_PAGE.md` — four rows, page index, **Appendix B emptied**

No API, data-shape or route change.
