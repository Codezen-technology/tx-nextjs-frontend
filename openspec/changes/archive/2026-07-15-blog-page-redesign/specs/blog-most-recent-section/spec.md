## ADDED Requirements

### Requirement: Most Recent section always renders ahead of category sections

The `/blog` page SHALL render a "Most Recent" section — up to 4 of the latest posts, in the same card-grid layout used by category sections — positioned immediately after Trending Topics and before any per-category sections, regardless of whether category sections are available.

#### Scenario: Categories and posts both available

- **WHEN** the blog listing has both categorized posts and enough total posts
- **THEN** "Most Recent" renders first, followed by the per-category sections

#### Scenario: No category sections available

- **WHEN** no posts have a recognized category
- **THEN** "Most Recent" still renders using the latest posts, and no per-category sections render

### Requirement: Most Recent excludes posts already shown in the trending carousel

A post that appears in the Trending Topics carousel SHALL NOT also appear in the "Most Recent" section.

#### Scenario: Overlap between trending and latest posts

- **WHEN** a post is one of the 5 most recent posts (and thus in the trending carousel) and would otherwise also qualify for "Most Recent"
- **THEN** it is skipped in "Most Recent", which is backfilled from the next most recent non-trending posts
