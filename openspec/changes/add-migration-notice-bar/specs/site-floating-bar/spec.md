## Purpose

Covers how this frontend renders the sitewide floating bar the backend serves on `GET /settings` — which surfaces it appears on, how it degrades when the payload is missing or unusable, how a dismissal behaves across content edits, and the layout and accessibility contract it holds while it is up.

## ADDED Requirements

### Requirement: The bar's content and visibility come from the backend

The bar SHALL render only what `floating_bar` on the site settings endpoint provides, and SHALL treat that value's absence as "no bar". No copy, no on/off switch, and no link SHALL live in frontend source, because a notice that could only be changed by shipping a release would outlive whatever it announces.

The backend decides whether a bar exists at all — unconfigured, switched off, and an empty message all arrive as `null` — so the frontend SHALL NOT interpret any separate enabled flag.

#### Scenario: A bar is configured

- **WHEN** settings carry a `floating_bar` object with a non-empty message
- **THEN** the bar renders that message on every surface the bar applies to

#### Scenario: Site has no bar

- **WHEN** `floating_bar` is `null`
- **THEN** nothing renders — no bar, no empty container, and no vertical space reserved

#### Scenario: Backend predates the field

- **WHEN** the settings response contains no `floating_bar` key at all
- **THEN** nothing renders and the page is otherwise unaffected, so a frontend release may land before the backend one without breaking any page

#### Scenario: Settings endpoint is unreachable

- **WHEN** the settings request fails and the frontend falls back to its env-var defaults
- **THEN** nothing renders — a bar is never fabricated from a fallback

### Requirement: An unusable payload renders nothing rather than an empty bar

A bar whose message is empty after normalisation SHALL be treated as absent. A strip that announces nothing still takes space above the fold on every public page and reads to a visitor as breakage, which is the impression the bar exists to prevent. This guard SHALL hold even though the backend already promises a non-empty message, so that a stale backend build or a server-side override cannot put an empty strip on every page.

#### Scenario: Message is empty

- **WHEN** a bar arrives with an empty or whitespace-only message
- **THEN** nothing renders

#### Scenario: Message carries HTML entities

- **WHEN** the message arrives containing encoded entities such as `&amp;` or `&#8212;`
- **THEN** the rendered text shows the decoded characters, not the entity source

#### Scenario: Message contains markup

- **WHEN** the message contains something that looks like an HTML tag
- **THEN** it renders as literal visible text and no element is created from it

### Requirement: The call to action is all-or-nothing

A call to action SHALL render only when both a label and a destination survive normalisation. Either half alone is unusable — a destination with no label renders no accessible name, a label with no destination renders dead text — and dropping it SHALL NOT suppress the bar, because losing a link is not a reason to withhold the notice.

#### Scenario: Both halves present

- **WHEN** the bar supplies a CTA label and href
- **THEN** the bar renders the message followed by that CTA as a link

#### Scenario: Only one half present

- **WHEN** the bar supplies a CTA href without a label, or a label without an href
- **THEN** the message still renders and no link is rendered

#### Scenario: Destination is on the WordPress origin

- **WHEN** the CTA href is an absolute URL on the WordPress backend origin
- **THEN** the rendered link targets the equivalent path on this frontend, so the bar never bounces a visitor back to the site being replaced

#### Scenario: Destination is a site-relative path

- **WHEN** the CTA href is a site-relative path such as `/courses`
- **THEN** the link routes internally without a full document load

#### Scenario: Destination uses an unsafe scheme

- **WHEN** the CTA href uses a scheme other than `http` or `https` — `javascript:`,
  `data:`, `vbscript:` — or is protocol-relative
- **THEN** no link renders and the message still shows, so content that someone
  with write access to the settings source controls can never become an executable
  destination on a visitor-facing page

#### Scenario: Destination is genuinely third-party

- **WHEN** the CTA href points at neither this frontend nor the WordPress origin
- **THEN** the link opens in a new tab and carries a `rel` that prevents the opened page from reaching back through `window.opener`

### Requirement: Dismissal follows the backend's dismissible flag and content key

The bar SHALL offer a dismiss control only when the backend marks it dismissible AND supplies a key to remember the dismissal by. A dismissal SHALL be recorded against that key and SHALL be treated as opaque — compared, never parsed.

Because the key is derived from the bar's own content, a visitor who dismissed one notice SHALL still see a subsequent notice whose copy differs, and SHALL NOT see the same notice again on a later page load.

#### Scenario: Backend forbids dismissal

- **WHEN** the bar arrives marked not dismissible
- **THEN** no dismiss control renders, and the bar shows even if a matching key was previously stored

#### Scenario: Dismissible bar without a key

