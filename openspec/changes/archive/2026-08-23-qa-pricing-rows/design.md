## Context

See `proposal.md` — **Why**. Measured before writing: the build at 1920 and 440, and
`6239:135726`, which is a section holding Desktop (5390), Laptop (5085) and Mobile (7995)
frames. About Us was the only other page with a measured mobile frame; Pricing is the
second.

### The frame's stacks

|                      | Desktop `Frame 7607`      | Mobile `Frame 7653` |
| -------------------- | ------------------------- | ------------------- |
| Section x / width    | **312 / 1296**            | **24 / 392**        |
| Gap between sections | **80** (six gaps, all 80) | **40** (both gaps)  |

Both match the invariants recorded in `targets.md` from eight other nodes. Pricing adds a
ninth independent confirmation.

### Hero

|               | Frame `Frame 7`                                             | Build                                    |
| ------------- | ----------------------------------------------------------- | ---------------------------------------- |
| Band height   | **320**                                                     | 179                                      |
| Content inset | **112 / 112** (title y=112, h=96 → ends 208)                | 0 (`py-16` on the inner container)       |
| Decoration    | `Asset 2 1` over `Rectangle 8`, plus a 406-tall wave vector | `plus-shape.png` at 40% opacity, no wave |
| Fill          | rectangle fill unread                                       | `secondary-50` cream                     |

## Goals / Non-Goals

**Goals:**

- Close the rows the frame settles, with the numbers recorded
- Keep the hero's decoration question with the two identical rows already filed elsewhere

**Non-Goals:**

- The wave and pattern. See D2
- `D1` (third plan card), `E1`, `E2` — blocked or Class D
- The laptop frame. No open row cites 1280 on this page

## Decisions

### D1 — Apply the hero inset, not a fixed height

`py-[112px]` on the hero's inner container, the same shape All Courses ships
(`all-courses-hero.tsx:13`). The frame's 320 is content + 2×112, so pinning the height
would break the moment the title wraps — the mistake `QA-CAT-A2` recorded when a hard
`height: 350` happened to give the right inset for a one-line title and the wrong one for
anything else.

### D2 — The hero's wave and pattern are Class D, not part of this row

The frame's hero carries an image asset and a 406-tall wave vector. Adding those is the
same net-new hero treatment already filed as `QA-BLOG-D2` and `QA-COURSES-D2` — three
pages, one piece of work, and it wants sizing as its own change rather than being smuggled
in under a spacing row.

So `A1` closes on the inset, and the decoration is recorded on the row and in
`targets.md` as belonging with the other two.

_Alternative considered — leave `A1` open until the whole hero matches._ Rejected: the
inset is measured, applies cleanly, and holding it hostage to a Class D item means the
page keeps a row that nobody can action.

### D3 — `A5` is a double container, and the fix is deletion

`pricing/page.tsx` wraps `CategoriesGrid` in `<div className="container mx-auto">`, and
`categories-grid.tsx` opens with `container grid`. Both apply `--page-grid-pad`, so that
section is inset twice: 48 at 440 against the frame's 24, and 64 at 1920 against 32.

The homepage renders the same component bare and is correct, which is the tell — this is a
copy-paste at the call site, not a component defect. Remove the wrapper; keep the
`py-section` rhythm on the section element.

### D4 — `A2` and `A4` close as measured, `A3` does not

- `A2` — all eleven headings measure 32px; the `h1` is 40 and correct for a page title.
  Nothing is bigger than anything else, so there is no defect to fix
- `A4` — the frame's mobile gaps are 40 and the build's section boundaries already read 40
  through `--spacing-section`
- `A3` — the frame carries exactly one button across its content sections (145×40, in the
  categories section) and the build has several. That is suggestive, not conclusive: the
  frame's sections do not map one-to-one onto the build's, which has accreditations,
  trusted-orgs, reviews and a comparison table the frame does not show. Naming a button to
  delete on that basis would be a guess

> **`A2` turned up something the report did not file.** Ten of the eleven headings are
> weight 700; "Training That Works for Your Team" is **500**. That is the shared team CTA,
> so it is not a Pricing defect and gets no row here — recorded in `targets.md` for whoever
> works the component.

## Risks / Trade-offs

- **The hero grows by 141px** → that is the measured design; the page is long already and
  the band is the page's title treatment
- **`A1` closes with the decoration still missing** → the row says so, and points at the
  two identical Class D rows
- **Removing the wrapper changes desktop too** → correct; it was doubling the pad at every
  width, not just 440

## Migration Plan

No data, no API. One commit; `git revert` restores both edits.
