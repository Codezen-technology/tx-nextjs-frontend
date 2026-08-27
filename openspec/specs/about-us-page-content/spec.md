# about-us-page-content Specification

## Purpose

TBD - created by change about-us-page. Update Purpose after archive.

## Requirements

### Requirement: About-us page is auto-created

The system SHALL ensure a published WordPress Page with slug `about-us` exists, creating it automatically on plugin load if a page with that slug is not already present. An existing page at that slug SHALL NOT be overwritten or have its existing content modified.

#### Scenario: Fresh install

- **WHEN** the plugin loads on a site with no `about-us` page
- **THEN** a published Page titled "About Us" with slug `about-us` is created

#### Scenario: Page already exists

- **WHEN** the plugin loads on a site that already has a page at slug `about-us`
- **THEN** no new page is created and the existing page's title/content are left untouched

### Requirement: About page content is ACF-editable with Figma defaults

The system SHALL bind an ACF field group to the `about-us` page covering: hero (eyebrow, heading, subheading, two CTA buttons), three commitment blocks (each with an icon, heading, supporting text, an ordered list of check items, and an image), a values section (eyebrow, heading, six value cards each with icon/title/description), and a team section (eyebrow, heading, supporting text, two CTA buttons, five team photos). Every text-bearing field SHALL have its ACF `default_value` set to the exact copy shown in the Figma "About US" design (node `649:22654`), so the page renders the full designed content on a fresh install with no admin action required.

#### Scenario: Fresh install renders full Figma copy

- **WHEN** `GET /lms-backend/v1/about/page` is called on a site where the About page's ACF fields have never been edited
- **THEN** the response contains the hero heading "Empowering Careers, Ensuring Compliance.", all three commitment block headings ("What We Offer?", "Why Train with Us?", "Train Your Workforce with Confidence") with their full check-item lists, all six value card titles ("Commitment to Learning", "Innovation", "Excellence", "Flexibility", "Learner-Centric", "Impact-Driven"), and the team section heading "We're just getting started" — none null or empty

#### Scenario: Admin edits content

- **WHEN** an admin edits the hero heading in wp-admin and saves
- **THEN** subsequent `GET /lms-backend/v1/about/page` responses return the admin's edited heading instead of the Figma default

### Requirement: About page endpoint response shape

`GET /lms-backend/v1/about/page` SHALL return `{ success: true, data: { hero, commitment_blocks, values, team } }` where `commitment_blocks` is an array of exactly the saved/default blocks (each with `icon`, `heading`, `text`, `check_items: string[]`, `image: string | null`) and `values` is an array of value cards (`icon`, `title`, `description`).

#### Scenario: Endpoint call

- **WHEN** a client calls `GET /lms-backend/v1/about/page`
- **THEN** the response's `data` object matches the documented shape, with `commitment_blocks` and `values.cards` (or equivalent) present as arrays

### Requirement: Photographic image fields default to empty

The three commitment-block images and five team-section photos SHALL be ACF fields with no default value — they SHALL be null/empty in the API response until an admin uploads one. The frontend SHALL render a neutral placeholder in place of any unset image, matching the page's existing placeholder pattern, rather than a broken image or omitted layout.

An image field that is set but whose URL cannot be displayed SHALL be treated the same way as an unset one: the frontend SHALL render the placeholder rather than a broken graphic, an empty framed container, or a collapsed element, and the surrounding layout SHALL keep its designed dimensions. This covers a stored path that returns 404, an unreachable host, and a response that is not a decodable image.

#### Scenario: Fresh install has no images

- **WHEN** `GET /lms-backend/v1/about/page` is called on a fresh install
- **THEN** every commitment block's `image` and every team photo slot is `null`, and the frontend renders its placeholder graphic in each of those slots

#### Scenario: Admin uploads a commitment-block image

- **WHEN** an admin uploads an image to the first commitment block ("What We Offer?") and saves
- **THEN** subsequent responses return a non-null `image` URL for that block, and the frontend renders the real image instead of the placeholder

#### Scenario: A stored image URL cannot be loaded

- **WHEN** an image field holds a URL that returns an error status or is not a decodable image
- **THEN** the frontend renders the placeholder in that slot, the block keeps its designed dimensions, and no broken-image indicator is shown

#### Scenario: About Us page is checked at the reported breakpoints

- **WHEN** the end-to-end suite loads `/about-us` at 1920, 1280 and 440
- **THEN** every image on the page has decoded and has a non-zero bounding box, or has been replaced by the placeholder

### Requirement: Trusted strip reuses the existing shared Topbar

The About page's "Trusted" strip section SHALL render using the existing `Topbar` component and its existing `GET /lms-backend/v1/home/topbar` data source — the same content already shown on the homepage and `/pricing`. This capability SHALL NOT introduce a separate, About-page-specific trusted-strip data source.

#### Scenario: Trusted strip matches other pages

- **WHEN** the shared topbar content is edited via the homepage ACF fields
- **THEN** the About page's trusted strip reflects the same updated content on next load, identical to the homepage and pricing page

### Requirement: About page section structure matches Figma

The rendered `/about` page SHALL present sections in this order: Trusted strip, Hero, three alternating commitment blocks, values grid, Team section — matching the Figma "About US" design (node `649:22654`). The previous implementation's closing stats section (learner counts, guarantee callouts) SHALL be removed, as it has no counterpart in the Figma design.

The page SHALL NOT render a visible breadcrumb bar. Unlike the single-course page, which keeps `BreadcrumbList` structured data after its bar was removed, this page publishes no breadcrumb structured data, so nothing is retained in its place.

#### Scenario: Page render order

- **WHEN** `/about` is rendered
- **THEN** the sections appear in the order Trusted, Hero, commitment blocks, values grid, Team — and no stats/"Our journey" section is present

#### Scenario: No breadcrumb bar

- **WHEN** `/about-us` is rendered
- **THEN** no breadcrumb navigation is present anywhere on the page
