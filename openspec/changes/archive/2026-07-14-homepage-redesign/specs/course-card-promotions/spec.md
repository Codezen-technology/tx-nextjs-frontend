## ADDED Requirements

### Requirement: Course list responses include promotional badges

Every course list endpoint response item (`/courses`, `/courses/featured`, and any endpoint backed by `Course_Model::to_array()`) SHALL include a `badges` array covering, at minimum: `bestseller`, `limited_time_offer`, `free_certificate`, and `team_training`, using the same post-meta-flag resolution already used for the detail endpoint.

#### Scenario: Course with all promotional flags set

- **WHEN** a course has its bestseller, limited-time-offer, free-certificate, and team-training meta flags all truthy
- **THEN** the list response for that course includes all four values in `badges`

#### Scenario: Course with no promotional flags set

- **WHEN** a course has none of the promotional meta flags set
- **THEN** the list response for that course includes an empty `badges` array

### Requirement: Course list responses include CPD points

Every course list endpoint response item SHALL include `cpd_points`, computed the same way as the detail endpoint (duration-derived, 0 when duration is unavailable).

#### Scenario: Course with a known duration

- **WHEN** a course has a duration of 3 hours
- **THEN** the list response for that course includes `cpd_points: 3`

### Requirement: Course list responses include sale pricing and countdown data

Every course list endpoint response item for a paid course SHALL include a `sale` object with `regular_price`, `sale_price`, `is_on_sale`, and `sale_ends_at` (ISO 8601 datetime or `null`), sourced from the linked WooCommerce product. Free courses SHALL include `sale: null`.

#### Scenario: Paid course currently on sale with a scheduled end date

- **WHEN** a course's linked WooCommerce product is on sale with a `date_on_sale_to` value set
- **THEN** the list response's `sale.is_on_sale` is `true` and `sale.sale_ends_at` is that date, in ISO 8601 format

#### Scenario: Paid course not on sale

- **WHEN** a course's linked WooCommerce product has no active sale
- **THEN** the list response's `sale.is_on_sale` is `false` and `sale.sale_ends_at` is `null`

#### Scenario: Free course

- **WHEN** a course has no linked WooCommerce product (free course)
- **THEN** the list response's `sale` field is `null`

### Requirement: Course card renders badges, price, and countdown

The shared course card component SHALL render: a badge pill for each entry in `badges` (with a fixed label per known badge key), the sale price with the regular price struck through when `sale.is_on_sale` is true, and a live "Offer expires in HH:MM:SS" countdown when `sale.sale_ends_at` is present and in the future.

#### Scenario: Card for a course on sale with a future end date

- **WHEN** a course card receives a course with `sale.is_on_sale: true` and a future `sale.sale_ends_at`
- **THEN** the card shows the struck-through regular price, the sale price, and a live countdown to `sale_ends_at`

#### Scenario: Card for a course whose sale has already ended

- **WHEN** a course card receives a course with a `sale.sale_ends_at` in the past
- **THEN** the card does not show a countdown (treats the offer as expired/not on sale for display purposes)

#### Scenario: Card for a course with no badges

- **WHEN** a course card receives a course with an empty `badges` array
- **THEN** the card renders with no badge pills, with no layout gap left behind
