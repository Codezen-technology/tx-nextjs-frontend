# seo-indexing-controls Specification

## Purpose

Defines which of the site's URLs are declared indexable and how — sitemap membership and freshness, robots.txt rules, per-route noindex directives, pagination canonicals, and the requirement that navigation only links to pages a crawler can actually reach.

## Requirements

### Requirement: The sitemap lists every indexable public route

`sitemap.xml` SHALL contain an entry for every public route family the site serves and intends to have indexed, and SHALL NOT contain protected, noindexed, or non-existent routes.

Coverage MUST include the static marketing pages, `/course/{slug}`, `/course-cat/{slug}`, `/blog/{slug}`, `/blog/category/{slug}`, `/bundles` and `/bundles/{slug}`, `/product/{slug}`, `/pricing`, `/certificate`, and the WordPress-backed pages served by the catch-all route.

#### Scenario: A public route family exists but is absent from the sitemap

- **WHEN** the sitemap is generated and the site serves an indexable route family
- **THEN** that family's URLs appear in the sitemap

#### Scenario: Protected and noindexed routes

- **WHEN** the sitemap is generated
- **THEN** it contains no dashboard, learn, profile, order, cart, checkout, auth, or search URLs

#### Scenario: A backing data source fails

- **WHEN** one of the sitemap's data sources errors during generation
- **THEN** the sitemap still returns successfully with the entries it could resolve, rather than failing the whole document

### Requirement: Sitemap entries report real modification times

Each sitemap entry's `lastmod` SHALL reflect the underlying content's actual last-modified timestamp when one is available, and SHALL NOT report the time of the sitemap request.

Reporting every URL as modified "now" on every fetch makes the signal worthless and is discounted by search engines.

#### Scenario: Entity exposes a modification timestamp

- **WHEN** a course, post, or page is listed and the source data carries a modification date
- **THEN** the entry's `lastmod` is that date

#### Scenario: Entity exposes no modification timestamp

- **WHEN** a listed route has no underlying modification date (for example a static marketing route)
- **THEN** a stable date is used rather than a per-request timestamp

### Requirement: Non-public routes are excluded from crawling and indexing

Routes that are protected, transactional, or internal SHALL be disallowed in `robots.txt` AND SHALL emit a `noindex, nofollow` robots directive in their own metadata.

`robots.txt` prevents crawling but not indexing — a disallowed URL with inbound links can still appear in results with no snippet. Both signals are required.

The affected routes are: the auth pages (login, register, forgot-password, reset-password), cart, checkout and checkout payment, order confirmation, the student dashboard, the learn player, the business dashboard, and search.

#### Scenario: A crawler requests a transactional page

- **WHEN** `/cart`, `/checkout`, or `/order-confirmation/{id}` is rendered
- **THEN** the page emits a `noindex, nofollow` robots directive, and the path is listed under `Disallow` in `robots.txt`

#### Scenario: An auth page is linked externally

- **WHEN** `/login` is rendered
- **THEN** it emits a `noindex, nofollow` robots directive in addition to being disallowed in `robots.txt`

#### Scenario: Internal-only pages in production

- **WHEN** the application runs in production
- **THEN** the internal design-system page is either not served or is noindexed and disallowed

### Requirement: Paginated listings self-canonicalise

A paginated listing page SHALL emit a canonical URL that includes its own page parameter. Pages beyond the first SHALL NOT canonicalise to the first page.

Canonicalising page 2+ to page 1 declares the deeper pages duplicates and suppresses the items only reachable there.

#### Scenario: Second page of a course category

- **WHEN** `/course-cat/{slug}?page=2` is rendered
- **THEN** its canonical is `https://frontend/course-cat/{slug}?page=2`

#### Scenario: First page of a course category

- **WHEN** `/course-cat/{slug}` is rendered with no page parameter, or with `page=1`
- **THEN** its canonical is `https://frontend/course-cat/{slug}` with no page parameter

### Requirement: Site navigation links only to crawlable destinations

Header, footer, and site-wide navigation SHALL link only to URLs that return 200 for an anonymous request. Navigation SHALL NOT link to routes that 404 or that redirect an unauthenticated visitor to the login page.

#### Scenario: Navigation points at a protected route

- **WHEN** an anonymous crawler follows a site-wide navigation link
- **THEN** it receives the destination page, not a redirect to `/login`

#### Scenario: Navigation points at a nonexistent page

- **WHEN** site-wide navigation is rendered
- **THEN** every link target resolves to a route the application serves

### Requirement: Every indexable page has exactly one H1

