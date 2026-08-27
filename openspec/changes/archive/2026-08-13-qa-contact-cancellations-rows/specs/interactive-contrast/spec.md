## Purpose

Sets the minimum text-to-background contrast for interactive controls painted in a brand
colour, so a token chosen for brand reasons cannot silently make button labels unreadable.

## ADDED Requirements

### Requirement: Interactive control labels meet WCAG AA contrast

Every interactive control whose label is rendered on a brand-colour fill SHALL present a
contrast ratio of at least **4.5:1** between the label colour and the fill colour, for
normal-weight text at normal size. The ratio SHALL be computed from the two colours as
actually rendered, not inferred from the class names that produced them.

This applies in the control's resting state. A hover or focus state SHALL NOT be the only
state that satisfies the floor.

#### Scenario: A brand-filled button in its resting state

- **WHEN** a control painted in a brand fill is rendered and its computed colour and
  background colour are read
- **THEN** the contrast ratio between them is at least 4.5:1

#### Scenario: Hover does not excuse the resting state

- **WHEN** a control's resting fill fails the floor but its hover fill passes
- **THEN** the control is treated as failing, because the resting state is what a user
  reads before interacting

### Requirement: The contrast floor is enforced across pages, not per page

The contrast check SHALL run against every page already covered by the design-fidelity
suite, rather than only the page whose QA row prompted it. A control that fails SHALL be
identified by page, by its accessible name or text, and by the two colours measured.

#### Scenario: The same defect on an uncovered surface

- **WHEN** a brand-filled control failing the floor exists on a covered page other than
  the one that prompted the rule
- **THEN** the check fails and names that page and control

#### Scenario: Reporting a failure

- **WHEN** the check fails
- **THEN** the failure message states the page, the control's text, the foreground and
  background colours, the observed ratio and the 4.5 floor
