## ADDED Requirements

### Requirement: Trending Topics renders multiple posts as a carousel

The "Trending Topics" section on `/blog` SHALL render up to 5 of the most recent posts as a carousel — one post visible at a time — with previous/next arrow controls and dot indicators matching the post count.

#### Scenario: Multiple trending posts available

- **WHEN** the blog listing has 5 or more posts
- **THEN** the Trending Topics section renders a carousel with 5 dot indicators and the first post active

#### Scenario: Fewer posts than the carousel size

- **WHEN** the blog listing has fewer than 5 posts (but at least 1)
- **THEN** the carousel shows exactly as many dots as there are posts, with navigation still functional

#### Scenario: No posts available

- **WHEN** the blog listing has no posts
- **THEN** the Trending Topics section does not render

### Requirement: Carousel navigation cycles through trending posts

Clicking the next/previous arrows or a dot indicator SHALL change the visible post accordingly, wrapping from the last post back to the first (and vice versa).

#### Scenario: Advancing past the last post

- **WHEN** the last post is active and the user clicks "next"
- **THEN** the carousel displays the first post

#### Scenario: Selecting a dot directly

- **WHEN** the user clicks a specific dot indicator
- **THEN** the carousel displays the corresponding post immediately
