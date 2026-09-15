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

### Requirement: Player modal inputs use design system field styling

Player overlay modals (review, completion) that contain form inputs SHALL use the
project's established form field styling constants (`MARKETING_FIELD_CLASS`,
`MARKETING_LABEL_CLASS` from `form-field.tsx`) rather than ad-hoc inline classes.
This ensures consistent focus rings, border radius, placeholder colors, and
padding across all form surfaces.

#### Scenario: Review modal input styling

- **WHEN** the review modal renders its title input and textarea
- **THEN** both elements use classes derived from `MARKETING_FIELD_CLASS` including `rounded-lg`, `border-neutral-40`, `focus-visible:border-secondary-500`, and `focus-visible:ring-2 focus-visible:ring-secondary-500/30`

#### Scenario: Completion modal uses no inline style attributes

- **WHEN** the completion modal renders its heading, icon, and buttons
- **THEN** no `style={}` attributes are used for color or background; all colors are expressed as Tailwind classes (arbitrary values permitted for brand colors not in the token system)

### Requirement: Player modal text uses project font families

Player overlay modals SHALL apply `font-suse` to headings and `font-open-sans`
to body text, matching the typography conventions used on the certificate page
and dashboard.

#### Scenario: Completion modal heading font

- **WHEN** the completion modal renders the "Congratulations!" heading
- **THEN** the heading element has `font-suse` applied

#### Scenario: Completion modal body font

- **WHEN** the completion modal renders body text or button labels
- **THEN** those elements have `font-open-sans` applied

### Requirement: Completion modal uses shadcn Button component

The completion modal SHALL use the shadcn `Button` component from
`@/components/ui/button` for all interactive buttons, rather than raw HTML
`<button>` elements. This ensures consistent focus styles, disabled states,
and variant support.

#### Scenario: Leave a review button

- **WHEN** the completion modal renders the "Leave a review" action
- **THEN** it uses `<Button variant="outline">` with consistent padding and focus ring

### Requirement: Player modal DialogContent may use hardcoded brand colors

The `DialogContent` component in player overlay modals (review, completion) MAY
use hardcoded brand colors via Tailwind arbitrary values when the design token
system does not cover the specific shade needed (e.g. `bg-[#00204A]` for dark
navy backgrounds). This exception applies only to the top-level `DialogContent`
background; all other elements within the modal SHALL use tokens or Tailwind
classes.

#### Scenario: DialogContent uses hardcoded navy background

- **WHEN** the player modal is rendered inside a dark-themed layout (e.g. course player with `bg-black`)
- **THEN** `DialogContent` may use `bg-[#00204A]` to ensure consistent dark background regardless of the `--background` CSS variable's theme state

#### Scenario: DialogContent border is removed for dark backgrounds

- **WHEN** `DialogContent` uses a hardcoded dark background color
- **THEN** the `border` utility class may be removed to avoid a visible light border against the dark background
