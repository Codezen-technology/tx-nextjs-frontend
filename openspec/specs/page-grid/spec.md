# page-grid Specification

## Purpose

Defines the canonical content width and side padding at each supported
breakpoint, and requires that every full-width surface derives its horizontal
geometry from one place rather than restating it.

## Requirements

### Requirement: One token defines the page grid

The content width and side padding SHALL be defined once and referenced by every
consumer. No component SHALL restate the grid as a literal value. A surface that
needs to align to the grid — including one that visually bleeds past it — SHALL
derive its geometry from the same definition.

#### Scenario: A component needs the content width

- **WHEN** a component needs to align its contents with the page grid
- **THEN** it references the shared definition rather than repeating a numeric width

#### Scenario: A component bleeds past the grid edge

- **WHEN** a component extends beyond the content column to the viewport edge
- **AND** it must still align one of its edges to the grid
- **THEN** it computes that alignment from the shared definition, so a change to the grid moves it too

#### Scenario: The grid value changes

- **WHEN** the canonical content width is changed in one place
- **THEN** every surface that aligns to the grid moves with it, with no other edit required

### Requirement: The grid matches its recorded target at every supported breakpoint

At 1920, 1280 and 440, the rendered content width and side padding SHALL match
the values recorded for that breakpoint, within a recorded tolerance. The
recorded values SHALL cite their source — a design node, or a written decision
where the chosen value deliberately differs from the design.

#### Scenario: A breakpoint is checked

- **WHEN** the grid check runs at a supported breakpoint
- **THEN** the measured content width and side padding match that breakpoint's recorded target within tolerance

#### Scenario: The chosen value differs from the design

- **WHEN** the canonical width deliberately differs from the measured design value
- **THEN** the recorded target cites the decision rather than the design node, and states why

### Requirement: Full-width surfaces agree with the grid

Header, navigation, footer and any other full-bleed surface SHALL align their
inner content to the same grid as page content at every supported breakpoint. A
surface disagreeing with page content SHALL fail the check, because that
divergence is the defect this capability exists to prevent.

#### Scenario: Header and page content are compared

- **WHEN** the grid check inspects the header's inner content and the page's content column at the same breakpoint
- **THEN** their left and right edges align within tolerance

#### Scenario: A surface drifts

- **WHEN** a change moves one surface's horizontal geometry without moving the others
- **THEN** the check fails, naming the surface, the breakpoint, and the disagreement in pixels
