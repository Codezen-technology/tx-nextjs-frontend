## ADDED Requirements

### Requirement: The CPD Certificate section stacks at mobile widths

The CPD Certificate & Transcript section SHALL lay its text column and its imagery out
vertically below the `lg` breakpoint, and horizontally at `lg` and above. At mobile
widths the section's heading and body text SHALL each span the page content column
rather than a fraction of it.

#### Scenario: Viewing the CPD Certificate section at 440

- **WHEN** the homepage is rendered at a 440px viewport
- **THEN** the section's heading and its body paragraph each measure the full content
  column width, within the tolerance recorded for that breakpoint

#### Scenario: Viewing the CPD Certificate section at 1920

- **WHEN** the homepage is rendered at a 1920px viewport
- **THEN** the text column and the imagery remain side by side, unchanged from the
  current desktop layout

### Requirement: The homepage never scrolls wider than the viewport

At every covered breakpoint the homepage's document scroll width SHALL equal the viewport
width. No section SHALL place content past the viewport's right edge, whether or not an
ancestor clips it.

#### Scenario: Horizontal overflow at mobile

- **WHEN** the homepage is rendered at a 440px viewport
- **THEN** `document.documentElement.scrollWidth` equals 440

### Requirement: The categories CTA sits below the grid at mobile widths

The "View all courses" call to action in the course-categories section SHALL render below
the category grid at mobile widths, and beside the section heading at `md` and above.

#### Scenario: Categories CTA at 440

- **WHEN** the homepage is rendered at a 440px viewport
- **THEN** the CTA's top edge is below the bottom edge of the category grid

#### Scenario: Categories CTA at 1920

- **WHEN** the homepage is rendered at a 1920px viewport
- **THEN** the CTA renders in the heading row, vertically aligned with the section
  heading, unchanged from the current desktop layout
