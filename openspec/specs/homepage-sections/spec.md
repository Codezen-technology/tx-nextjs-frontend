# homepage-sections Specification

## Purpose

TBD - created by archiving change homepage-redesign. Update Purpose after archive.

## Requirements

### Requirement: Homepage section order matches the redesigned layout

The `/` route SHALL render, top to bottom: Topbar, Header, Hero (headline + search + course carousel), Trusted Organizations, Categories, Popular Courses, Reviews, Pricing, Why Choose Us, Transform Your Team, CPD Certificate & Transcript, Footer (including its CTA band). The homepage SHALL NOT render a blog section.

#### Scenario: Visiting the homepage

- **WHEN** a user requests `/`
- **THEN** the page renders the sections above in that order and does not render a `BlogSection`

### Requirement: Hero section includes a course search affordance

The hero section SHALL present a subject/qualification text input with a submit action, in addition to the existing headline, description, and accreditation logos.

#### Scenario: Submitting a hero search

- **WHEN** a user types a query into the hero search input and submits
- **THEN** the browser navigates to a course listing/search route (e.g. `/search` or `/all-courses`) with the query applied

### Requirement: Hero section displays a live course carousel

The hero section SHALL render a stacked, auto-navigable carousel of course cards sourced from the featured-courses data, positioned to the side of the headline.

#### Scenario: Hero carousel with featured courses available

- **WHEN** the homepage loads and featured courses are returned successfully
- **THEN** the hero carousel renders those courses using the existing course card presentation

#### Scenario: Hero carousel with no featured courses

- **WHEN** the homepage loads and no featured courses are available
- **THEN** the hero carousel region renders nothing rather than an empty/broken carousel shell

### Requirement: Trusted organizations section has content-managed header copy

The trusted-orgs endpoint response SHALL include a header object (containing at least a title, e.g. "Trusted by Over 1000+ UK organisations") alongside the list of organization logos, and the frontend SHALL render that header above the logo row.

#### Scenario: Trusted orgs section renders header and logos

- **WHEN** the homepage requests home data and the trusted-orgs section returns a header and a non-empty org list
- **THEN** the section renders the header title followed by the organization logos

### Requirement: Popular Courses section reuses the shared course card with promotional data

The Popular Courses section SHALL render courses using the course card component enriched with badges, CPD points, and sale-countdown data (see `course-card-promotions`).

#### Scenario: Popular Courses displays enriched cards

- **WHEN** the Popular Courses section fetches its course list
- **THEN** each card shows any active badges, price (with strikethrough original price when on sale), and a countdown when a sale end date is present

### Requirement: Reviews section includes a Trustpilot summary alongside testimonials

The reviews section SHALL render a Trustpilot summary card (rating, review count, "Excellent"-style label, link to full reviews) in addition to the existing testimonial cards.

#### Scenario: Reviews section with testimonials available

- **WHEN** the homepage loads and testimonials are returned
- **THEN** the reviews section renders the Trustpilot summary card followed by the testimonial cards and a "View all reviews" link

### Requirement: Pricing section badge ribbons match the redesign

The pricing plans SHALL display "Most Popular" on the Premium Access plan and "Best Value" on the Business Training plan (reversed from the prior fallback mapping).

#### Scenario: Pricing cards render with corrected badges

- **WHEN** the pricing section renders its three plans from the default/fallback data
- **THEN** Premium Access shows a "Most Popular" badge and Business Training shows a "Best Value" badge

### Requirement: Why Choose Us section is a 4-item icon grid

The Why Choose Us section SHALL render exactly the icon+title+description items returned by its data source, in a grid layout — not the prior alternating title/bullets/gif/CTA panel format.

#### Scenario: Why Choose Us renders default content

- **WHEN** the homepage loads and no CMS override is configured
- **THEN** the section renders four feature items — Flexible Online Learning, Recognised & Accredited Courses, Industry-Standard and Expert-Curated Courses, Instant Digital Certificate — each with an icon, title, and description

### Requirement: Transform Your Team section presents the B2B/team training teaser

The homepage SHALL render a "Transform Your Team" section with a heading, subtext, an ordered list of icon-labeled benefit bullets, supporting imagery, and a call-to-action.

#### Scenario: Transform Your Team section renders default content

- **WHEN** the homepage loads and no CMS override is configured for the team section
- **THEN** the section renders the heading "Transform Your Team with Us", its benefit bullets, and a "Request a Quote" call-to-action with a working destination

### Requirement: CPD Certificate & Transcript section presents the certificate teaser

The homepage SHALL render a "CPD Accredited Certificate & Transcript" section with a heading, description, supporting imagery, and an "Order Certificate" call-to-action.

#### Scenario: CPD Certificate section renders default content

- **WHEN** the homepage loads and no CMS override is configured for the certificate section
- **THEN** the section renders the heading, description, and an "Order Certificate" call-to-action with a working destination

### Requirement: Homepage composite endpoint includes all sections

`GET /lms-backend/v1/home` SHALL return every section needed to render the redesigned homepage in a single response, including the new `trusted_orgs` header, `why` (icon-grid shape), `team`, and `certificate` sections, following the existing ACF → WP option → hardcoded-fallback resolution order used by all other sections.

#### Scenario: Fetching the composite home payload

- **WHEN** a client requests `GET /lms-backend/v1/home`
- **THEN** the response includes `topbar`, `hero_headline`, `trusted_orgs` (with `header`), `pricing`, `popular_courses_header`, `why` (icon-grid items), `team`, `certificate`, and `testimonials`
