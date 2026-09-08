## Purpose

Holds the site-wide rule that no page paints a visible breadcrumb trail, while breadcrumb
structured data stays published wherever a page already emits it for search engines.

## ADDED Requirements

### Requirement: No page renders a visible breadcrumb trail

No public page SHALL render a breadcrumb navigation trail — neither a standalone bar nor
an inline trail inside a hero — regardless of route group. This covers marketing, shop
and dashboard surfaces alike, and applies to loading skeletons as well as to loaded
pages, so no breadcrumb placeholder flashes before content arrives.

A breadcrumb trail is any ordered list of ancestor links terminating in the current page,
whether it is marked up as `nav[aria-label="Breadcrumb"]`, an `ol`/`ul` of ancestor
links, or plain inline text separated by `/`, `›` or a chevron icon.

#### Scenario: No breadcrumb bar on a loaded page

- **WHEN** any public page is rendered — home, pricing, blog single, blog category,
  all-courses, single course, course category, product single, cart, checkout, about-us
- **THEN** no element with a breadcrumb role or accessible breadcrumb label is present in
  the document
- **AND** no ordered trail of ancestor links ending in the current page's title is
  painted anywhere on the page

#### Scenario: No breadcrumb placeholder while loading

- **WHEN** a route's loading skeleton is shown before its data resolves
- **THEN** the skeleton contains no breadcrumb-shaped placeholder row

#### Scenario: Removing the trail leaves the layout's rhythm intact

- **WHEN** a page that previously opened with a breadcrumb bar is rendered
- **THEN** the first visible band keeps its own vertical rhythm, with no collapsed or
  doubled top spacing left behind by the removed trail

### Requirement: Breadcrumb structured data survives the visual removal

A page that publishes `BreadcrumbList` JSON-LD SHALL continue to publish it after the
visible trail is removed. Structured data is consumed by search engines rather than by
the layout, so removing the painted trail SHALL NOT remove, empty or truncate the schema.
Pages that never published breadcrumb structured data SHALL NOT gain any.

#### Scenario: Course page keeps its BreadcrumbList

- **WHEN** the single-course page is rendered
- **THEN** its JSON-LD blocks include a `BreadcrumbList` describing the course's
  ancestors and the course itself

#### Scenario: Course-category page keeps its BreadcrumbList

- **WHEN** a course-category page is rendered
- **THEN** its JSON-LD blocks include a `BreadcrumbList` for that category

#### Scenario: Breadcrumb source data is retained

- **WHEN** the course API returns a `breadcrumb` array for a course
- **THEN** the value is still normalised onto the course's domain data so the
  `BreadcrumbList` schema can be built from it, even though nothing renders it
