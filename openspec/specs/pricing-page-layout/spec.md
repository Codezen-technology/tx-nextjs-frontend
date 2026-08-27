# pricing-page-layout Specification

## Purpose

Fixes the pricing page's two measurable layout properties — how much room the hero gives
its content, and where the page's sections start — against the frame that holds all three
widths.

## Requirements

### Requirement: The pricing hero uses the measured vertical inset

The pricing hero SHALL inset its content by **112px** above and below at desktop widths,
the value measured on `6239:135726` (band 320, title at y=112 with height 96). The band's
height follows from its content rather than being fixed, so a longer title grows the band
instead of shrinking the inset.

#### Scenario: Hero inset at 1920

- **WHEN** the pricing hero is rendered at 1920
- **THEN** the distance from the band's top edge to its content is 112px, and the same
  below

#### Scenario: A longer title

- **WHEN** the hero title wraps to a second line
- **THEN** the inset stays 112px and the band grows

### Requirement: Every pricing section starts on the page column

Sections on the pricing page SHALL begin at the page grid's side padding — no section
applies it twice. A component that carries its own `container` SHALL NOT be wrapped in
another.

#### Scenario: Categories section alignment at 440

- **WHEN** the pricing page is rendered at 440
- **THEN** the categories heading starts at the same x as the other sections' content,
  24px from the viewport edge

#### Scenario: Alignment holds at desktop

- **WHEN** the pricing page is rendered at 1920
- **THEN** the categories heading starts at the same x as the FAQ heading

### Requirement: The pricing page's categories section carries no call to action

On the pricing page, the "explore courses by category" section SHALL render its heading and grid with no accompanying call-to-action link.

The same section on the homepage SHALL keep its link. The two pages' frames differ on this point, so the section is configured per page rather than changed everywhere — the homepage's placement was measured and accepted separately.

#### Scenario: The categories section on the pricing page

- **WHEN** `/pricing` is rendered
- **THEN** the categories section's heading row contains no "view all courses" link

#### Scenario: The same section on the homepage

- **WHEN** the homepage is rendered
- **THEN** the categories section still carries its "view all courses" link
