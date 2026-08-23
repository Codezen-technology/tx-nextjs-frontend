## Why

Single Blog is the top page on the reconciled order — 7 open rows, more than any other.
All seven were measured against the running build and the authoritative frame
(`6015:127141`) before this proposal, and the measurements move four of them off the
status the report implied:

| Row           | Ref               | Report says                              | Measured                                                                                                 |
| ------------- | ----------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `QA-BLOGS-A3` | `R-SBLOG-1920-02` | "the category name is incorrect"         | Rendered name **equals** the post's primary category from the API                                        |
| `QA-BLOGS-A4` | `R-SBLOG-1920-03` | "there won't be any image in this place" | **Confirmed** — the featured image renders twice, hero and again at the top of the article               |
| `QA-BLOGS-A5` | `R-SBLOG-1920-04` | same, second location                    | No second duplicate exists in this build; the frame's right rail has no image either                     |
| `QA-BLOGS-A6` | `R-SBLOG-1920-06` | body 16 regular, title **H2 32px bold**  | Frame says in-article headings are **SUSE Bold 20px** `Heading/Bold/H5`. Body 16/400/1.5 already correct |
| `QA-BLOGS-A7` | `R-SBLOG-1920-07` | "FAQ not similar to the design"          | **Confirmed**, five measurable deltas                                                                    |
| `QA-BLOGS-A8` | `R-SBLOG-1280-01` | 128px padding at 1280                    | Already 128 on both hero and header                                                                      |
| `QA-BLOGS-D1` | `R-SBLOG-440-01`  | mobile ToC drawer                        | Net-new build, needs sizing                                                                              |

`A6` is the one worth reading twice. The report asks for a 32px bold H2; the frame binds
`Heading/Bold/H5` — **SUSE Bold 20px**, 1.2 line-height, `Neutral/N900`. The build ships
neither: Open Sans 24px/600. Under the `design-token-fidelity` rule the frame wins, so
this change applies 20px and records the contradiction rather than shipping the report's
number.

## What Changes

- **`A4`** — remove the duplicated featured image from the top of the article. The frame's
  rich-text column starts with text; its only image is an inline content image further down
- **`A6`** — in-article headings to the measured token (SUSE Bold 20px / 1.2 / `N900`),
  scoped to the blog article so the shared `prose-wp` utility is untouched
- **`A3`, `A5`, `A8`** — close as `CANT-REPRODUCE` / `FIXED` with the measurements as
  evidence, and add assertions so they cannot silently regress
- **`A7`** — **not fixed here.** Measured in full and recorded; the fix touches `CourseFaq`,
  which the course and category pages also render, so it needs a scoping decision this row
  does not carry
- **`D1`** — untouched; Class D, needs sizing as its own change

## Capabilities

### New Capabilities

- `blog-single-article`: what the single-post article column contains and how its body
  copy is typed

### Modified Capabilities

- `blog-single-page`: the existing spec covers the hero, sidebar and layout; it gains the
  rule that the featured image appears once

## Impact

**Code**

- `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` — drop the article-top image, scope
  the heading token
- `src/app/globals.css` — a `prose-wp-article` modifier, only if the scoping needs it

**Tests**

- `e2e/blog-single.spec.ts` — new, one assertion per closed row

**Docs**

- `docs/qa/QA_BY_PAGE.md` — five rows, the page index, Appendix B
- `.context/figma/targets.md` — the Single Blog measurements, including the `A6`
  contradiction and the full `A7` delta list

**Not affected:** the shared `CourseFaq` component, the ToC, the hero.
