## MODIFIED Requirements

### Requirement: Issue row schema

Each row in an issue table SHALL carry exactly these fields:

- `QA-ID` — format `QA-<PAGE>-<NN>`, preserved from the tracker verbatim, no renumbering
- `Ref` — the source-report item ID this row was filed from (`R-<PAGE>-<BP>-<NN>`), or
  `NONE` for a row with no report item behind it
- `Quote` — verbatim from the source QA doc; abridged with `…` only above ~80 characters
- `BP` — one of: `1920` / `1280` / `440` / `all`
- `Class` — one of: A, B, C, D, E
- `Status` — one of: `STILL-BROKEN` · `FIXED` · `CANT-REPRODUCE` · `BLOCKED-DESIGN` · `CONTENT-GAP` · `RECLASSIFIED`
- `Auto` — exactly one coverage value (see coverage vocabulary requirement)
- `Manual` — one imperative sentence, or `—` when `Auto` holds a real test reference. When
  `Ref` is `NONE`, this field SHALL state where the row came from instead

#### Scenario: Manual field empty when test ref present

- **WHEN** a row's `Auto` column holds a `file:line` or unit-test file reference
- **THEN** that row's `Manual` column is `—`

#### Scenario: Every row carries provenance

- **WHEN** a row is added to any page's issue table
- **THEN** its `Ref` names an item in `docs/qa/QA_REPORT_ITEMS.md`, or is `NONE` with the
  reason given in `Manual`

### Requirement: Page index as roadmap

The document SHALL open with a page index table containing one row per QA-scoped page (17 total). Each row SHALL carry: page name, Next.js route, readiness state (`GREEN` / `AMBER` / `RED`), open row count, blocked row count, and the name of the OpenSpec change that owns the remaining work (or `—` when none).

Readiness states: `GREEN` = all rows closed · `AMBER` = only BLOCKED-DESIGN rows remain · `RED` = shippable work outstanding.

The counts SHALL be derived from the rows beneath, never maintained independently of
them. A page whose index row disagrees with its own table is a failure of the document,
not a discrepancy to reconcile later.

#### Scenario: Page index reflects issue rows beneath

- **WHEN** a page has zero rows that are neither `FIXED` nor `CANT-REPRODUCE`
- **THEN** its index row shows `GREEN` and `Open: 0`

#### Scenario: Blocked rows do not block GREEN

- **WHEN** a page has only `BLOCKED-DESIGN` rows outstanding
- **THEN** its index row shows `AMBER`, not `RED`

#### Scenario: A page reads GREEN because rows are missing

- **WHEN** the source report contains an item for a page and no row cites it
- **THEN** the checker fails rather than the page reading `GREEN`
