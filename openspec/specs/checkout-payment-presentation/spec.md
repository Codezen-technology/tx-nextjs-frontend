# checkout-payment-presentation Specification

## Purpose

Governs what the checkout page claims about payment — which card brands it displays, and
the rule that it never offers a method it cannot process.

## Requirements

### Requirement: Card brands render as brand marks, from one list

The checkout page SHALL display accepted card brands as their brand marks, not as text
abbreviations in boxes. Every surface that shows the list SHALL read from a single shared
source, so two surfaces cannot disagree about what is accepted.

The list SHALL be the four the design carries: American Express, Discover, Mastercard and
Visa.

#### Scenario: The payment method row

- **WHEN** the card payment method row is rendered
- **THEN** it shows four brand-mark images and no text abbreviation such as "MC" or "DISC"

#### Scenario: Two surfaces agree

- **WHEN** both the payment-method row and the secure-payment badge are rendered
- **THEN** they list the same brands in the same order

### Requirement: The page does not offer a payment method it cannot process

The checkout page SHALL NOT present a payment method that cannot complete a purchase —
including as a disabled row, a greyed-out option or a "coming soon" placeholder. A method
appears when it works.

#### Scenario: PayPal is not implemented

- **WHEN** the payment method list is rendered and PayPal cannot be processed
- **THEN** no PayPal row, badge or placeholder appears

### Requirement: The payment section states its security assurance

The payment section SHALL carry the assurance line the design specifies — "100% secure
payment" — beside its heading.

#### Scenario: The assurance line

- **WHEN** the payment section is rendered
- **THEN** "100% secure payment" appears with its icon, adjacent to the "Payment method"
  heading
