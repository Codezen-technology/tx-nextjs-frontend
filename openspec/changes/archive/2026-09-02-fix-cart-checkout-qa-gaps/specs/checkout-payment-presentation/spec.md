## MODIFIED Requirements

### Requirement: Card brands render as brand marks, from one list

The checkout page SHALL display accepted card brands as their brand marks, not as text
abbreviations in boxes. Every surface that shows the list SHALL read from a single shared
source, so two surfaces cannot disagree about what is accepted. This includes the trust band
beneath the pay button, whose artwork in the design draws a longer list than the design's own
payment-method row — the shared list wins, because a brand mark is a claim about what the
gateway will take.

The list SHALL be the four the design carries: American Express, Discover, Mastercard and
Visa.

#### Scenario: The payment method row

- **WHEN** the card payment method row is rendered
- **THEN** it shows four brand-mark images and no text abbreviation such as "MC" or "DISC"

#### Scenario: Two surfaces agree

- **WHEN** both the payment-method row and the secure-payment badge are rendered
- **THEN** they list the same brands in the same order

#### Scenario: The trust band beneath the pay button

- **WHEN** the trust band beneath the pay button is rendered
- **THEN** it shows the same four brands in the same order as the payment-method row

### Requirement: The payment section states its security assurance

The payment section SHALL carry the assurance line the design specifies — "100% secure
payment" — beside its heading, and SHALL carry a trust band beneath the pay button stating
that the checkout is safe and secure and naming the payment processor.

The line beside the heading is read before the shopper enters a card; the band beneath the
button is read at the moment of committing. Both are part of the same assurance, and the
section is not complete with only one of them.

#### Scenario: The assurance line

- **WHEN** the payment section is rendered
- **THEN** "100% secure payment" appears with its icon, adjacent to the "Payment method"
  heading

#### Scenario: The band beneath the button

- **WHEN** the payment section is rendered
- **THEN** a bordered band beneath the pay button states that the checkout is safe and secure
  and indicates the payment processor
