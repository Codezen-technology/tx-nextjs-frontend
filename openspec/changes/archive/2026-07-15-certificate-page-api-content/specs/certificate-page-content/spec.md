## ADDED Requirements

### Requirement: Certificate page fetches editable content from the API

The `/certificate` page SHALL fetch `GET /lms-backend/v1/certificate/page` server-side and use the response to render the hero heading, hero benefits list, hero images, the order-section heading, and the sidebar promotional banner. The API returns additional fields (`hero.eyebrow`, `hero.text`, `trustBadges`, `accreditationBanner`, `promoBanner.link`, `formId`, `txnFieldId`) that the frontend does not consume, since they have no corresponding element in the approved page design.

#### Scenario: API returns populated content

- **WHEN** `GET /certificate/page` returns non-empty `hero.heading`, `hero.benefits`, `hero.images`, `orderSection.heading`, and `promoBanner` fields
- **THEN** the rendered page displays those API-supplied values instead of the hardcoded defaults/placeholders

#### Scenario: Page remains server-rendered

- **WHEN** the `/certificate` page is requested
- **THEN** the content fetch happens in the Server Component (via `serverApi`/`serverFetch`) and the response is used during the initial render, not fetched client-side after hydration

### Requirement: Per-field static fallback when API content is empty

Each content field the page renders SHALL independently fall back to its current static default when the corresponding API field is empty, null, or missing, so partially-configured CMS content does not blank out unrelated sections.

#### Scenario: Only hero heading configured

- **WHEN** `GET /certificate/page` returns a populated `hero.heading` but an empty `hero.benefits` array and empty `hero.images` array
- **THEN** the page renders the API-supplied hero heading and falls back to the existing static benefits list and hero mockup images

#### Scenario: All content fields empty

- **WHEN** `GET /certificate/page` returns its documented empty-fallback shape for the fields the frontend consumes (`hero: { heading: '', benefits: [], images: [] }, orderSection: { heading: '' }, promoBanner: { image: null, heading: '' }`)
- **THEN** the page renders identically to today's fully-hardcoded content, including the static hero mockup images

### Requirement: Graceful degradation on fetch failure

If the `GET /certificate/page` request fails (network error or non-2xx response), the page SHALL render using the full static fallback content and SHALL NOT throw or return an error page.

#### Scenario: Backend endpoint unreachable

- **WHEN** `GET /certificate/page` times out or returns a 5xx response
- **THEN** the `/certificate` page still renders successfully with the existing static hero heading, benefits, hero images, and order-section heading

### Requirement: Hero images render from the API with static mockup fallback

The two hero graphic panels SHALL render images from `hero.images` (each `{ url, alt }`) via `next/image` when present, and SHALL fall back to the bundled static certificate/transcript mockup images (`public/images/certificate/hero-certificate.jpg`, `hero-transcript.jpg`) when `hero.images` is empty.

#### Scenario: Hero images configured

- **WHEN** `GET /certificate/page` returns one or two entries in `hero.images`
- **THEN** the page renders each as an image (using its `alt` text) in place of the corresponding static mockup image

#### Scenario: No hero images configured

- **WHEN** `GET /certificate/page` returns an empty `hero.images` array
- **THEN** the page renders the bundled static certificate/transcript mockup images

### Requirement: Sidebar promotional banner renders from the API

The sidebar promotional banner SHALL render `promoBanner.image` via `next/image` when present, and SHALL fall back to the existing gradient placeholder box when `promoBanner.image` is null — using `promoBanner.heading` as the placeholder's label text when provided, else the current static "Promotional Banner" label.

#### Scenario: Promo banner image configured

- **WHEN** `GET /certificate/page` returns a non-null `promoBanner.image`
- **THEN** the sidebar renders that image instead of the gradient placeholder

#### Scenario: No promo banner image configured

- **WHEN** `GET /certificate/page` returns `promoBanner.image: null`
- **THEN** the sidebar renders the existing gradient placeholder box, using `promoBanner.heading` as its label if non-empty, otherwise the static "Promotional Banner" text

### Requirement: Certificate order form is unaffected

The `CertificateForm` component's pricing, dynamic fields, and payment flow SHALL continue to source data exclusively from `GET /certificate/config` and SHALL NOT be modified by the `/certificate/page` content integration. This includes the accreditation banner (logo, "Recognising Quality Learning", "Get CPD Certificate" button) rendered mid-form via a Gravity Forms HTML field, which is unrelated to and unaffected by the `/certificate/page` content endpoint.

#### Scenario: Order flow unchanged

- **WHEN** a user completes a certificate order on the `/certificate` page after this change
- **THEN** `CertificateForm` behaves identically to before — pricing, product choices, dynamic GF fields, and Stripe payment are driven only by `/certificate/config` and `/certificate/quote`
