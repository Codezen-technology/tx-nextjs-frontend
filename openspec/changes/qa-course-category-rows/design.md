## Context

See `proposal.md — Why`. Item→code audit for the Course Category tab:

| Report item                                           | Row                | Verdict                  | Evidence                                  |
| ----------------------------------------------------- | ------------------ | ------------------------ | ----------------------------------------- |
| `R-CAT-1920-01` "background colour does not match"    | `QA-CAT-A4`        | **CANT-REPRODUCE**       | Gradient sampled at 8 points, max Δ 1/255 |
| `R-CAT-1920-02` FAQ section missing                   | `QA-CAT-D2`        | already `FIXED`          | Built since the report                    |
| `R-CAT-1920-03` / `R-CAT-440-02` Why Choose Us images | `QA-CAT-C1` / `C2` | already `CANT-REPRODUCE` | 14 imgs, 0 broken                         |
| `R-CAT-1280-01` laptop side padding                   | `QA-CAT-A1`        | already `FIXED`          | Page grid adopted                         |
| `R-CAT-440-01` "spacing … will be 40px"               | `QA-CAT-A5`        | **this change**          | Boundaries measure 96 at 440              |
| —                                                     | `QA-CAT-A6` (new)  | **this change**          | `"Education Courses Courses"`             |

Measurements taken before any code changed:

**Hero gradient.** Frame `3294:42433` rendered at 900×225 (from 1920×480) and the build's hero screenshotted at 1920, sampled at the same eight normalised x positions near the top of the band, away from text and pattern:

| x    | Frame        | Build        | max Δ |
| ---- | ------------ | ------------ | ----- |
| 0.01 | `(1,33,74)`  | `(0,33,74)`  | 1     |
| 0.10 | `(0,37,77)`  | `(0,37,77)`  | 0     |
| 0.25 | `(1,44,81)`  | `(0,44,81)`  | 1     |
| 0.40 | `(0,51,85)`  | `(0,51,85)`  | 0     |
| 0.55 | `(0,58,89)`  | `(0,58,89)`  | 0     |
| 0.70 | `(0,65,93)`  | `(0,65,93)`  | 0     |
| 0.85 | `(0,71,96)`  | `(0,72,97)`  | 1     |
| 0.99 | `(1,78,100)` | `(0,78,101)` | 1     |

The build's declared value is `linear-gradient(88deg, rgb(0,32,74) 0%, rgb(0,79,101) 100.15%)` in `hero-wave.tsx`. Δ 1 is PNG-render rounding, not a colour difference.

**Section rhythm at 440.** All three content sections are `container py-12` — 48px a side, so a boundary is 96. The report asks for 40. `--spacing-section` (20px, `globals.css:112`) already exists for exactly this, added for the homepage: each section owns half the boundary, and `lg:py-*` on the same element wins above the breakpoint.

**The doubled word.** `category-courses.tsx:36` renders `{categoryName} Courses`; `page.tsx:64` and `:93` build the metadata title and JSON-LD `name` the same way. With `Education Courses` from the CMS these read `Education Courses Courses`.

## Goals / Non-Goals

**Goals:**

- Close `A4` on measurement rather than on a look, and leave a guard so the fill cannot drift back.
- Put the category page on the rhythm the homepage already defines, without touching desktop.
- Fix the doubled word everywhere it reaches, not only where it is visible.

**Non-Goals:**

- Changing the desktop rhythm. 1920 is 80 and 1280 is 56 site-wide; no open row asks for either and moving them is its own slice — the same boundary `--spacing-section` was introduced under.
- Renaming categories in WordPress. Same reasoning as `QA-COURSES-A4`: the true fix is upstream, but the frontend must be correct either way.
- The Pricing hero's missing pattern. Recorded on `QA-PRICE-A1`, genuinely absent there, and out of scope here.

## Decisions

**1. Close `A4`, and add a guard anyway.**
A `CANT-REPRODUCE` with no test leaves nothing behind: the next person re-measures from scratch, or worse, the fill drifts and no one notices. The assertion reads the hero's computed `background-image` and checks both colour stops against the measured values. It costs one test and converts a verdict into a standing fact. Alternative considered — close with the note alone, as the earlier `CANT-REPRODUCE` rows did. Rejected: those rows were about _content_ that could not be reproduced (missing images, broken wrapping); this one is about a _declared value_ that a test can pin.

**2. `py-section lg:py-12`, applied at each section, not at a page wrapper.**
Each section owning half the boundary is the existing contract — it is why two adjacent sections compose to 40 without either knowing about the other, and why a section can be reordered or reused on another page without carrying a neighbour's spacing. A wrapper-level `space-y` would break the moment a section is used elsewhere. `lg:py-12` preserves today's desktop exactly.

**3. Reuse `categoryCtaLabel`, do not re-derive the rule.**
`qa-all-courses-rows` shipped the helper this week for the identical defect. A second implementation would be a second thing to keep correct. The heading becomes `` `${categoryCtaLabel(name)} Courses` ``.

**4. Fix the metadata and JSON-LD too, though nothing visible shows them.**
The title is what the browser tab, the search result and the share card carry, and `name` is what structured data publishes. A fix that stopped at the visible heading would leave the doubled word in the two places that outlive the page view. Both are covered by a unit test on the label composition rather than an e2e — asserting `<title>` in a browser is slower and no more truthful.

**5. File the doubled word as `QA-CAT-A6` with `Ref = NONE`.**
The report does not carry it. The reconciliation established both-direction checking and the precedent for rows without a report item — `QA-CAT-A2`, `QA-CAT-A3` and others carry `Ref = NONE` with their origin stated. Silently fixing it would leave the doc claiming the page is clean for a reason that is not in the doc.

**6. Re-verdict the two "pattern missing" Class D rows on evidence.**
`HeroWave` renders the plus-pattern and is imported by the category, all-courses, blog, certificate and course-detail heroes; the category hero screenshot taken for `A4` shows it plainly. `QA-BLOG-D2` and `QA-COURSES-D2` both claim it is missing. Each will be screenshotted at its own route before its status is touched — a shared component is evidence that it _should_ render, not that it does.

## Risks / Trade-offs

- **The gradient guard could fail on a legitimate redesign** → it names the design value and the node in its message, so the failure tells the next person what to re-measure rather than what to delete.
- **`py-section` changes 440 only if `lg:` is right** → the boundary is asserted at 440 and desktop padding is asserted unchanged at 1280, so a mistake in either direction fails.
- **`A6` touches metadata** → covered by the existing SEO test suite plus a unit test on the composed strings; if a title assertion elsewhere hardcodes the doubled form, it fails loudly and is the correct thing to update.

## Migration Plan

None — presentational and metadata text. Rollback is reverting the commit.
