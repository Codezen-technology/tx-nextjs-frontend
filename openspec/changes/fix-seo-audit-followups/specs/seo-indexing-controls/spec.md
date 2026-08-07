## Purpose

Defines which of the site's URLs are declared indexable and how — sitemap membership and freshness, robots.txt rules, per-route noindex directives, pagination canonicals, and the requirement that navigation only links to pages a crawler can actually reach.

## ADDED Requirements

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
