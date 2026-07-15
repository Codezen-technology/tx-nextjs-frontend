## ADDED Requirements

### Requirement: Category archive page renders for valid category slugs

`GET /blog/category/{slug}` SHALL render the hero band, the site-wide Trending Topics carousel, the category name (and description when available), and a grid of that category's posts, for any slug matching a real WordPress category.

#### Scenario: Visiting a real category

- **WHEN** a user requests `/blog/category/health-social-care` and that category exists with posts
- **THEN** the page renders the hero, Trending Topics carousel, the category name, and a grid of posts belonging to that category

### Requirement: Unknown category slugs 404

`GET /blog/category/{slug}` SHALL return a genuine 404 response for any slug that does not match an existing category, instead of an empty or broken page.

#### Scenario: Visiting a nonexistent category slug

- **WHEN** a user requests `/blog/category/does-not-exist`
- **THEN** the page returns a 404 response

### Requirement: Category posts are paginated

The category post grid SHALL support pagination via a `page` query parameter, showing prev/next controls and numbered page links, consistent with the site's existing `/course-cat/[slug]` pagination pattern.

#### Scenario: Category has more posts than one page

- **WHEN** a category has more posts than the page size
- **THEN** pagination controls appear, and navigating to `?page=2` shows the next batch of posts for that category

#### Scenario: Category has one page or fewer of posts

- **WHEN** a category's post count fits within a single page
- **THEN** no pagination controls render

### Requirement: Trending Topics on the category page is site-wide, not category-scoped

The Trending Topics carousel on `/blog/category/{slug}` SHALL show the same site-wide trending posts as `/blog`, not posts filtered to the current category.

#### Scenario: Category page trending matches the main blog page

- **WHEN** the site-wide trending posts are the same at the time both pages are requested
- **THEN** `/blog/category/{slug}`'s Trending Topics carousel shows the identical set of posts as `/blog`'s
