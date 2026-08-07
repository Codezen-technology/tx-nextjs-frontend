## Purpose

Defines how a public page's metadata is sourced from WordPress Rank Math, validated, and rendered — titles, descriptions, canonical URLs, robots directives, social tags, and JSON-LD — so that what the app serves matches the URL it serves it at.

## ADDED Requirements

### Requirement: An upstream metadata value the framework cannot represent degrades, it does not discard the page's metadata

Where WordPress supplies a metadata value the rendering framework does not accept, the page SHALL fall back to a supported value for that single field and render all remaining metadata unchanged. Rejecting the value SHALL NOT cause the page's `<head>` metadata to be omitted.

A page that renders with no title, no description, no canonical and no robots directive is worse than a page carrying one imprecise Open Graph type. Type assertions that assert an upstream string is a supported value SHALL NOT be used to satisfy the type checker, because they move the failure from build time to request time.

#### Scenario: WooCommerce product supplies an unsupported Open Graph type

- **WHEN** `/product/{slug}` is rendered and Rank Math returns `og:type=product`, which the framework does not accept
- **THEN** the page renders its title, description, canonical, robots directive, Open Graph and Twitter tags, with the Open Graph type falling back to a supported value

#### Scenario: A supported Open Graph type is supplied

- **WHEN** Rank Math returns an Open Graph type the framework accepts, such as `article` for a blog post
- **THEN** that value is used verbatim

#### Scenario: Any other unrecognised upstream value

- **WHEN** Rank Math returns a value outside the set the framework accepts for a metadata field
- **THEN** the page still emits complete metadata, and the substitution is recorded in server logs rather than passing silently

### Requirement: A resolved page title carries the site brand exactly once

The title a crawler receives SHALL contain the site name at most once. Where the upstream title already ends in the site name, the application SHALL NOT append it again.

#### Scenario: Rank Math supplies an already-branded title

- **WHEN** a page's upstream title is `Animal Care Courses - Training Excellence`
- **THEN** the rendered `<title>` is `Animal Care Courses - Training Excellence`, not `Animal Care Courses - Training Excellence | Training Excellence`

#### Scenario: A page falls back to an application-supplied title

- **WHEN** upstream metadata is unavailable and the page uses its own fallback title
- **THEN** the rendered `<title>` still contains the site name exactly once

#### Scenario: A page whose subject is the site itself

- **WHEN** the homepage or a WordPress page titled with the site name is rendered
- **THEN** the site name appears once in the title, not repeated
