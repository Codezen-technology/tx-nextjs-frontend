## Why

Pricing is the top page on the reconciled order — 6 open rows. The report's node
(`6239:135726`) turns out to be a **section holding three frames**: Desktop 5390,
Laptop 5085 and **Mobile 7995**. Pricing is therefore only the second page with a
measured mobile frame, and four of its six rows resolve against numbers rather than
judgement:

| Row           | Ref               | Report says                                            | Measured                                                                                                                             |
| ------------- | ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `QA-PRICE-A1` | `R-PRICE-1920-01` | "hero is different from the actual design"             | Band **179** vs the frame's **320**; inset **0** vs **112 / 112**                                                                    |
| `QA-PRICE-A2` | `R-PRICE-1920-04` | "this header is bigger than the other section headers" | All eleven headings measure **32px**; none is bigger                                                                                 |
| `QA-PRICE-A3` | `R-PRICE-1920-06` | "remove the button in the marked area"                 | The frame carries **one** button across its content sections; the build has several. Which one the report marked is still unresolved |
| `QA-PRICE-A4` | `R-PRICE-440-01`  | "spacing here will be 40px"                            | Frame mobile gaps are **40**; the build already reads 40                                                                             |
| `QA-PRICE-A5` | `R-PRICE-440-02`  | "title and button are not horizontally aligned"        | The categories section sits at **48** where the frame puts content at **24** — a double `container`                                  |

`A5` is the useful one. `/pricing` wraps `CategoriesGrid` in a `container`, and the
component already brings its own, so that section is inset one whole page-pad further
than every other section on the page — 48 against 24 at 440. The homepage renders the
same component with no wrapper and is correct.

## What Changes

- **`A1`** — hero inset to the measured **112 / 112**, matching the frame's 320 band and
  the treatment All Courses already ships. The frame's wave and pattern are **not** added
  here: that is the same net-new hero treatment already carried as Class D on Blog
  (`QA-BLOG-D2`) and All Courses (`QA-COURSES-D2`), and it is recorded as such
- **`A5`** — drop the redundant `container` wrapper on the pricing page's categories
  section so it lines up with the page column
- **`A2`, `A4`** — close on measurement with assertions
- **`A3`** — stays open with the frame evidence attached
- **`D1`, `E1`, `E2`** — untouched

## Capabilities

### New Capabilities

- `pricing-page-layout`: the pricing page's hero inset and its section alignment

## Impact

**Code**

- `src/components/home/pricing-hero.tsx` — `py-16` → the measured inset
- `src/app/[locale]/(marketing)/pricing/page.tsx` — remove the double container

**Tests**

- `e2e/pricing.spec.ts` — new

**Docs**

- `docs/qa/QA_BY_PAGE.md`, `.context/figma/targets.md`

**Not affected:** the plan cards, the comparison table, the homepage's own use of
`CategoriesGrid`.
