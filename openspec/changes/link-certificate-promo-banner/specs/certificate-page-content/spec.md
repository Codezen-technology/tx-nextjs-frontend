## MODIFIED Requirements

### Requirement: Certificate page fetches editable content from the API

The `/certificate` page SHALL fetch `GET /lms-backend/v1/certificate/page` server-side and use the response to render the hero heading, hero benefits list, hero images, the order-section heading, and the sidebar promotional banner including its link. The API returns additional fields (`hero.eyebrow`, `hero.text`, `trustBadges`, `accreditationBanner`, `formId`, `txnFieldId`) that the frontend does not consume, since they have no corresponding element in the approved page design.

#### Scenario: API returns populated content

- **WHEN** `GET /certificate/page` returns non-empty `hero.heading`, `hero.benefits`, `hero.images`, `orderSection.heading`, and `promoBanner` fields
- **THEN** the rendered page displays those API-supplied values instead of the hardcoded defaults/placeholders

#### Scenario: Page remains server-rendered

- **WHEN** the `/certificate` page is requested
- **THEN** the content fetch happens in the Server Component (via `serverApi`/`serverFetch`) and the response is used during the initial render, not fetched client-side after hydration

### Requirement: Sidebar promotional banner renders from the API

The sidebar promotional banner SHALL render `promoBanner.image` via `next/image` when present, and SHALL fall back to the existing gradient placeholder box when `promoBanner.image` is null — using `promoBanner.heading` as the placeholder's label text when provided, else the current static "Promotional Banner" label.

Where `promoBanner.link` is set, the banner SHALL be a link to it — whichever of the image or the placeholder is rendered. A destination on this site's own origin SHALL navigate in place; any other destination SHALL open in a new tab without granting the opened page access to this one. The banner SHALL carry an accessible name: the image's own alt text when the CMS provides one, and the banner's heading otherwise.

A link the CMS could not have meant SHALL NOT be rendered: a destination that is neither a site-relative path nor an `http`/`https` URL — including `javascript:`, `data:`, `vbscript:` and protocol-relative values — SHALL be dropped, leaving the banner unlinked. A destination on the WordPress backend's own origin SHALL be rewritten to the equivalent path on this site, so the banner never sends a visitor back to the site the frontend replaced.

#### Scenario: Promo banner image configured

- **WHEN** `GET /certificate/page` returns a non-null `promoBanner.image`
- **THEN** the sidebar renders that image instead of the gradient placeholder

#### Scenario: No promo banner image configured

- **WHEN** `GET /certificate/page` returns `promoBanner.image: null`
- **THEN** the sidebar renders the existing gradient placeholder box, using `promoBanner.heading` as its label if non-empty, otherwise the static "Promotional Banner" text

#### Scenario: Banner links somewhere on this site

- **WHEN** `promoBanner.link` is `/pricing`
- **THEN** the banner is a link to `/pricing` that navigates in place

#### Scenario: Banner links off-site

- **WHEN** `promoBanner.link` points at another origin
- **THEN** the banner opens it in a new tab, with no access back to the opening page

#### Scenario: Banner links to the WordPress backend

- **WHEN** `promoBanner.link` is an absolute URL on the WordPress origin
- **THEN** the banner links to the same path on this site instead

#### Scenario: Link uses a scheme an editor could not have meant

- **WHEN** `promoBanner.link` is `javascript:alert(1)`, a `data:` URL, or a protocol-relative `//host/path`
- **THEN** no link is rendered and the banner shows as an ordinary image or placeholder

#### Scenario: No link configured

- **WHEN** `promoBanner.link` is empty or absent
- **THEN** the banner renders exactly as it does today, with no surrounding link

#### Scenario: Image has no alt text

- **WHEN** the CMS supplies an image with an empty `alt` and a heading of "Premium Access"
- **THEN** the banner's accessible name is "Premium Access"
