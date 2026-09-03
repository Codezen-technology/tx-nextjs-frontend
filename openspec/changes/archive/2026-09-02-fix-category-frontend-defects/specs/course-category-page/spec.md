## ADDED Requirements

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
