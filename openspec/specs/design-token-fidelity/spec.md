# design-token-fidelity Specification

## Purpose

Establishes which Figma node is authoritative for each public page and how a
spacing or typography value is derived from it, so visual fixes are traceable to
a measurement rather than to prose in a QA report.

## Requirements

### Requirement: Each page has one recorded authoritative Figma node

Every public page covered by a design-fidelity fix SHALL have exactly one Figma
node recorded as authoritative, together with the evidence that selected it.
Where two candidate nodes exist, the record SHALL state which values were
compared and how they differed. A page whose candidates disagree on a value this
work depends on, and where measurement cannot break the tie, SHALL be recorded as
blocked rather than resolved by preference.

#### Scenario: Two candidate nodes agree on the values in question

- **WHEN** both candidate nodes are measured for the properties a fix depends on
- **AND** those properties hold the same values in each
- **THEN** the newer node is recorded as authoritative, the agreement is recorded as the evidence, and the fix proceeds

#### Scenario: Two candidate nodes disagree

- **WHEN** the candidates differ on a property a fix depends on
- **THEN** the difference is recorded with both values, the page is marked blocked for that property, and no value is applied to code

#### Scenario: A page has no valid design reference

- **WHEN** a page's cited node resolves to a different page, or no node is cited
- **THEN** the page is recorded as having no design reference and its items are not given derived targets

### Requirement: A visual target is derived from measurement, not from prose

A spacing, padding, sizing or typography value applied to code SHALL be derived
from the authoritative node's geometry or variables. Where the QA report states a
range or an approximation, the measured value SHALL take precedence. Every applied
value SHALL be traceable to the node and property it came from.

#### Scenario: The report states a range

- **WHEN** the report specifies a range such as "80–100px" for a spacing value
- **THEN** the value applied is the one measured on the authoritative node, not an arbitrary point in the range

#### Scenario: The report states no target

- **WHEN** the report describes a defect without a target value
- **AND** the authoritative node supplies an unambiguous value for that property
- **THEN** that measured value is applied and recorded as its own justification

#### Scenario: Neither the report nor the node supplies a target

- **WHEN** the report gives no target and the node does not disambiguate
- **THEN** the item is left unchanged and recorded as blocked on a design decision

### Requirement: Applied values match their recorded targets at every supported breakpoint

For each page and property covered, the value computed in a browser SHALL match
the recorded target at 1920, 1280 and 440, within a tolerance recorded alongside
the target. A property whose design target differs per breakpoint SHALL have a
target recorded for each.

#### Scenario: A covered property is checked

- **WHEN** the fidelity check runs against a covered page
- **THEN** each covered property's computed value is compared to the recorded target for that breakpoint and passes within tolerance

#### Scenario: A value regresses

- **WHEN** a change moves a covered property away from its recorded target
- **THEN** the check fails, naming the page, the property, the breakpoint, the expected target and the observed value

### Requirement: The check asserts the design target, not the stylesheet

The fidelity check SHALL compare computed values against targets recorded from
Figma. It SHALL NOT assert that a stylesheet declaration equals itself, and it
SHALL NOT depend on full-page screenshot comparison.

#### Scenario: A check is added for a new property

- **WHEN** a property is brought under the fidelity check
- **THEN** its expected value in the check is the number recorded from the authoritative node, independent of how the stylesheet expresses it

#### Scenario: An unrelated visual change is made elsewhere on the page

- **WHEN** a page changes in a way that does not touch a covered property
- **THEN** the fidelity check for that page still passes
