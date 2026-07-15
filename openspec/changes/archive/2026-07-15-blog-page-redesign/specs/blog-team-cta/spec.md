## ADDED Requirements

### Requirement: Blog page shows a team-training CTA band above the footer

The `/blog` page SHALL render a dark-navy CTA band — heading "Want to Train Your Team?", subtext "Invest in your people. Get a bespoke training plan today.", and a single "Request A Quote" call-to-action — positioned after the last content section and before the site footer.

#### Scenario: Blog page renders with posts

- **WHEN** `/blog` renders with any amount of post content above it
- **THEN** the team-training CTA band renders directly above the footer with a working "Request A Quote" link

### Requirement: CTA band renders regardless of post availability

The team-training CTA band SHALL render even when the blog has no posts (i.e. it does not depend on post/category data).

#### Scenario: No posts exist

- **WHEN** the blog listing returns zero posts
- **THEN** the page still renders the team-training CTA band above the footer
