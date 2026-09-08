## MODIFIED Requirements

### Requirement: About page section structure matches Figma

The rendered `/about` page SHALL present sections in this order: Trusted strip, Hero, three alternating commitment blocks, values grid, Team section — matching the Figma "About US" design (node `649:22654`). The previous implementation's closing stats section (learner counts, guarantee callouts) SHALL be removed, as it has no counterpart in the Figma design.

The page renders no breadcrumb bar and publishes no breadcrumb structured data. That rule is normative in `site-breadcrumb-suppression`, which states it for every page; the scenario below is retained as this page's own check, not as a second statement of the rule.

#### Scenario: Page render order

- **WHEN** `/about` is rendered
- **THEN** the sections appear in the order Trusted, Hero, commitment blocks, values grid, Team — and no stats/"Our journey" section is present

#### Scenario: No breadcrumb bar

- **WHEN** `/about-us` is rendered
- **THEN** no breadcrumb navigation is present anywhere on the page
