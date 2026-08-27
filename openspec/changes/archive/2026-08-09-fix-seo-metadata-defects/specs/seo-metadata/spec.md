## Purpose

Defines how public page metadata is sourced from the WordPress Rank Math headless API, validated against the URL that was requested, merged with per-page fallbacks, and normalised into a single consistent canonical/OpenGraph/JSON-LD output.

## ADDED Requirements

### Requirement: Rank Math responses are validated against the requested path

The system SHALL treat a Rank Math `getHead` response as authoritative only when the canonical URL it returns resolves to the same path that was requested. When the returned canonical resolves to a different path, the system SHALL discard the entire payload and fall back to the page's own metadata.

Rank Math answers `success: true` with an unrelated `<head>` (the site homepage, or a generic 404 head) for any URL it cannot resolve. Without this check, a wrong path mapping produces confidently wrong metadata rather than a visible failure.

#### Scenario: Rank Math returns the homepage head for an unrecognised URL

- **WHEN** metadata is requested for a page whose WordPress path does not resolve, and Rank Math responds with the homepage `<head>` (canonical `https://backend/`)
- **THEN** the returned canonical does not match the requested path, the payload is discarded, and the page renders its own fallback title, description, and canonical

#### Scenario: Rank Math returns a matching head

- **WHEN** metadata is requested for `/course/{slug}` and Rank Math returns a canonical resolving to `/course/{slug}`
- **THEN** the Rank Math title, description, robots directive, OpenGraph fields, and JSON-LD are used in preference to the fallbacks

#### Scenario: Rank Math returns a head with no canonical

- **WHEN** Rank Math returns a `<head>` containing no `<link rel="canonical">` (for example a `noindex` page, where Rank Math omits it)
- **THEN** the remaining Rank Math fields are used and the page's own fallback canonical is emitted

#### Scenario: Rank Math is unreachable or disabled

- **WHEN** the Rank Math endpoint errors, times out, or returns `success: false`
- **THEN** the page renders its fallback metadata and the page render is not blocked or failed

### Requirement: A page's canonical URL matches the URL it is served at

Every public page SHALL emit a canonical URL that is the frontend origin plus the exact path the page is served at, with no trailing slash and no redirect hop. The canonical, the OpenGraph `url`, and the page's `sitemap.xml` entry SHALL be byte-identical.

WordPress permalinks carry a trailing slash; the frontend serves paths without one and redirects `/x/` to `/x`. A canonical pointing at a redirect disagrees with the sitemap and wastes crawl budget.

#### Scenario: Rank Math canonical carries a trailing slash

- **WHEN** Rank Math returns canonical `https://backend/course/health-and-safety-officer-training/`
- **THEN** the page emits canonical `https://frontend/course/health-and-safety-officer-training` — backend origin replaced, trailing slash removed

#### Scenario: Homepage canonical

- **WHEN** the homepage emits its canonical
- **THEN** it is the bare frontend origin, not a trailing-slash-stripped empty string

#### Scenario: Canonical, OpenGraph, and sitemap agree

- **WHEN** any indexable page is rendered and the sitemap is generated
- **THEN** the page's `<link rel="canonical">`, its `og:url`, and its `<loc>` in `sitemap.xml` are the same string

### Requirement: JSON-LD URLs use the frontend origin and canonical URL form

Structured data emitted on a page — whether sourced from Rank Math or built by the frontend — SHALL reference the frontend origin and the same no-trailing-slash URL form as the page's canonical, in every `@id`, `url`, and `mainEntityOfPage` value.

#### Scenario: Rank Math JSON-LD references the backend

- **WHEN** Rank Math returns JSON-LD whose `@id` values point at `https://backend/course/x/`
- **THEN** the emitted JSON-LD uses `https://frontend/course/x`

### Requirement: WordPress path mapping is correct for every route family

Each public route family SHALL request Rank Math metadata using the WordPress permalink that actually serves that content.

The verified mapping is: `/` → `/`; `/course/{slug}` → `/course/{slug}/`; `/course-cat/{slug}` → `/course-cat/{slug}/`; `/blog/{slug}` → `/blog/{slug}/`; `/blog/category/{slug}` → `/blog/category/{slug}/`; `/bundles/{slug}` → `/bundles/{slug}/`; `/product/{slug}` → `/product/{slug}/`; `/{page}` → `/{page}/`.

#### Scenario: Blog post metadata

- **WHEN** metadata is requested for `/blog/{slug}`
- **THEN** Rank Math is queried for the WordPress path `/blog/{slug}/`, and the page emits that post's own title, description, and canonical — not the homepage's

#### Scenario: Course category metadata

- **WHEN** metadata is requested for `/course-cat/{slug}`
- **THEN** Rank Math is queried for the WordPress path `/course-cat/{slug}/`, and the page emits that category's own title and description — not the generic site title

#### Scenario: Every category page has a distinct title

- **WHEN** all course category pages are rendered
- **THEN** no two share the same `<title>`, and each has a non-empty meta description

### Requirement: Absolute URLs resolve without environment-dependent gaps

The system SHALL derive its site origin and WordPress origin from the central environment module, so that metadata always emits absolute OpenGraph and Twitter image URLs.

An unset public site URL previously left the metadata base undefined, causing relative social image URLs that no crawler can resolve.

#### Scenario: Site URL environment variable is unset

- **WHEN** the public site URL variable is not set and a page with an OpenGraph image renders
- **THEN** the image URL is still absolute, resolved against the configured default origin

#### Scenario: Server-only WordPress origin override is configured

- **WHEN** a server-only WordPress API URL override is set
- **THEN** Rank Math metadata requests use that override, consistent with all other server-side WordPress calls