Each public indexable page SHALL render exactly one `<h1>` element describing that page's subject.

#### Scenario: Course catalogue landing page

- **WHEN** `/all-courses` is rendered
- **THEN** it contains exactly one `<h1>` describing the course catalogue

#### Scenario: Any other indexable page

- **WHEN** any indexable public page is rendered
- **THEN** it contains exactly one `<h1>`

### Requirement: Dynamic public routes are pre-rendered at build time

Every dynamic public route family that is listed in the sitemap SHALL declare its known slugs for build-time pre-rendering, with on-demand rendering as the fallback for new entries.

#### Scenario: Product detail pages

- **WHEN** the application is built
- **THEN** known product slugs are pre-rendered, and a slug published after the build still resolves on demand

#### Scenario: Slug source is unavailable at build time

- **WHEN** the data source for a route family's slugs errors during the build
- **THEN** the build succeeds and those pages resolve on demand

### Requirement: The sitemap enumerates every entry of a paginated source

Where a sitemap source is paginated, the sitemap SHALL enumerate every page of that source. Requesting a single oversized page and emitting whatever comes back SHALL NOT be treated as full coverage.

Backends cap the size of one page. A source holding 238 courses answers a 500-item request with 100 items and no error; the missing 138 URLs are indistinguishable from a site that only has 100 courses.

#### Scenario: A source holds more entries than one page returns

- **WHEN** the sitemap is generated and a source holds 238 entries with a maximum page size of 100
- **THEN** all 238 URLs appear in the sitemap

#### Scenario: A request exceeds the source's page-size limit

- **WHEN** a sitemap source is queried
- **THEN** the request stays within the limit the API documents, rather than relying on the backend to clamp it

#### Scenario: A later page fails mid-enumeration

- **WHEN** the first page of a source resolves and a subsequent page errors
- **THEN** the sitemap still returns with the entries already resolved, and the shortfall is recorded in server logs

### Requirement: A sitemap source that yields nothing is reported

Where a sitemap source resolves to zero entries, the application SHALL record the fact in server logs. An empty result SHALL NOT be indistinguishable from a source that genuinely has no content.

Error tolerance in the sitemap is deliberate — a failing upstream must shrink the document, not fail it — but silence turns a whole missing route family into a document that looks healthy.

#### Scenario: An upstream rejects the sitemap's request

- **WHEN** a source returns an error status and the sitemap falls back to an empty list for that family
- **THEN** the sitemap document still renders, and the empty family is recorded in server logs

#### Scenario: A route family is genuinely empty

- **WHEN** a source resolves successfully with no entries
- **THEN** the sitemap renders without those URLs and the empty family is recorded

### Requirement: Sitemap membership follows what the application serves

A URL SHALL appear in the sitemap only if the application serves it as an indexable page for an anonymous request — HTTP 200, with a robots directive permitting indexing. Membership SHALL be derived from what is served, not from a hand-maintained list of exclusions.

A denylist of WordPress slugs falls behind the CMS silently: pages added on WordPress are advertised by default, and the failure is only visible by reading the generated document.

#### Scenario: A WordPress page has no frontend route

- **WHEN** WordPress exposes a page such as `activate`, `activity` or `members-directory` that the application does not serve as indexable content
- **THEN** its URL does not appear in the sitemap

#### Scenario: A WordPress page duplicates a route the app already serves

- **WHEN** WordPress exposes a page whose content is served under a different frontend URL, such as `home` duplicating the site root
- **THEN** only the frontend's own URL appears in the sitemap

#### Scenario: A route emits a noindex directive

- **WHEN** a route such as `/register` or `/business-dashboard` renders with a `noindex` directive, or redirects an anonymous request
- **THEN** its URL does not appear in the sitemap

#### Scenario: A new WordPress page with a frontend route

- **WHEN** a page is published on WordPress that the catch-all route serves as indexable content
- **THEN** its URL appears in the sitemap without a code change

### Requirement: A catch-all page with no renderable content returns 404

Where the catch-all route is requested for a slug WordPress cannot supply renderable content for, the response SHALL be HTTP 404. It SHALL NOT return HTTP 200 with not-found content, and SHALL NOT emit an indexable robots directive.

A soft 404 spends crawl budget, can be indexed as a real page, and hides a broken route behind a healthy status code.

#### Scenario: WordPress has the page but no renderable content

- **WHEN** `/shop` is requested and WordPress returns a page with no content the app can render
- **THEN** the response status is 404

#### Scenario: WordPress has no such page

- **WHEN** the catch-all route is requested for a slug WordPress does not expose
- **THEN** the response status is 404
