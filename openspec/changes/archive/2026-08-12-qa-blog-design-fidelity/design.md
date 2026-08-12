## Context

See proposal.md — Why. The constraints that shape the approach:

- **The Blog node pair is already resolved.** `.context/figma/node-resolution.md` records
  the two candidates as geometrically identical, so "either node" is authoritative and
  slice 0 closed the question. No new resolution work.
- **`e2e/design-fidelity.spec.ts` already measures `/blog`.** Its first describe block
  navigates to `/blog` and asserts content width, side padding, card width and gutter
  against `TARGETS` at all three breakpoints. `A3`'s 1280 padding is _already_ covered
  there — `TARGETS[1280].sidePadding = 128`.
- **`measure()` is a single `page.evaluate`** returning content, side padding, header
  grid alignment, card width, gutter and column count. Most new assertions need a field
  added to it, not a new helper.
- **Two of the three rows are expected to need no code.** The runbook flags `A3` as
  verify-and-close and `A4`'s weight half as already shipped.

## Goals / Non-Goals

**Goals:**

- Every closed row leaves behind an assertion that fails if the value drifts
- The hero band target is measured and recorded before any code moves
- `A4`'s casing half reaches a verdict — fixed, or recorded as not-a-defect with evidence

**Non-Goals:**

- The Blog hero gradient and pattern (report issue 1) — Class D, its own change
- Blog card month abbreviation (`QA-BLOG-B?`) and the CTA-to-footer 80px — not Class A rows
  in this slice's scope
- The 1400 vs 1296 content-column question, deliberately open in `site-page-grid`
- Retrofitting Blog assertions onto other pages, even where the fix is shared

## Decisions

### 1. Check `A3` before touching it, and expect to close it on evidence alone

`TARGETS[1280].sidePadding = 128` is asserted today against `/blog`. If that passes, the
row is closed by pointing `Auto` at the existing line — no new test, no code.

The alternative, writing a fresh Blog-specific padding assertion, would duplicate an
existing one and give the impression the row needed work. A row closed by an existing
test is a legitimate outcome and cheaper to maintain.

**Risk this hides a real defect:** the existing assertion runs at `chromium` (1280), so a
pass is real evidence, not an inference.

### 2. Assert the hero band, don't derive it from the section's own padding

`QA-BLOG-A2` names hero top/bottom spacing at 1920. The frame gives the hero band as
`y=172 h=320`. Measure the rendered hero's vertical inset the same way `QA-HOME-A1` did —
read `paddingTop`/`paddingBottom` off the hero's content wrapper — rather than computing
it from the band height minus content, which bakes in an assumption about what sizes the
band.

Homepage set the precedent: its band is sized by the taller of two columns, so the inset
was 133/134 rather than any round number in the report. Blog's band may or may not work
the same way, which is exactly why it gets measured rather than assumed.

### 3. Reuse the Homepage's casing verdict only if the Blog frame agrees

`QA-HOME-A3` concluded casing is **not a defect** — the frame itself mixes sentence and
title case, so there is no rule to assert. `A4` is the same report sentence on a
different page.

The runbook's rule is explicit: _never generalise a value across pages without measuring
each one._ So the Blog frame's heading strings get read before the same verdict is
reused. If Blog's headings are uniformly title case, that is a real rule and it gets
asserted; if they mix, the row closes with the Homepage's reasoning and Blog's own
evidence.

**Alternative rejected:** carrying the Homepage verdict straight across. That is precisely
the generalisation that produced the About Us heading-weight contradiction in `1c92a4e`.

### 4. One commit, and only after the test has failed once

Runbook recipe steps 4 and 8. A test written after the fix proves nothing about the fix,
so each assertion is watched failing before the corresponding change is made. Where no
change is needed, the assertion is watched passing against the _current_ build and the
row closes as verify-and-close — which is a different claim, and recorded as such.

## Risks / Trade-offs

- **Two of three rows close without code** → Reads as a slice that did nothing. Mitigated
  by recording _what evidence_ closed each row in `QA_BY_PAGE.md`'s Manual column, so
  "already correct, now guarded" is distinguishable from "fixed".
- **The hero inset may be entangled with the gradient work** → The Class D gradient
  proposal may restructure the hero band. Mitigated by asserting the inset (a padding
  value) rather than the band height, so a later background change does not invalidate it.
- **`A4` may reopen the casing question repo-wide** → If Blog's frame _does_ show a title
  case rule, `QA-HOME-A3`'s not-a-defect verdict becomes page-specific rather than
  universal, and `QA-CAT-A3` / `QA-COURSES-A3` inherit the question. Recorded as a finding
  rather than silently applied to those pages.
- **Prod cannot confirm any of it** → `backend.trainingexcellence.org.uk` runs `main`, so
  every fix on this branch is unverifiable on the QA host until deploy. Same caveat the
  Homepage slice carries; called out in the PR rather than left implicit.

## Migration Plan

None. No data, no API, no dependency changes. Rollback is `git revert` of one commit.

## Open Questions

None that block. `A4`'s casing outcome is decided by measurement during the slice, and
either outcome is handled by decision 3.
