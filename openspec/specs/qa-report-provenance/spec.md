# qa-report-provenance Specification

## Purpose

Ties every row in the QA verification sheet to a specific item in the source QA report,
in both directions, so that neither a missing row nor an invented one can survive a test
run — the two failure modes that have each produced a wrong page index three times.

## Requirements

### Requirement: The source report's items are committed as an inventory

A file `docs/qa/QA_REPORT_ITEMS.md` SHALL hold one entry per item in the source QA
report, in the report's own order, grouped by the report's own page headings. Each entry
SHALL carry:

- a stable **item ID** of the form `R-<PAGE>-<BP>-<NN>`, where `<BP>` is `1920`, `1280`
  or `440` — the report's own breakpoint heading
- the item's text, verbatim, abridged only above ~120 characters
- the item's `Solution(Dev)` text, verbatim, or `—` when the report leaves it blank
- the assignee the report names: `Dev`, `Design`, or `Dev & Design`

Item IDs SHALL NOT be renumbered when an item is added; a new item takes the next free
number for its page and breakpoint. The report itself numbers items inconsistently —
duplicate and skipped numbers appear throughout — so the inventory's IDs are assigned by
position, not copied from the report.

#### Scenario: An item the report left unsolved

- **WHEN** the report states an issue but leaves `Solution(Dev)` blank
- **THEN** the inventory entry records the issue text and `—` for the solution, rather
  than omitting the item

#### Scenario: The report's own numbering repeats

- **WHEN** the report lists two items both labelled "Issue 4"
- **THEN** the inventory gives them distinct sequential IDs and records both

### Requirement: Every QA row cites an inventory item

Each row in `docs/qa/QA_BY_PAGE.md` SHALL carry a `Ref` field naming the inventory item
it was filed from. Where one row closes several inventory items — the report frequently
lists two or three fixes under one issue heading — `Ref` SHALL name all of them, so the
reverse check still sees each item as covered. A row that describes work not present in
the report SHALL cite `NONE` and SHALL state in its `Manual` field why it exists — a row
with no provenance and no explanation is a triage error, not a finding.

#### Scenario: A row filed from a report item

- **WHEN** a QA row is filed for a defect the report names
- **THEN** its `Ref` holds that item's ID, and the ID exists in the inventory

#### Scenario: A row with no report item behind it

- **WHEN** a row exists that the report does not contain
- **THEN** its `Ref` is `NONE` and its `Manual` field states where it came from

### Requirement: Every inventory item has a row

Each item in the inventory SHALL be cited by at least one row in `docs/qa/QA_BY_PAGE.md`.
An item the team decides not to work SHALL still have a row, carrying the status that
records that decision (`CANT-REPRODUCE`, `CONTENT-GAP`, `BLOCKED-DESIGN` or
`RECLASSIFIED`) — silence is not a decision.

#### Scenario: An item nobody triaged

- **WHEN** an inventory item is cited by no row
- **THEN** the structural checker fails, naming the item ID and the page

#### Scenario: An item deliberately not worked

- **WHEN** the team decides an item will not be fixed
- **THEN** a row exists citing it, with a status and a stated reason

### Requirement: The checker enforces provenance in both directions

`scripts/qa-doc-check.mjs` SHALL assert that every row's `Ref` resolves to an inventory
item or is `NONE`, and that every inventory item is cited by at least one row. Both
failures SHALL name the page and the offending ID.

#### Scenario: A dangling reference

- **WHEN** a row cites an item ID that the inventory does not contain
- **THEN** the checker fails, naming the row's QA-ID and the missing item ID

#### Scenario: A clean sheet

- **WHEN** every row cites a real item and every item is cited
- **THEN** the checker reports no provenance failures
