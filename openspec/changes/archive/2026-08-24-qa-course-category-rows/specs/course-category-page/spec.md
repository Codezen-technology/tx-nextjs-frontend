## Purpose

Defines the presentation contract for the `/course-cat/[slug]` page — the hero band's fill, the vertical rhythm between its content sections, and how the CMS-supplied category name is used in headings and metadata.

## ADDED Requirements

### Requirement: The hero band carries the design's gradient

The category hero SHALL be filled with the measured design gradient — a left-to-right ramp from the deep navy to the teal recorded for the hero band — and SHALL carry the decorative pattern along its lower edge.

The gradient is shared with the other marketing heroes, so it is defined once and reused rather than restated per page.

#### Scenario: Hero fill matches the measured design

- **WHEN** `/course-cat/[slug]` is rendered at 1920
- **THEN** the hero band's computed background is the shared hero gradient, with the same start and end colours the design frame specifies

#### Scenario: The lower-edge pattern is present

- **WHEN** the category hero is rendered
- **THEN** the decorative pattern sits along the bottom of the band, as the frame shows

### Requirement: Sections sit on the mobile rhythm at 440

At 440 the vertical gap between two adjacent content sections SHALL be 40px. Each section owns half the boundary through the shared section-spacing token, so any two adjacent sections compose to the full gap without either knowing about the other.

The hero is not a rhythm participant: a hero band is sized by its own content and carries its own inset.

#### Scenario: Boundary between two content sections at 440

- **WHEN** `/course-cat/[slug]` is rendered at 440
- **THEN** the gap between the courses section and the FAQ section measures 40px
- **AND** the gap between the FAQ section and the "Why Choose Us" section measures 40px

#### Scenario: Desktop rhythm is unchanged

- **WHEN** the same page is rendered at 1280 or wider
- **THEN** each section keeps the vertical padding it had before, so the mobile fix does not move desktop

### Requirement: The category name is not doubled by page copy

Page copy that combines the CMS-supplied category name with the word "Courses" SHALL contain that word exactly once, whatever the CMS names the category. This applies to visible headings, the document title and structured data alike — a name that already ends in "Courses" must not produce "Education Courses Courses".

#### Scenario: Section heading for a suffixed category

- **WHEN** the page renders for a category named `Education Courses`
- **THEN** the courses section heading reads `Education Courses`, with the word appearing once

#### Scenario: Metadata and structured data

- **WHEN** the page's title and structured-data name are generated for the same category
- **THEN** neither repeats the word

#### Scenario: Category with no course suffix

- **WHEN** the page renders for a category named `Groupon`
- **THEN** the heading reads `Groupon Courses` — the word is added, because the name does not already carry it
