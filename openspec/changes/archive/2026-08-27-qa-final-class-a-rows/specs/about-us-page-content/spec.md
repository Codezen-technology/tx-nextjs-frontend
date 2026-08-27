## MODIFIED Requirements

### Requirement: About page section structure matches Figma

The rendered `/about` page SHALL present sections in this order: Trusted strip, Hero, three alternating commitment blocks, values grid, Team section — matching the Figma "About US" design (node `649:22654`). The previous implementation's closing stats section (learner counts, guarantee callouts) SHALL be removed, as it has no counterpart in the Figma design.

The page SHALL NOT render a visible breadcrumb bar. Unlike the single-course page, which keeps `BreadcrumbList` structured data after its bar was removed, this page publishes no breadcrumb structured data, so nothing is retained in its place.

#### Scenario: Page render order

- **WHEN** `/about` is rendered
- **THEN** the sections appear in the order Trusted, Hero, commitment blocks, values grid, Team — and no stats/"Our journey" section is present

#### Scenario: No breadcrumb bar

- **WHEN** `/about-us` is rendered
- **THEN** no breadcrumb navigation is present anywhere on the page
