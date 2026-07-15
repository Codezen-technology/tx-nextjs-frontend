## ADDED Requirements

### Requirement: ACF-editable header nav content

The system SHALL expose the global site header's nav item labels/URLs, search label/placeholder, and basket/login labels as ACF fields on a dedicated "Header Settings" Options Page, editable by users with `manage_options` capability, independent of any single WordPress page or post.

#### Scenario: Admin edits a nav label

- **WHEN** an admin with `manage_options` capability opens the "Header Settings" options page in wp-admin and changes the "About us" nav item's label to "Who We Are"
- **THEN** the change is saved via ACF and does not require editing any WordPress Page or Post

#### Scenario: Non-privileged user cannot edit

- **WHEN** a user without `manage_options` capability attempts to access the Header Settings admin screen
- **THEN** WordPress denies access per standard `manage_options`-gated admin page behavior

### Requirement: Header content defaults match the Figma design

When a header ACF field has never been set (fresh install, or explicitly cleared), the system SHALL return the default value shown in the Figma "Header" component (node `649:22655`): nav labels "About us", "Help", "Our courses", "Training teams", "Resources", "Contact us"; search label "Find a course:" with placeholder "e.g. food hygiene"; basket label "Basket"; login label "Log in".

#### Scenario: Fresh install returns Figma defaults

- **WHEN** `GET /lms-backend/v1/settings` is called on a site where the Header Settings options page has never been saved
- **THEN** the response's `header` object contains the Figma-derived default label for every nav item, search copy, and basket/login labels, with no field null or missing

#### Scenario: Clearing a field reverts to default

- **WHEN** an admin blanks out (empty string) the "Contact us" nav label in wp-admin and saves
- **THEN** subsequent `GET /lms-backend/v1/settings` responses return the default label "Contact us" for that item, not an empty string

### Requirement: Settings endpoint exposes header content

`GET /lms-backend/v1/settings` SHALL include a `header` object containing: an ordered list of nav items (each with `label: string` and optional `href: string`), `search_label: string`, `search_placeholder: string`, `basket_label: string`, and `login_label: string`. This key SHALL be additive to the existing response shape — no existing key is removed, renamed, or changed in type.

#### Scenario: Settings response includes header block

- **WHEN** a client calls `GET /lms-backend/v1/settings`
- **THEN** the JSON response's `data` object includes a `header` key matching the documented shape, alongside all pre-existing keys (`site_name`, `logo_url`, `currency`, `features`, etc.) unchanged

### Requirement: Frontend header falls back gracefully when content is absent

The `SiteHeader` component SHALL render using its existing hardcoded default copy when `useSiteSettings().header` is undefined, or when any individual header field within it is undefined, so that a stale cache, a failed settings fetch, or a not-yet-deployed backend produces no visual regression.

#### Scenario: Settings fetch fails

- **WHEN** the server-side `/settings` fetch fails and the app falls back to `getEnvFallbackSettings()`
- **THEN** `SiteHeader` renders nav labels, search copy, and basket/login labels identical to the current hardcoded UI

#### Scenario: Partial header object

- **WHEN** the `/settings` response's `header` object is present but omits `search_placeholder`
- **THEN** `SiteHeader` renders the default placeholder "e.g. food hygiene" for that field only, while using the provided values for all other header fields

### Requirement: Nav item href override is optional per item

Each header nav item SHALL support an optional `href` override. When `href` is unset for a nav item, the frontend SHALL use its existing hardcoded route for that item (or existing dropdown/mega-menu toggle behavior for "Our courses" and "Resources", which do not navigate directly).

#### Scenario: Label-only override

- **WHEN** an admin changes only the "Help" label to "Support" without setting an href
- **THEN** the frontend renders "Support" as the link text while keeping the link's destination at `/help`

#### Scenario: Full override

- **WHEN** an admin sets the "Help" nav item's href to an external URL
- **THEN** the frontend renders the "Help" link pointing at the admin-supplied URL instead of `/help`

### Requirement: Header logo image field remains unimplemented

The Header Settings ACF field group SHALL include a logo image field for future use, but the frontend SHALL NOT be changed by this capability to consume it — the header continues resolving its logo exclusively via the existing `logo_url` (`custom_logo` theme mod) mechanism and its current text-fallback when no logo is set.

#### Scenario: Logo field left empty

- **WHEN** the Header Settings logo image field is left unset (the default state)
- **THEN** `SiteHeader` displays the existing "Training / Excellence" text-logo fallback exactly as it does today, unaffected by this capability
