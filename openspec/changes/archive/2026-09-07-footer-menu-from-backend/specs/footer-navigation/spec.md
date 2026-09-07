## Purpose

Defines how the site footer sources its navigation columns, social links, contact details, brand blurb and accreditation badges from the backend footer endpoint, and how it degrades gracefully when that data is missing, empty or partially configured.

## ADDED Requirements

### Requirement: Footer navigation columns are sourced from the backend menu

The footer SHALL render its navigation columns from the nav tree served by the backend footer endpoint. Each top-level nav node SHALL become one column, its title SHALL become that column's header, and its nested child items SHALL become the links within that column.

#### Scenario: Nested menu renders as headed columns

- **WHEN** the endpoint returns two top-level nodes, `Quick links` (children: About us, Write for us, Privacy Policy, Terms & Conditions) and `Support` (child: Contact us)
- **THEN** the footer renders two columns headed "Quick links" and "Support"
- **AND** the "Quick links" column contains exactly those four links in menu order
- **AND** the "Support" column contains exactly the "Contact us" link

#### Scenario: Menu order is preserved

- **WHEN** the endpoint returns nav items whose `menu_order` values define a specific sequence
- **THEN** columns and the links within each column are rendered in that order

#### Scenario: Flat menu with no nesting

- **WHEN** the endpoint returns top-level nav nodes that have no child items and whose links are real destinations
- **THEN** the footer renders those nodes as links distributed across columns rather than as empty headed columns

### Requirement: Footer navigation falls back when the backend supplies no usable menu

The footer SHALL render a static fallback set of site links whenever the backend nav data yields no renderable links. An absent nav field, an empty nav array, and a nav tree whose sections contain no links SHALL all be treated as "no usable menu".

#### Scenario: Backend returns an empty nav array

- **WHEN** the endpoint returns `nav: []`
- **THEN** the footer renders the static fallback link columns
- **AND** the footer does not render empty or header-only columns

#### Scenario: Backend request fails

- **WHEN** the request to the footer endpoint fails or returns no data
- **THEN** the footer renders the static fallback link columns
- **AND** the page still renders successfully

#### Scenario: Nav tree contains only empty sections

- **WHEN** the endpoint returns top-level nodes that each have an empty `items` array and no usable link of their own
- **THEN** the footer renders the static fallback link columns

### Requirement: Footer links resolve to headless frontend routes

Footer navigation links SHALL point at the headless frontend, never at the WordPress backend origin. Links to internal routes SHALL client-navigate without a full page reload. Links to genuinely third-party destinations SHALL open in a new tab with `rel="noopener noreferrer"`.

#### Scenario: WordPress permalink is rewritten

- **WHEN** a nav item's URL is an absolute permalink on the WordPress backend origin
- **THEN** the rendered link is a root-relative frontend path preserving the original path, query and hash

#### Scenario: Internal link client-navigates

- **WHEN** a user activates a footer link pointing at an internal route
- **THEN** the app performs a client-side navigation rather than a full document load

#### Scenario: External link opens in a new tab

- **WHEN** a nav item's URL points at a third-party origin, or the item is flagged to open in a new tab
- **THEN** the link opens in a new tab and carries `rel="noopener noreferrer"`

### Requirement: Footer social links reflect only configured accounts

The footer SHALL render a social icon only for a platform the backend reports a non-empty URL for. The footer SHALL NOT substitute invented or placeholder social URLs for unconfigured platforms.

#### Scenario: Only configured platforms render

- **WHEN** the backend reports URLs for Facebook and LinkedIn and `null` for every other platform
- **THEN** the footer renders exactly the Facebook and LinkedIn icons linking to those URLs

#### Scenario: No social accounts configured

- **WHEN** the backend reports `null` for every social platform, or the request failed
- **THEN** the footer renders no social icons and no "Follow us" label

### Requirement: Footer brand blurb and contact details come from the backend

The footer SHALL render the brand description, address, phone and email supplied by the backend rather than values hardcoded in the frontend. Each element SHALL be omitted when the backend supplies no value for it.

#### Scenario: Backend supplies a description

- **WHEN** the backend returns a non-empty `contact.description`
- **THEN** the footer renders that text as the brand blurb

#### Scenario: Backend supplies an address

- **WHEN** the backend returns a non-empty `contact.address`
- **THEN** the footer renders that address

#### Scenario: Contact fields are unset

- **WHEN** the backend returns `null` for description, address, phone and email
- **THEN** the footer omits those elements without rendering empty labels, blank lines or dead `tel:`/`mailto:` links

### Requirement: Footer renders backend-supplied accreditation badges

The footer SHALL render the accreditation badge images supplied by the backend. Badges SHALL never be substituted with a placeholder image, because a placeholder would misrepresent an accreditation the brand may not hold.

#### Scenario: Badges configured

- **WHEN** the backend returns one or more badges, each with an image source and alt text
- **THEN** the footer renders each badge image with its alt text

#### Scenario: No badges configured

- **WHEN** the backend returns an empty badge list, or omits the field
- **THEN** the footer renders no badge images and no surrounding badge container

### Requirement: Footer legal notice states the correct operating company

The footer bottom bar SHALL state the legal entity and registration details that match the live site's registered company.

#### Scenario: Legal notice content

- **WHEN** the footer bottom bar renders
- **THEN** it names `EXCELLENT TRAINING GROUP LTD` as the operating company
- **AND** it states company registration number `16275537` for England and Wales
- **AND** it does not display the superseded registration number `6428976` or VAT number `923 6593 07`
