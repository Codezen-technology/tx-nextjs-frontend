# purchase-trust-signals Specification

## Purpose

Governs the trust treatments the Cart and Checkout pages carry — the assurance strip beneath
the site header and the safe-and-secure band beneath the control that commits a purchase — so
the two pages where money changes hands make the same promises in the same places.

## Requirements

### Requirement: The purchase pages carry the header trusted strip

The Cart and Checkout pages SHALL present the site's trusted strip directly beneath the
header, carrying the same assurances the strip carries elsewhere on the site.

Every Cart and Checkout frame carries this strip at every width. A shopper who has followed a
course page — where the strip is present — into the basket should not watch the site's
accreditation and money-back claims disappear at the point of paying for them.

#### Scenario: The Cart page

- **WHEN** the Cart page is rendered at any width
- **THEN** the trusted strip appears between the header and the page content

#### Scenario: The Checkout page

- **WHEN** the Checkout page is rendered at any width
- **THEN** the trusted strip appears between the header and the page content

### Requirement: A trust band sits beneath the control that commits the purchase

Beneath the control that commits a purchase — the Cart's checkout button and the Checkout
page's pay button — a bordered trust band SHALL be presented, carrying:

1. a lock glyph and the line "Guaranteed safe & secure checkout",
2. an indication of the payment processor,
3. a rule, and
4. the accepted card brand marks.

The band SHALL read its brand marks from the same single list every other surface reads,
so no surface can make a different claim about what is accepted.

#### Scenario: The checkout page

- **WHEN** the Checkout page's payment section is rendered
- **THEN** the trust band appears beneath the pay button, showing the lock line, the processor
  indication, a rule and the card marks

#### Scenario: The cart summary

- **WHEN** the Cart summary is rendered
- **THEN** the same trust band appears beneath the "Proceed to Checkout" button

#### Scenario: The band agrees with the payment method row

- **WHEN** the trust band and the payment-method row are both rendered
- **THEN** they show the same card brands in the same order
