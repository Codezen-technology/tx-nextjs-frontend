## MODIFIED Requirements

### Requirement: Certificate order form is unaffected

The certificate order form's pricing, dynamic fields, and payment flow SHALL continue to source
data exclusively from the backend certificate configuration and quote endpoints, and SHALL NOT be
driven by the certificate page-content endpoint. Those configuration and quote endpoints are
addressed by an order **product slug**; the `/certificate` page SHALL use the `default` product,
which SHALL produce exactly the products, choices, prices, quantities, shipping options, and
non-pricing fields that `/certificate` renders today. Sharing the order-form component with
another product SHALL NOT change `/certificate`'s rendered form, its prices, or the form its
orders are recorded against.

This requirement includes the accreditation banner (logo, "Recognising Quality Learning",
"Get CPD Certificate" button) rendered mid-form via a Gravity Forms HTML field, which is unrelated
to and unaffected by the page-content endpoint.

#### Scenario: Order flow unchanged

- **WHEN** a user completes a certificate order on the `/certificate` page after this change
- **THEN** the order form behaves identically to before — pricing, product choices, dynamic GF
  fields, and Stripe payment are driven only by the certificate configuration and quote endpoints
  for the `default` product

#### Scenario: Default product uses the unscoped endpoints

- **WHEN** a certificate configuration, quote, or recording request is made for the `default`
  product, or with no product specified
- **THEN** the request is addressed to the backend's unscoped certificate routes, unchanged from
  before product scoping existed, so a backend that does not know about products still serves it

#### Scenario: Unknown product rejected

- **WHEN** a certificate configuration, quote, or payment request specifies a product outside the
  supported set
- **THEN** the request is rejected with an error rather than silently falling back to a different
  product's pricing

#### Scenario: Shipping applicability is not inferred from ordering

- **WHEN** the order form decides whether to offer shipping for a selection
- **THEN** it identifies the shippable product group from the backend's own declaration, and never
  from the group's position in the products array — which differs between the two forms

### Requirement: Certificate page fetches editable content from the API

The `/certificate` page SHALL fetch its editable page content server-side, scoped to the `default`
product, and use the response to render the hero heading, hero benefits list, hero images, the
order-section heading, and the sidebar promotional banner. The API returns additional fields
(`hero.eyebrow`, `hero.text`, `trustBadges`, `accreditationBanner`, `promoBanner.link`, `formId`,
`txnFieldId`) that the `/certificate` page does not consume, since they have no corresponding
element in the approved page design.

#### Scenario: API returns populated content

- **WHEN** the certificate page content request returns non-empty `hero.heading`, `hero.benefits`,
  `hero.images`, `orderSection.heading`, and `promoBanner` fields
- **THEN** the rendered page displays those API-supplied values instead of the hardcoded
  defaults/placeholders

#### Scenario: Page remains server-rendered

- **WHEN** the `/certificate` page is requested
- **THEN** the content fetch happens in the Server Component (via `serverApi`/`serverFetch`) and
  the response is used during the initial render, not fetched client-side after hydration

#### Scenario: Content of `/certificate` is not affected by other products

- **WHEN** content is configured for another order product in the CMS
- **THEN** `/certificate` continues to render only its own product's content and static fallbacks
