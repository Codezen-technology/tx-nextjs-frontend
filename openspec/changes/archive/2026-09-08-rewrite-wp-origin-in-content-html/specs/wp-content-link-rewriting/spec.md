## Purpose

Governs how absolute URLs embedded in WordPress-authored HTML body content behave once that content is rendered by the headless frontend, so that in-content navigation keeps the visitor on the frontend domain while media and functional backend endpoints keep resolving against WordPress.

## ADDED Requirements

### Requirement: In-content links point at the headless frontend

A hyperlink inside rendered WordPress-authored HTML content whose target is an absolute URL on the WordPress backend origin SHALL be rewritten to the equivalent frontend target, preserving the original path, query string and fragment. Relative targets, fragment-only targets and non-HTTP schemes (`mailto:`, `tel:`) SHALL render unchanged.

This applies to every surface that renders CMS-authored markup: blog article bodies, product short and long descriptions, course detail tabs, lesson/unit content, quiz option text, and form HTML fields.

#### Scenario: Backend permalink inside article body

- **WHEN** a blog article body contains a link whose target is an absolute permalink on the WordPress backend origin
- **THEN** the rendered link target is the same path, query and fragment on the frontend origin

#### Scenario: Relative and non-HTTP targets pass through

- **WHEN** rendered content contains a root-relative link, a fragment-only link, or a `mailto:` / `tel:` link
- **THEN** the rendered link target is byte-identical to the authored target

#### Scenario: Backend and frontend origins are identical

- **WHEN** the configured backend origin and frontend origin are the same value
- **THEN** every link target renders unchanged

#### Scenario: Origin configuration is missing or unparseable

- **WHEN** either origin is unset or is not a valid absolute URL
- **THEN** content renders with all link targets unchanged rather than failing to render

### Requirement: Functional backend URLs are preserved

A URL inside rendered content that addresses a WordPress capability the headless frontend does not serve SHALL keep the backend origin. This covers, at minimum: media sources (`img`, `source`, `video`, `audio`, `iframe`), links to uploaded files under the WordPress content path, WordPress REST or admin-ajax endpoints, WooCommerce transactional endpoints (add-to-cart, order-pay, order-received and any URL carrying a Woo order key), and WordPress admin or login URLs.

A bare cart or checkout permalink is NOT functional in this sense — the frontend serves its own `/cart` and `/checkout`, so those rewrite like any other content link.

Rewriting these produces a frontend URL that resolves to a 404, which is strictly worse than leaving the visitor on the backend.

#### Scenario: Image inside content keeps its backend source

- **WHEN** rendered content contains an image whose source is on the WordPress backend origin
- **THEN** the rendered source is unchanged and still points at the backend origin

#### Scenario: Uploaded file download keeps its backend target

- **WHEN** rendered content contains a link to a file under the WordPress uploads path
- **THEN** the rendered link target is unchanged and still points at the backend origin

#### Scenario: Transactional commerce endpoint keeps its backend target

- **WHEN** rendered content contains an add-to-cart, order-pay or order-received link on the backend origin
- **THEN** the rendered link target is unchanged and still points at the backend origin

#### Scenario: Bare cart permalink is rewritten

- **WHEN** rendered content contains a link to the backend cart or checkout page carrying no transactional query parameters
- **THEN** the rendered link target is the equivalent frontend path

### Requirement: Third-party in-content links open in a new tab

A hyperlink inside rendered content whose target is an absolute URL on neither the backend nor the frontend origin SHALL be left unchanged and SHALL open in a new browsing context with `rel` containing `noopener` and `noreferrer`.

#### Scenario: External link in article body

- **WHEN** a rendered article body contains a link to a third-party host
- **THEN** the link target is unchanged, opens in a new tab, and carries `rel="noopener noreferrer"`

#### Scenario: Author-supplied rel is not discarded

- **WHEN** an external in-content link already declares a `rel` value such as `nofollow` or `sponsored`
- **THEN** the rendered `rel` retains that value alongside `noopener` and `noreferrer`

### Requirement: All CMS-authored HTML renders through one path

Every surface that renders WordPress-authored HTML SHALL do so through the shared content renderer that applies the rules above. No surface may inject CMS-authored markup directly into the DOM, bypassing them.

A second rendering path is how this leak survived the earlier origin-rewriting work; a single path is what makes the rules enforceable by test rather than by review.

#### Scenario: A new CMS-authored HTML surface

- **WHEN** a component renders an HTML string that originated in WordPress
- **THEN** it renders through the shared content renderer and the link rules apply without per-component code
