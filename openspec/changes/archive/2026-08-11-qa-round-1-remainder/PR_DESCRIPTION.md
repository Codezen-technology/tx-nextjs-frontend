# QA report — round 1 remainder

Implements OpenSpec change `qa-round-1-remainder`. Closes out every Class C image
item, sweeps the underlying defect pattern, and clears Phase 1 housekeeping.

## What this does

**Triage closed all six open Class C items — none was a component bug.**
Measured on the deployed frontend at 1280 and 440 (CMS field → URL status →
rendered box + `naturalWidth`), not inferred from code:

| Surface                                   | Verdict                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| About Us ×2                               | `CONTENT-GAP` — prod returns `image: null` / `photos: null`; placeholders render correctly                    |
| Category "Why Choose Us" desktop + mobile | `CANT-REPRODUCE` — 14 images, 0 broken, 0 collapsed at both widths. One issue, not two                        |
| Blog hero                                 | `RECLASSIFIED → Class D` — renders a CSS gradient and no `<img>`                                              |
| Single Blog hero                          | `CANT-REPRODUCE`                                                                                              |
| Single Course                             | `CANT-REPRODUCE` — 14 zero-box images all inside `hidden lg:*` wrappers (duplicate-render responsive pattern) |

**Found a third instance of the round-1 collapse that QA never reported.**
`home/accreditations.tsx` had the same both-axes-`auto` sizing that broke the
homepage certificate images. Also added a `min-w` floor to five CMS-sourced logo
slots, where a failed load silently collapsed to zero width.

**Hardened the shared mechanism.** `FallbackImage` now has an explicit resolution
order (`src` → `fallbackSrc` → `fallback` node → nothing) and tries each source
once, so a fallback that also fails degrades to absent instead of looping. About
Us images route through it, so a field holding a _dead URL_ degrades to the
placeholder, not just an unset one.

**Housekeeping.** Archived `fix-seo-metadata-defects` (12 spec deltas synced),
gitignored and untracked `test-results/`, deleted the dead
`course-info-card.tsx` (235 lines, zero importers, held a second
`/checkout?course=` CTA that would have reintroduced the fixed Class B bug).

## Notable

The E2E image assertion **skips images with a hidden ancestor**. Without that,
Single Course alone reports 14 false positives. The box check also runs _before_
`toBeVisible()` — Playwright blocks on a zero-size element, which turns a
collapsed image into a 90s timeout instead of a named failure. Mutation-tested:
reintroducing a dead source with `w-auto` now fails in 3.3s with
`zero-width box: <url>`.

## Verification

- `pnpm typecheck` clean · `pnpm lint` 0 errors · `pnpm test` **482/482** (38 files)
- `e2e/qa-round-1.spec.ts` **40 passed / 5 skipped** across all three viewport projects
- Full E2E: 4 failures, all in the known pre-existing baseline (`smoke:9`,
  `auth-flow:15`, `cancellations:11`, `cancellations:28`). **Zero new failures.**

## Explicitly NOT in this PR

- **Class A (~27 items)** — blocked on the six divergent Figma node pairs
  (Homepage, Blog, Blog single, All Courses, Category, About Us). Writing pixel
  targets against unresolved nodes would be guessing.
- **Class D (8 items)** — out of round 1 by the execution plan. Blog hero moved
  here from Class C.
- **Class E (7 items)** — blocked on a design or product ruling. Nothing guessed;
  code untouched for all seven.
- **The verbatim 80-row tracker grid** — needs the source QA Google Doc, which is
  not available locally. The actionable rows are captured in `.context/qa-tracker.md`.

## Content gaps handed off (CMS, outside this repo)

| Endpoint      | Field                                | Stored value                                                   | Status                                    |
| ------------- | ------------------------------------ | -------------------------------------------------------------- | ----------------------------------------- |
| `/home`       | `certificate.images[0..1]`           | `/images/certificate/certificate-frame.png`, `/transcript.png` | 404 — mitigated by a bundled fallback     |
| `/home`       | `team.images[0..2]`                  | `/images/team/collaboration-{1,2,3}.jpg`                       | 404 — no equivalent asset, renders absent |
| `/about/page` | `commitment_section.blocks[*].image` | `null`                                                         | never uploaded — placeholder renders      |
| `/about/page` | `team_section.photos`                | `null`                                                         | never uploaded — placeholder renders      |
