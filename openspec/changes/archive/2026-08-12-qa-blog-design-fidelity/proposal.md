## Why

Three Class A rows are open on `/blog` — `QA-BLOG-A2`, `A3`, `A4` — and they are the
next slice in `docs/qa/QA_EXECUTION.md` now that the Homepage slice has closed. The
Blog Figma pair was resolved by measurement during slice 0 (the two candidate nodes
are geometrically identical), so nothing here is gated on a design decision.

Two of the three are expected to be verify-and-close rather than fixes: the 128px
laptop padding shipped with the `site-page-grid` change and was confirmed in-browser,
and the `/blog` section headings are already `font-bold`. The value of the slice is
therefore mostly in **proving** those two with tests that fail when the value drifts,
and in settling the casing question that `A4` shares with three other pages.

This change takes over **task 5.3** of `qa-class-a-design-fidelity`. That task is not
worked in both places: its entry there becomes a pointer here, exactly as the runbook
requires a page to have one owner.

## What Changes

- Measure the Blog hero band on the authoritative node and record the target with its
  source, per the `design-token-fidelity` rule that measurement beats the report's prose
- Add Blog rows to the `TARGETS` map in `e2e/design-fidelity.spec.ts`, each with a
  per-breakpoint tolerance and a comment citing the node
- Assert the hero's vertical inset at 1920, the container side padding at 1280, and the
  section heading weight on `/blog` — each test written before any fix and watched to fail
- Apply the smallest change that hits each measured number, only where the assertion
  actually fails
- Settle `QA-BLOG-A4`'s casing half. The Homepage precedent (`QA-HOME-A3`) found the
  frame mixes sentence and title case, so there was no rule to assert; if the Blog frame
  agrees, the casing half is recorded as **not a defect** rather than left open
- Flip the three rows in `docs/qa/QA_BY_PAGE.md` and decrement the page index
- Repoint `qa-class-a-design-fidelity` task 5.3 at this change

## Capabilities

### New Capabilities

None. The Blog slice applies requirements that already exist.

### Modified Capabilities

None. `design-token-fidelity` already requires that each page have one authoritative
node, that targets be derived from measurement rather than prose, and that applied
values match their recorded targets at every supported breakpoint. `page-grid` already
defines the 312 / 128 / 24 side-padding ramp. This change is those requirements applied
to one more page — no spec-level behaviour changes, so `.openspec.yaml` sets
`skip_specs: true`.

Inventing a Blog-specific requirement to satisfy validation would make the spec
describe pages rather than behaviour, which is what `design-token-fidelity` exists to
avoid.

## Impact

| Area                                                                  | Change                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `e2e/design-fidelity.spec.ts`                                         | New Blog describe block; `TARGETS` gains any Blog-specific row    |
| `.context/figma/targets.md`                                           | Measured hero band recorded with its source node                  |
| `src/components/blog/*`, `src/app/[locale]/(marketing)/blog/page.tsx` | Only where an assertion fails; expected to be small or empty      |
| `docs/qa/QA_BY_PAGE.md`                                               | Three status flips, page index `Open 3 → 0`, `Ready` re-evaluated |
| `openspec/changes/qa-class-a-design-fidelity/tasks.md`                | Task 5.3 repointed here                                           |

Risk is low and contained: the Blog page shares its container with every other page
through `page-grid`, so a padding change would surface repo-wide — which is why the
1280 row is expected to pass untouched. The five known-failing E2E specs
(`smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`)
are the baseline to compare against, not zero.
