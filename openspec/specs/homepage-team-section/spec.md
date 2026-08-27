# homepage-team-section Specification

## Purpose

Covers the homepage's "Transform Your Team" band — that its decorative backdrop never intercepts input, and that its call to action stays reachable and shows a hover affordance.

## Requirements

### Requirement: Decorative backdrops do not take pointer events

A full-bleed decorative image or overlay in this section SHALL NOT receive pointer events, and the section's content SHALL paint above it. Decoration that is hidden from assistive technology must also be invisible to the pointer — otherwise it silently disables everything beneath it, and the failure looks like a styling bug rather than a dead control.

#### Scenario: The pointer reaches the call to action

- **WHEN** the section is rendered and a pointer is placed at the centre of its call-to-action button
- **THEN** the element under that point is the button itself, not the backdrop

#### Scenario: The call to action can be clicked

- **WHEN** a user clicks the call to action
- **THEN** the click reaches the link and navigates to its destination, with no interception

### Requirement: The call to action shows a hover affordance

The section's call to action SHALL change appearance on hover, and the change SHALL be animated on every property it alters.

#### Scenario: Hover changes the fill

- **WHEN** the pointer rests on the call to action
- **THEN** its background colour differs from its resting colour

#### Scenario: The change is transitioned

- **WHEN** the button's transition is inspected
- **THEN** every property the hover state alters is covered by it, so no part of the change lands instantly while another animates
