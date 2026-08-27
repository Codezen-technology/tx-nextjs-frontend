# auto-growing-textarea Specification

## Purpose

Defines the behaviour of the free-text fields in the site's forms, so that what a user has typed stays visible to them as they type it.

## Requirements

### Requirement: A free-text field shows what has been typed into it

A multi-line text field SHALL grow to fit its content as the user types, up to a bounded maximum, rather than holding a fixed height that hides earlier lines behind a scrollbar.

The field starts at its current height, so short answers look unchanged; the growth only applies once the content would otherwise overflow. A maximum is required so that a long answer cannot push the rest of the form off the screen.

#### Scenario: Content shorter than the initial height

- **WHEN** a user types a single line
- **THEN** the field's height is unchanged from its initial height

#### Scenario: Content longer than the initial height

- **WHEN** a user types more lines than the field's initial height shows
- **THEN** the field grows so the typed content remains visible

#### Scenario: Very long content

- **WHEN** the typed content would grow the field past its maximum
- **THEN** the field stops growing and scrolls instead
