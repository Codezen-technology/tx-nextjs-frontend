## ADDED Requirements

### Requirement: Upsell banner displays membership product with beige theme

The upsell banner SHALL display the membership product data from the API with a beige gradient background, white badge with triangle corner, and 3-column layout.

#### Scenario: Banner renders with API data

- **WHEN** the membership upsell API returns valid data
- **THEN** the banner displays product name, price, features, and CTA button

#### Scenario: Banner hidden when API returns null

- **WHEN** the membership upsell API returns null
- **THEN** no banner is rendered

### Requirement: Badge displays dynamically from API

The badge text SHALL be dynamic from the `badge` field in the API response, styled with white background and triangle corner.

#### Scenario: Badge shows when provided

- **WHEN** the API response includes a non-null `badge` field
- **THEN** the badge displays with white background and triangle corner

#### Scenario: Badge hidden when null

- **WHEN** the API response `badge` field is null
- **THEN** no badge is rendered

### Requirement: CTA button uses dynamic label from API

The CTA button label SHALL be dynamic from the `cta_label` field in the API response.

#### Scenario: CTA shows dynamic label

- **WHEN** the banner renders
- **THEN** the button displays the `cta_label` value from the API

#### Scenario: CTA shows "Added" when product in cart

- **WHEN** the membership product is already in the user's cart
- **THEN** the button displays "Added" and is disabled

### Requirement: Features display with green tick icons

The feature list SHALL display with green tick-circle icons from `/icons/tick-circle-green.svg`.

#### Scenario: Features render with icons

- **WHEN** the API response includes features
- **THEN** each feature displays with a 24x24 green tick-circle icon
