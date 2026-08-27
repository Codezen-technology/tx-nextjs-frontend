## Why

Three different answers currently exist for how wide a page's content should be:

| Source              | Content width                                 | Provenance                                                                                        |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Figma, measured     | **1296**                                      | `6013:89909`, `6015:127034`, `6015:127141` — consistent across every page measured                |
| This codebase       | **1368** (`max-width: 1400px` − 32px padding) | arrived 2026-07-08 in a commit titled "update documentation and enhance Tailwind CSS integration" |
| Live WordPress site | 1366 / 1300 / 1216 / 1200                     | never 1400, never 1296                                                                            |

Nobody appears to have chosen 1400. It is not in the design, it is not on the
site being replaced, and it entered the repo in a scaffolding commit rather than
a design decision. But it is now load-bearing in five places, including the
header and mega menu.

The QA report never raised it — no item says "the page is too wide" — which is
exactly why it was left alone while the padding ramp shipped. That was the right
call for a QA fix and the wrong place to leave it permanently: it is the last
20px preventing the 1920 breakpoint from matching the design, and it will keep
resurfacing in every future design-fidelity pass.

`header-acf-content` (0/20) is queued to touch the header next. Settling the
grid before that starts is cheaper than settling it after.

## What Changes

- **Decide the canonical content width** — 1296 (design), 1368 (status quo), or a
  documented third value — and record the decision with its rationale, so it
  stops being re-derived.
- **Make the container the single source of the grid.** Today `max-width: 1400px`
  is hardcoded in four components plus the container utility, and one component
  carries a `calc((100vw-1400px)/2+1rem)` bleed that silently depends on it.
  After this change, one token defines the grid and every consumer reads it.
- **Apply the decision** across the container, header, minimal header, mega menu,
  and the trusted-orgs bleed, keeping them in agreement at every breakpoint.
- **Extend the breakpoint ramp to 1920** so the widest viewport matches its
  measured target the way 1280 and 440 already do.
- **Add a grid check** asserting that every consumer of the grid agrees with the
  token at 1920 / 1280 / 440 — the failure mode being fixed is precisely that
  they drifted apart.
- Non-goal: no other visual values change. This is the grid only.

## Capabilities

### New Capabilities

- `page-grid`: The canonical content width and side padding at each supported
  breakpoint, the requirement that a single token defines them, and the
  requirement that every full-width surface agrees with it.

### Modified Capabilities

None. No page's behaviour or content changes — only how wide its content column
is. The existing page specs describe what each page renders, not its measurements.

## Impact

**Code**

- `src/app/globals.css` — the `container` utility and the grid token
- `src/components/layout/header.tsx` — `max-w-[1400px]`
- `src/components/layout/minimal-header.tsx` — `max-w-[1400px]`
- `src/components/layout/mega-menu.tsx` — `max-w-[1400px]`
- `src/components/home/trusted-orgs.tsx` — `calc((100vw-1400px)/2+1rem)` bleed

**Verification**

- `e2e/` — a grid check across the three breakpoints

**Risk**

Every public page reflows horizontally. This is the highest blast-radius change
in the QA programme, which is why it is scoped alone rather than folded into a
fix batch.

**Blocked on**

A decision. The measurement is unambiguous — the design says 1296 — but whether
to follow it is a product and design call, not something to infer. This change
is proposed so the decision has somewhere to live; it should not be implemented
until that decision is made.

**Not affected**

No API contract, no routing, no data model, no dependencies.
