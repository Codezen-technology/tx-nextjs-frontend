# course-category-page Specification

## Purpose

Defines the presentation contract for the `/course-cat/[slug]` page — the hero band's fill, the vertical rhythm between its content sections, and how the CMS-supplied category name is used in headings and metadata.

## Requirements

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

### Requirement: The "Why Choose Us" image is presented at every width

The image that accompanies the "Why Choose Us" section SHALL be presented at every
viewport width the site supports, not only above the desktop breakpoint. Presence is
governed by whether the CMS supplies an image, never by viewport width.

When the CMS supplies no image, the section SHALL fall back to the same neutral
treatment at every width, so a category with no artwork looks deliberate rather than
broken.

Below the desktop breakpoint the image sits beneath the list of reasons and spans the
content column; from the desktop breakpoint it sits beside the list, as the design
frame shows.

#### Scenario: Mobile presentation

- **WHEN** `/course-cat/[slug]` is rendered at 440 for a category whose image is set
- **THEN** the "Why Choose Us" image is rendered and occupies a box of non-zero width
  and height beneath the list of reasons

#### Scenario: Desktop presentation is unchanged

- **WHEN** the same page is rendered at 1280 or wider
- **THEN** the image sits beside the list of reasons, at the size it had before

#### Scenario: Category with no image

- **WHEN** the page is rendered for a category whose image is unset, at any width
- **THEN** the section presents its fallback treatment in the image's place, and no
  broken or zero-sized image element is rendered

### Requirement: The page carries the trusted-organisations band

The category page SHALL present the trusted-organisations band — the headed,
horizontally scrolling row of partner logos — between the "Why Choose Us" section and
the site's team CTA, in the position both design frames give it.

The band SHALL read the same organisation list every other surface that presents it
reads, so no page can claim a different set of partners.

When that list is empty or cannot be retrieved, the band SHALL be omitted entirely
rather than rendered empty.

#### Scenario: Band position

- **WHEN** `/course-cat/[slug]` is rendered at any width and the organisation list is
  non-empty
- **THEN** the trusted-organisations band appears after the "Why Choose Us" section
  and before the team CTA

#### Scenario: The band agrees with the other surfaces that present it

- **WHEN** the category page and the homepage are both rendered
- **THEN** both show the same organisations, from the same source

#### Scenario: List unavailable

- **WHEN** the organisation list is empty, or the request for it fails
- **THEN** no band is rendered, and the rest of the page renders unaffected
