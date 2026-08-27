## Context

See `proposal.md` — Why. The state this design has to work with:

- `FallbackImage` (`src/components/ui/fallback-image.tsx`) already exists from the
  homepage fix. It is a client component wrapping `next/image` with an `onError`
  swap to a fallback, or to nothing when no fallback is given. Two shipped
  consumers: `cpd-certificate.tsx` and `transform-team.tsx`.
- `SafeImage` (`src/components/ui/safe-image.tsx`) also exists and is a server
  component. It only guards against an unusable `src` _string_ — it cannot detect
  a load failure, because that only happens in the browser. The two are
  complementary, not duplicates.
- `about-image-placeholder.tsx` already exists for About Us and is the established
  neutral placeholder for that page.
- The collapse pattern is `w-auto` **and** `h-auto` on the same `next/image`.
  A grep found exactly one further instance beyond the two already fixed:
  `home/accreditations.tsx` (`h-auto max-h-20 w-auto`). Three other files use
  `w-auto` with a pinned height (`h-14 w-auto`, `h-16 w-auto`, `h-12 w-auto`),
  which degrades to zero _width_ rather than a full 0×0 collapse — a lesser
  variant of the same problem, on CMS-sourced logos.
- Surfaces still to triage differ structurally: `category-why-choose-us.tsx` uses
  `fill` inside a `lg:h-[312px] lg:w-[526px]` parent (already immune to the
  collapse, so its failure is likely a content gap); Blog hero is a CSS gradient
  with no `<img>` at all, so the reported failure is probably about a different
  element than the name suggests.

Two constraints shape everything below:

1. **Only the browser knows an image failed.** The server cannot distinguish a
   valid-looking URL from a 404. Any real fix therefore needs a client component
   at the leaf, even on server-rendered pages.
2. **`next/image` requires a sized box or it will collapse.** `width`/`height`
   props alone do not survive a Tailwind class that sets `width: auto`.

## Goals / Non-Goals

**Goals:**

- One mechanism for CMS images, applied consistently, rather than six bespoke fixes.
- A per-surface verdict that is _recorded_, so "we looked and it is a content gap"
  is distinguishable from "we did not look".
- E2E assertions that fail on either failure mode independently — decode and box.

**Non-Goals:**

- Not replacing `next/image` or introducing an image library.
- Not converting server components to client components wholesale — only the leaf
  image element becomes client.
- Not fixing the CMS content. Confirmed gaps are itemised and handed off.
- No Class A spacing work rides along, even where the same file is open.

## Decisions

### D1 — Extend `FallbackImage` rather than add a second component

`FallbackImage` already encodes the failure semantics the spec requires. The
remaining surfaces need one addition: About Us wants a _component_ placeholder
(`AboutImagePlaceholder`), not a fallback _URL_. So `FallbackImage` gains an
optional `fallback` ReactNode alongside the existing `fallbackSrc`.

_Alternative considered:_ a separate `PlaceholderImage` for About Us. Rejected —
two components with the same failure logic will drift, and the spec states one rule.

### D2 — Pin one axis explicitly on every CMS image; never both `auto`

The rule applied to the remaining surfaces: an explicit `w-*` **or** a `fill`
inside a sized parent. `h-auto` paired with an explicit width is fine and
preserves aspect ratio — that is what the certificate fix uses.

For the logo strips (`accreditations`, `trusted-orgs`, `footer`, `block-renderer`)
the fix is a `min-w`/`w-*` floor rather than a hard width, because those logos are
deliberately variable-width and hard-coding one would distort them.

_Alternative considered:_ a global CSS rule targeting `img[data-nimg]`. Rejected —
it would fight legitimate `w-auto` uses on local assets and is invisible at the
call site.

### D3 — Triage each surface before writing a fix, and record the verdict

Per plan §3.3 each Class C item gets a `component-bug` or `CONTENT-GAP` verdict.
The evidence for a verdict is a measurement, not a reading of the code: fetch the
CMS field, fetch the URL it holds, and measure the rendered element's box in a
real browser. This is how the homepage pair was resolved and it produced a
different answer than code inspection alone would have (it was _both_).

Blog hero is called out explicitly: it currently renders no `<img>`, so the first
task is to establish what the QA note actually refers to before any fix.

_Alternative considered:_ fix everything defensively and skip triage. Rejected —
it would mask content gaps that need to leave this repo, and the plan asks for
the verdict.

### D4 — E2E assertions assert decode and box separately

A single helper in `e2e/qa-round-1.spec.ts` takes a route and a locator, scrolls
each image into view (they are lazy — `naturalWidth` stays 0 until then), then
asserts `complete`, `naturalWidth > 0`, and a non-zero bounding box. Surfaces are
driven from a table so adding one is a single row, and each runs under all three
viewport projects already configured.

_Alternative considered:_ visual regression snapshots. Rejected for the same
reason the execution plan rejects them — they fail on every legitimate design
change and get `--update-snapshots`'d into meaninglessness.

### D5 — Housekeeping ships as its own commit, first

Archiving the stale change, gitignoring `test-results/`, and deleting the dead
component are unrelated to the image work and would otherwise pollute its diff.
`test-results/` in particular has already caused a stash conflict during round 1,
so it goes first.

Deleting `course-info-card.tsx` is safe: zero importers, verified by grep. It is
included here rather than left alone because it contains a `/checkout?course=`
CTA that would silently reintroduce the Class B routing bug if anyone wired it up.

## Risks / Trade-offs

- **A surface turns out to be a content gap with no fallback asset available**
  → The page still renders correctly (nothing in the slot), the gap is itemised
  for the CMS, and the tracker row is `CONTENT-GAP`. This already happened with
  the homepage team photos; it is an accepted outcome, not a failure.

- **Blog hero's QA note may not describe an image at all** → Triage-first (D3)
  surfaces this in the first task rather than after a fix is written. If it turns
  out to be a Class A or Class E item, it moves out of this change and is recorded
  as such.

- **Making a leaf image a client component moves it out of the server render** →
  Scope is one `<img>`; the surrounding section stays a server component, so the
  payload cost is a few hundred bytes per surface. Measured against the
  alternative (a visibly broken public page) this is not close.

- **`FallbackImage` cannot detect an image that loads but is wrong** (a 200 that
  returns a placeholder graphic from the CMS) → Out of scope; no automated check
  can judge that. Recorded as a known limit.

- **Logo-strip fixes touch shared header/footer components** → Those are on the
  critical path for every page, so they ship in a separate commit from the
  page-specific work and are covered by the existing smoke specs.

## Migration Plan

No data migration, no API change, no rollback complexity — every change is a
frontend render detail behind existing routes.

Sequence:

1. Housekeeping (D5) — independently revertable, touches no rendering code.
2. `FallbackImage` gains the `fallback` ReactNode prop (D1) — additive, existing
   two consumers unaffected.
3. Triage pass (D3) — produces verdicts, writes no product code.
4. Per-surface fixes, one commit per page, each with its E2E row (D2, D4).
5. Logo-strip sweep, separate commit (D2).

Rollback is per-commit. Nothing here is coupled to a deploy or a CMS change; the
content gaps are handed off asynchronously and the frontend is correct with or
without them being fixed.

## Open Questions

- Whether the Category "Why Choose Us" desktop and mobile reports are the same
  underlying failure or two. The component uses `fill` in a sized parent for
  desktop and the mobile branch differs; the triage pass answers this and it does
  not change the approach either way.