- **WHEN** the bar is marked dismissible but carries no key
- **THEN** no dismiss control renders, because a dismissal that cannot be recorded would return on the next page load

#### Scenario: Visitor dismisses the bar

- **WHEN** a visitor activates the dismiss control
- **THEN** the entire bar disappears — not merely the control — and the dismissal is recorded

#### Scenario: Dismissal survives a page load

- **WHEN** a visitor who dismissed the bar loads another page and the bar's content is unchanged
- **THEN** the bar does not appear

#### Scenario: Edited copy returns the bar

- **WHEN** the bar's content changes, and therefore its key, after a visitor dismissed the previous one
- **THEN** the new bar appears

#### Scenario: Storage is unavailable

- **WHEN** the browser refuses to persist the dismissal
- **THEN** activating the control still removes the bar for the current page view rather than leaving an inert control

### Requirement: The bar appears on visitor-facing surfaces only

The bar SHALL render on the public site chrome and on the authentication screens, and SHALL NOT render on the signed-in student dashboard, the business dashboard, or the full-screen learn player. Those are working surfaces reached by people already inside the product; the bar addresses someone arriving from outside.

#### Scenario: Public marketing and commerce pages

- **WHEN** a visitor loads a page using the full site chrome — homepage, a course page, a blog article, a product page, order confirmation
- **THEN** the bar renders above the site header

#### Scenario: Focused logo-only flows

- **WHEN** a visitor loads a page using the logo-only chrome — cart, checkout, or
  certificate verification
- **THEN** the bar renders above that chrome's header

#### Scenario: Not-found page

- **WHEN** a visitor lands on a URL that does not resolve and gets the 404 page,
  which uses the full site chrome
- **THEN** the bar renders, because a visitor following a stale link from the old
  WP site is exactly who the notice is addressed to

#### Scenario: Authentication screens

- **WHEN** a visitor loads login, register, or forgot-password
- **THEN** the bar renders above the minimal header

#### Scenario: Signed-in application surfaces

- **WHEN** a user loads the student dashboard, the business dashboard, or a learn-player unit
- **THEN** the bar does not render anywhere on the page

### Requirement: The bar pushes content down and stays visible

The bar SHALL occupy space in normal document flow above the page header rather than overlaying content, and SHALL remain pinned to the top of the viewport as the page scrolls.

A non-dismissible bar SHALL produce identical markup on the server and after hydration, reading no client-side storage at all, so its output depends only on the settings response.

#### Scenario: Header is not covered

- **WHEN** the bar renders on a page
- **THEN** the site header and page content begin below it, with nothing obscured at the top of the document

#### Scenario: Bar stays visible while scrolling

- **WHEN** the visitor scrolls down a long page
- **THEN** the bar remains visible at the top of the viewport

#### Scenario: Copy wraps rather than truncating

- **WHEN** the bar renders at a narrow mobile viewport
- **THEN** the message wraps onto further lines with no text clipped or replaced by an ellipsis

#### Scenario: Non-dismissible bar hydrates cleanly

- **WHEN** a page carrying a non-dismissible bar is server-rendered and then hydrated
- **THEN** the markup matches, producing no hydration warning and no flash of the bar appearing or disappearing after load

#### Scenario: Non-dismissible bar touches no storage

- **WHEN** a page carrying a non-dismissible bar renders
- **THEN** no client-side storage is read, so nothing about the bar can depend on
  state the server could not see

#### Scenario: Content lines up with the header beneath it

- **WHEN** the bar and the page header are rendered at the same viewport width
- **THEN** the bar's content starts at the same horizontal inset as the header's,
  rather than being indented further by padding applied on top of the shared
  page-grid gutter

### Requirement: The bar is reachable and announced correctly

The bar SHALL be exposed as a labelled landmark outside the page's main content region. Its call to action and its dismiss control SHALL be keyboard reachable with a visible focus indicator, the dismiss control SHALL carry an accessible name, and text and link colours SHALL meet the site's contrast requirements.

#### Scenario: Landmark placement

- **WHEN** the accessibility tree is inspected
- **THEN** the bar is a labelled complementary landmark and is not nested inside the page's `main` region

#### Scenario: Keyboard reaches the controls

- **WHEN** the bar carries a call to action and the visitor tabs from the top of the page
- **THEN** the link receives focus with a visible focus indicator before the header's own links

#### Scenario: Dismiss control is named

- **WHEN** a dismissible bar's control is inspected
- **THEN** it exposes an accessible name describing the action rather than relying on its icon alone

#### Scenario: Text is legible against the bar

- **WHEN** the bar's text and link colours are measured against its background
- **THEN** both meet the WCAG AA contrast ratio for their size
