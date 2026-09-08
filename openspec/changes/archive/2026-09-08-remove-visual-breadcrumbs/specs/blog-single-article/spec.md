## MODIFIED Requirements

### Requirement: The rendered category names the post's own category

The category shown in the hero SHALL be the name of the post's primary category as the
API returns it, with no substitution or fallback label. The post's breadcrumb trail is no
longer rendered, so the hero is the only surface this requirement governs.

#### Scenario: Category parity

- **WHEN** a post is rendered
- **THEN** the category name shown matches the name the API gives for that post's first
  category
