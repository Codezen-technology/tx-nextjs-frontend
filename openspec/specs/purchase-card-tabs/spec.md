# purchase-card-tabs Specification

## Purpose

Governs the two-tab purchase card on the single course page — what each tab shows,
what quantity does to the tab, and how bulk pricing is revealed. The card is the only
control on the site that both quotes a price and commits a purchase, so the rules
below exist to keep the quoted total and the cart from drifting apart.

## Requirements

### Requirement: The purchase card has two distinct tab experiences

The purchase card SHALL present two tabs: "Individual" and "Business". Each tab SHALL
render completely different content — the Individual tab shows pricing and purchase
controls, while the Business tab shows a team-focused value proposition with a lead
generation CTA.

#### Scenario: Individual tab shows pricing and purchase controls

- **WHEN** the purchase card is rendered with the "Individual" tab selected
- **THEN** the card displays the course price, quantity stepper, "Buy This Course"
  button, and feature list

#### Scenario: Business tab shows team value proposition

- **WHEN** the purchase card is rendered with the "Business" tab selected
- **THEN** the card displays "Built for Your Whole Team" heading, descriptive text,
  team benefit bullet points, and "Request a Quote" button

### Requirement: Quantity changes do not switch tabs

Changing the quantity via steppers, typing, or blur SHALL NOT cause the active tab to
change. The tab stays on whichever tab the user selected regardless of quantity.

#### Scenario: Increasing quantity stays on Individual tab

- **WHEN** the user is on the "Individual" tab and increases quantity to 2 or more
- **THEN** the active tab remains "Individual"

#### Scenario: Decreasing quantity stays on Business tab

- **WHEN** the user is on the "Business" tab and the quantity is changed
- **THEN** the active tab remains "Business"

### Requirement: Switching to Individual tab resets quantity to 1

When the user clicks the "Individual" tab, the quantity SHALL reset to 1 and the
quantity text input SHALL display "1".

#### Scenario: Clicking Individual tab resets quantity

- **WHEN** the user clicks the "Individual" tab while quantity is greater than 1
- **THEN** the quantity resets to 1 and the input displays "1"

### Requirement: Individual tab has a bulk pricing toggle

The Individual tab SHALL display a "See Bulk Pricing" / "Hide Bulk Pricing" toggle
link whenever bulk tiers are configured. Clicking this link toggles visibility of the
bulk discount pricing table. With no tiers configured — or while they are still
loading — no toggle is shown, because the table it reveals would be empty.

#### Scenario: No bulk tiers are configured

- **WHEN** the Individual tab renders and the bulk tier list is empty or unloaded
- **THEN** no bulk pricing toggle is shown

#### Scenario: Bulk pricing is hidden by default

- **WHEN** the purchase card renders with the "Individual" tab selected
- **THEN** the bulk discount table is not visible and the link reads "See Bulk Pricing"

#### Scenario: Clicking toggle shows bulk pricing

- **WHEN** the user clicks "See Bulk Pricing"
- **THEN** the bulk discount table becomes visible and the link text changes to
  "Hide Bulk Pricing"

#### Scenario: Clicking toggle again hides bulk pricing

- **WHEN** the bulk pricing table is visible and the user clicks "Hide Bulk Pricing"
- **THEN** the bulk discount table is hidden and the link text changes to
  "See Bulk Pricing"

### Requirement: Extra savings badge appears when quantity > 1

When the user is on the Individual tab and quantity is greater than 1, an
"Extra X% saved" badge SHALL appear next to the quantity stepper, where X is the
active bulk tier's discount percentage.

#### Scenario: Badge shows for applicable tier

- **WHEN** the Individual tab is active and quantity is 10 (which falls in the 10%
  tier)
- **THEN** a badge displaying "Extra 10% saved" appears next to the quantity stepper

#### Scenario: Badge hidden at quantity 1

- **WHEN** the Individual tab is active and quantity is 1
- **THEN** no "Extra X% saved" badge is displayed

#### Scenario: Badge hidden on Business tab

- **WHEN** the Business tab is active and quantity > 1
- **THEN** no "Extra X% saved" badge is displayed

### Requirement: Business tab CTA links to contact page

The Business tab's "Request a Quote" button SHALL navigate to `/contact-us` — no
trailing slash, matching every other `/contact-us` link in the app.

#### Scenario: Request a Quote navigates to contact page

- **WHEN** the user clicks "Request a Quote" on the Business tab
- **THEN** the browser navigates to `/contact-us`

### Requirement: Business tab has no purchase controls

The Business tab SHALL NOT display a price, quantity stepper, or "Buy This Course"
button. The only interactive element is the "Request a Quote" CTA.

#### Scenario: No price on Business tab

- **WHEN** the purchase card renders with the "Business" tab selected
- **THEN** no price amount is displayed

#### Scenario: No quantity stepper on Business tab

- **WHEN** the purchase card renders with the "Business" tab selected
- **THEN** no quantity stepper control is displayed

### Requirement: Bulk pricing table displays currency symbols correctly

The bulk discount pricing table SHALL display currency symbols (e.g., "£") instead of
ISO currency codes (e.g., "GBP").

Formatting goes through `formatCurrencyAmount` in `src/lib/utils/price.ts`, not a
bare `Intl.NumberFormat`. The backend is not consistent about this field — some
payloads carry `"GBP"`, others the symbol `"£"` — and `Intl.NumberFormat` throws
`RangeError` on the symbol. An unguarded throw inside this client component takes
the whole purchase card down.

#### Scenario: Currency symbol displays correctly

- **WHEN** the bulk discount table renders with currency code "GBP"
- **THEN** prices display with "£" prefix (e.g., "£26.99") not "GBP26.99"

#### Scenario: A non-ISO currency value does not break the card

- **WHEN** the bulk discount table renders with `currency` set to "£", or to nothing
- **THEN** prices still render and the purchase card stays mounted

### Requirement: The active bulk tier is identifiable without colour

The row matching the buyer's current quantity SHALL be marked with `aria-current` and
carry a text cue, not weight or tint alone. The table exists to explain the headline
total; a shopper reading it in greyscale, or through a screen reader, has to be able
to tell which row produced that number.

The active row is matched by identity against the tier the card priced with, not by
re-running the min/max comparison — two configured tiers can share a band with
different percentages, and only one of them priced this order.

#### Scenario: A quantity inside a tier band

- **WHEN** the bulk table is open and the quantity falls inside a configured tier
- **THEN** that row carries `aria-current="true"` and an assistive-technology-only
  "your current tier" phrase

#### Scenario: Overlapping tiers

- **WHEN** two configured tiers cover the same quantity with different percentages
- **THEN** the row marked active is the one whose percentage the headline total used
