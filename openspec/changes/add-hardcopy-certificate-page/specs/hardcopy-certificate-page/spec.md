## Purpose

Covers the public `/hardcopy-certificate` ordering page — the hardcopy-led certificate funnel
migrated from the WordPress page of the same slug, where a printed certificate is the required
purchase and the digital transcript is an optional add-on.

## ADDED Requirements

### Requirement: `/hardcopy-certificate` is a public server-rendered page

The site SHALL serve a public page at `/hardcopy-certificate` that renders server-side and
requires no authentication, using the same minimal (header/footer-only, no dashboard chrome)
shell as `/certificate`.

#### Scenario: Anonymous visitor loads the page

- **WHEN** an unauthenticated visitor requests `/hardcopy-certificate`
- **THEN** the page returns HTTP 200 with its hero, order form, and sidebar present in the
  server-rendered HTML, and the visitor is not redirected to login

#### Scenario: Route is not redirected away

- **WHEN** a request arrives for `/hardcopy-certificate`
- **THEN** the response is the hardcopy page itself, **not** a 301/308 redirect to `/certificate`

### Requirement: Hardcopy hero content

The page SHALL render a hero containing the page heading "Order Hardcopy Certificate", the
supporting line "Power Your Professional Growth with CPD Certification & Transcript", a benefits
list, and certificate/transcript sample imagery.

#### Scenario: Default hero copy

- **WHEN** no CMS-supplied hero content is available
- **THEN** the hero renders the heading "Order Hardcopy Certificate", the supporting line
  "Power Your Professional Growth with CPD Certification & Transcript", and the benefits
  "Showcase Your Professional Growth", "Strengthen Your CV & Career Opportunities", and
  "Meet CPD & Professional Requirements"

### Requirement: Page content is CMS-editable with per-field static fallback

The page SHALL request its editable content (hero heading, supporting line, benefits, hero images,
order-section heading, sidebar promotional banner) from the backend scoped to the `hardcopy`
product, and SHALL render the API value for each field when non-empty. Each field SHALL fall back
independently to its static default when the API value is empty, null, or missing.

#### Scenario: Partially configured content

- **WHEN** the content response supplies a non-empty hero heading but an empty benefits array
- **THEN** the page renders the API heading and the static benefits list

#### Scenario: Content request fails

- **WHEN** the content request times out or returns a non-2xx response
- **THEN** the page still renders successfully using the full static fallback content and does
  not throw or return an error page

### Requirement: Hardcopy-led ordering semantics

The order form SHALL present the hardcopy printed certificate choice as the first and required
product selection, and the digital transcript as a subsequent optional selection that includes an
explicit opt-out choice.

#### Scenario: Hardcopy selection is required

- **WHEN** a visitor attempts to submit without choosing a hardcopy option
- **THEN** submission is blocked and the hardcopy field is flagged as required

#### Scenario: Digital transcript can be declined

- **WHEN** a visitor selects the "I don't need digital Transcript" option
- **THEN** the order is still submittable and the digital transcript contributes £0.00 to the total

#### Scenario: Hardcopy appears before digital

- **WHEN** the order form renders
- **THEN** the hardcopy product group appears above the digital transcript group in the document order

### Requirement: Order form is driven by the hardcopy product's server configuration

The order form's product groups, choices, prices, quantity options, shipping options, and
non-pricing fields SHALL come from the backend configuration for the `hardcopy` product. The
frontend SHALL NOT hardcode prices, choice labels, or field identifiers.

#### Scenario: Backend supplies the schema

- **WHEN** the hardcopy configuration is fetched successfully
- **THEN** every product group, choice label, price, quantity option, shipping option, and
  non-pricing input rendered on the page originates from that response

#### Scenario: Configuration unavailable

- **WHEN** the hardcopy configuration request fails or returns no products
- **THEN** the page renders the hero and surrounding content, and the order area shows a
  non-blocking unavailable message instead of a partially priced form

### Requirement: Server-authoritative hardcopy pricing

The order total charged SHALL be computed by the backend for the `hardcopy` product from the
submitted selection. A price, subtotal, or total sent by the browser SHALL never be used to
determine the amount charged.

#### Scenario: Tampered client total

- **WHEN** a client submits a selection along with a total lower than the server-computed total
- **THEN** the payment is created for the server-computed total, and the client value is ignored

#### Scenario: Empty selection

- **WHEN** the server-computed total for a submitted selection is zero or the selection is
  unavailable
- **THEN** payment creation is rejected with an error and no PaymentIntent is created

### Requirement: Orders are recorded against the hardcopy product

A completed hardcopy payment SHALL be recorded against the hardcopy product's form, not the
`/certificate` product's form. The product used to price an order SHALL be carried through the
payment record so that recording cannot resolve to a different product than the one charged.

#### Scenario: Successful hardcopy payment

- **WHEN** a hardcopy order payment succeeds
- **THEN** the resulting backend entry is created against the hardcopy form with that order's
  selections and customer details

#### Scenario: Product is preserved across the payment lifecycle

- **WHEN** the recording step runs from either the client confirmation path or the payment webhook
- **THEN** both resolve the same product that was used to price the order, taken from the payment
  record rather than from client input, and address the recording request to that product

#### Scenario: Backend cannot serve the hardcopy product

- **WHEN** the backend does not serve the hardcopy product's ordering endpoints
- **THEN** the order area shows the unavailable state, and under no circumstances renders another
  product's choices or prices

### Requirement: Confirmation and error feedback

The page SHALL confirm a successful order to the visitor and SHALL surface a recoverable error
message on payment failure without losing the visitor's entered details.

#### Scenario: Payment succeeds

- **WHEN** the payment completes successfully
- **THEN** the visitor sees an order confirmation stating that their certificate order was received

#### Scenario: Payment declined

- **WHEN** the payment provider declines the card
- **THEN** the visitor sees the decline reason, the form remains populated, and they can retry

### Requirement: SEO metadata and canonical

The page SHALL export server-generated metadata sourced from the WordPress SEO record for
`/hardcopy-certificate/`, with static fallback title and description, and a canonical URL of
`<site>/hardcopy-certificate`.

#### Scenario: SEO record available

- **WHEN** the SEO lookup for `/hardcopy-certificate/` succeeds
- **THEN** the page's title, description, and social metadata come from that record and the
  canonical points at the frontend domain, not the WordPress domain

#### Scenario: SEO lookup fails

- **WHEN** the SEO lookup returns nothing or fails
- **THEN** the page still emits a title, a description of at most 160 characters, and the
  canonical `<site>/hardcopy-certificate`

### Requirement: Legacy redirect removed

The `/hardcopy-certificate` → `/certificate` redirect SHALL be removed so the slug resolves to
its own page. Other legacy certificate redirects SHALL be unaffected.

#### Scenario: Sibling redirects still work

- **WHEN** a request arrives for `/thank-you-for-ordering-certificate`
- **THEN** it still redirects to `/certificate` as before
