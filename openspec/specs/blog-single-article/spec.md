# blog-single-article Specification

## Purpose

Defines what the single-post article column contains and how its body copy is typed, so
that a post's own content is the only thing in the reading column and its headings come
from a measured token rather than a default.

## Requirements

### Requirement: The featured image appears once on the page

A post's featured image SHALL render exactly once. It belongs to the hero; the article
column SHALL NOT repeat it. Images inside the post's own content are unaffected — those are
the author's, not the theme's.

#### Scenario: A post with a featured image

- **WHEN** a post carrying a featured image is rendered
- **THEN** exactly one element on the page uses that image's source, and it sits in the hero

#### Scenario: Content images survive

- **WHEN** the post body contains its own inline images
- **THEN** each still renders inside the article column

### Requirement: In-article headings use the measured heading token

Headings inside the article body SHALL render at the token the design binds for this
surface — **SUSE Bold, 20px, 1.2 line-height, `Neutral/N900`** (`Heading/Bold/H5` on
`6015:127141`). The token SHALL be applied to the blog article only; the shared prose
utility serves legal pages and course descriptions that were never measured against this
frame.

Body copy SHALL remain Open Sans 400 at 16px with a 1.5 line-height in `Neutral/N500`,
which both the frame and the QA report agree on.

#### Scenario: An article heading

- **WHEN** an `h2` inside the article body is rendered
- **THEN** its computed family is SUSE, size 20px, weight 700 and line-height 24px

#### Scenario: Body copy is unchanged

- **WHEN** a paragraph inside the article body is rendered
- **THEN** its computed size is 16px, weight 400 and line-height 24px

#### Scenario: Other prose surfaces keep their own type

- **WHEN** a legal page or a course description renders through the shared prose utility
- **THEN** its heading sizes are unchanged by this requirement

### Requirement: The rendered category names the post's own category

The category shown in the hero and in the breadcrumb SHALL be the name of the post's
primary category as the API returns it, with no substitution or fallback label.

#### Scenario: Category parity

- **WHEN** a post is rendered
- **THEN** the category name shown matches the name the API gives for that post's first
  category
