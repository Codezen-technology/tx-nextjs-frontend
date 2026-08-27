## Context

See `proposal.md` — Why. The facts this design is built on, all verified rather
than assumed:

- **Figma is reachable.** `whoami` returns a Dev seat on the Codezen team.
  `get_metadata` on `6013:89909` returns `<frame name="Homepage - Redesigned"
width="1920" height="7055">` with `x`/`y`/`width`/`height` on all 662
  descendants. Section rhythm is therefore directly measurable: `Header` at
  `y=0 h=136`, `Trusted` at `y=136 h=36`, `Hero Section` at `y=172 h=844`.
- **The metadata dump is large.** That one call returned ~110k characters and
  overflowed the tool's token budget, landing in a file instead. Any workflow
  that pulls whole-page metadata into the main context will not survive six
  pages.
- **Rate limits apply.** The account is on starter/student tiers, and the Figma
  MCP surfaces a rate-limit doc. Measurement has to be batched, not chatty.
- **The report's ranges are not targets.** "80–100px", "more standard and middle
  align" — the frame holds one number; the prose does not.
- **Two rounds of triage have each overturned a paper assumption** on this
  report. The homepage images were a component bug _and_ a content gap; five of
  six remaining Class C items were `CANT-REPRODUCE`. The measure-first pattern
  is what produced both.

## Goals / Non-Goals

**Goals:**

- Turn "six team decisions" into "however many are genuine ties after
  measurement" — likely fewer, possibly none.
- Produce a per-page node resolution artifact that outlives this change, so the
  next round does not re-litigate it.
- Make each applied value traceable to the node and property it came from.

**Non-Goals:**

- Not building a Figma-to-CSS sync. This is a one-time reconciliation.
- Not bringing every property under the fidelity check — only those a QA item
  names. A check that asserts everything fails on every legitimate change.
- Not touching Class D, and not guessing at items that stay ambiguous.
- Not full-page visual regression, for the reason the execution plan already
  gives.

## Decisions

### D1 — Measure in a subagent; return numbers, not metadata

One page's metadata is ~110k characters. Six pages would exhaust the main
context before any code is written. Each page's measurement runs in a subagent
that reads the dump and returns only the properties this change needs — a small
table of `property → value → node id`.

_Alternative considered:_ `get_design_context` per component. Rejected — more
calls against a rate-limited account, and it returns generated code rather than
the geometry the targets are derived from.

_Alternative considered:_ paging the metadata inline with `jq`. Workable for one
page, but it puts the extraction burden in the main loop six times over.

### D2 — Resolve a node pair on the properties in question, not wholesale

The execution plan framed each divergent pair as one decision. It is not: a pair
can agree on hero spacing and disagree on card sizing. Resolution is therefore
per property, and a page can be partly resolved and partly blocked.

Where both candidates agree on every property this change needs, the newer node
is recorded as authoritative and the agreement _is_ the evidence — no human
decision is required, because there is nothing to decide.

_Alternative considered:_ pick the newer node everywhere and move on. Rejected —
About Us is the one pair where the report cites the _newer_ node, so a blanket
rule would silently contradict the report on exactly the page most likely to
have been measured deliberately.

### D3 — Record targets in a checked-in table, and drive the test from it

Targets live in one committed file mapping page → property → breakpoint →
expected value → source node. The fidelity spec reads that table. This keeps the
assertion honest: the expected value is the number from Figma, not a copy of the
CSS. It also means a designer changing a value updates one row.

_Alternative considered:_ inline expected values in the spec. Rejected — the
provenance disappears, and the next person cannot tell a measured value from a
guessed one.

### D4 — Assert computed values with a tolerance, per breakpoint

Browser layout, fractional scaling and font metrics mean an exact integer match
is the wrong assertion. Each target carries a tolerance recorded with it. Targets
are per breakpoint, because several Class A items specify different values at
440 than at 1280.

_Alternative considered:_ exact equality. Rejected — it converts rounding into
red builds, which is how a suite gets ignored.

### D5 — Sequence: resolve → record → apply → check

No code changes until the node resolution and the target table exist. This is
the same ordering that made the Class C pass produce verdicts instead of
speculative fixes, and it is what makes a blocked item visibly blocked rather
than quietly skipped.

Class E items are folded in at the resolution step rather than as a separate
pass: several were already identified as answerable from tokens, and with the
frame available a few more may resolve. Whatever does not is recorded as
`BLOCKED-DESIGN`, unchanged.

## Risks / Trade-offs

- **Rate limiting stalls the measurement pass** → Batch one call per page, cache
  each dump to disk, and resolve from the cached file. Re-runs cost nothing.

- **A pair disagrees on many properties, and the page stalls** → That is the
  honest outcome and the artifact still has value: the escalation names the
  properties and both values, which is far more actionable than "resolve the
  Homepage node".

- **Targets drift as the design evolves** → The table records the source node per
  row, so a stale row is identifiable rather than mysterious. This is a one-time
  reconciliation, not a live sync, and it is documented as such.

- **The check grows into de-facto visual regression** → Scope is bounded to
  properties a QA item names. Adding a property is a deliberate row, not a
  side effect.

- **Measured values contradict the report** → The spec resolves this: the
  measurement wins, and the discrepancy is recorded. The report already proved
  unreliable on three link errors, two blank solutions and a copy-paste, so this
  is expected rather than alarming.

## Migration Plan

Pure frontend visual changes behind existing routes. No data migration, no API
change, no deploy coupling.

Sequence:

1. Measure and resolve the six pairs (no code).
2. Commit the node resolution and target table (no code).
3. Apply values, grouped by page, one commit per page.
4. Add the fidelity check driven from the table.

Rollback is per-commit; step 3's commits are independent of each other.

## Open Questions

- Whether the 440 frames are complete for every page, or only for the pages the
  report covers at that width. If a mobile frame is missing, those items are
  recorded as having no design reference rather than derived from the 1280 frame.
  This does not change the approach — it changes how many items resolve.
