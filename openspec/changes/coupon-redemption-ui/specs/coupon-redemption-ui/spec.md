## Purpose

Lets a visitor redeem a Gravity Forms coupon code in the headless app — showing a code box only where a code can actually be applied, reporting the backend's verdict word for word, and carrying accepted codes through pricing, payment and recording so the amount charged is the amount quoted.

## ADDED Requirements

### Requirement: A coupon box appears only where a code can be applied

The order form SHALL render a coupon box when, and only when, the backend advertises a coupon field for that form. Where no coupon field is advertised — the form has none, the coupon add-on is inactive, or the plugin predates coupon support — no box SHALL be shown, and the rest of the form SHALL render unchanged.

#### Scenario: Form accepts coupons

- **WHEN** the certificate config advertises a coupon field
- **THEN** a code input and an Apply control are rendered

#### Scenario: Form does not accept coupons

- **WHEN** the certificate config advertises no coupon field
- **THEN** no coupon box is rendered and the form behaves exactly as it did before

#### Scenario: Older backend

- **WHEN** the config carries no coupon information at all
- **THEN** no box is rendered and no request for coupon support is made

### Requirement: The backend decides whether a code is valid

The app SHALL NOT judge a code itself — no client-side format, expiry or eligibility check may accept or reject a code. It SHALL submit the code to the backend along with the codes already applied, and SHALL present the backend's own refusal text to the visitor unchanged.

#### Scenario: Accepted code

- **WHEN** the backend accepts a code
- **THEN** the code appears in the list of applied codes and the input is cleared

#### Scenario: Refused code

- **WHEN** the backend refuses a code because it has expired
- **THEN** the message shown is the backend's own — "This coupon has expired." — not a generic failure
- **AND** the code does not appear in the applied list

#### Scenario: Empty input

- **WHEN** Apply is pressed with an empty box
- **THEN** no request is made and the visitor is prompted to enter a code

#### Scenario: Request fails

- **WHEN** the coupon request cannot complete (network or server error)
- **THEN** the visitor is told the code could not be applied and may retry
- **AND** the previously applied codes are left untouched

### Requirement: Applied codes are visible and removable

Applied codes SHALL be listed with the discount each one produced, and each SHALL be removable. Removing a code SHALL re-price the order without it.

#### Scenario: Applied code listed

- **WHEN** a £10 code is applied to a £32.97 order
- **THEN** the code is listed with its £10.00 discount

#### Scenario: Code removed

- **WHEN** the visitor removes an applied code
- **THEN** the order is re-priced without it and the total returns to its previous value

#### Scenario: Stacking a second code

- **WHEN** a second code is applied
- **THEN** the codes already applied are sent with it, so the backend can judge stacking

### Requirement: The displayed total is the backend's

Every amount shown SHALL come from the backend's quote for the current selection and codes. The app SHALL NOT compute or adjust a discounted total itself. The discount SHALL be shown as its own line so the visitor can see what the code changed.

#### Scenario: Discounted total

- **WHEN** a quote returns a subtotal, a discount and a total
- **THEN** the discount is displayed on its own line and the total shown is the backend's total

#### Scenario: Quote refuses the codes

- **WHEN** the quote is refused because an applied code is no longer valid
- **THEN** the visitor is told why, using the backend's wording
- **AND** no total is displayed that the visitor could pay at

### Requirement: Accepted codes reach payment and recording

Codes accepted by the visitor SHALL be sent when creating the payment, so the amount charged is the discounted amount, and SHALL be carried through to the recorded order, so the saved entry shows the same discount that was charged.

#### Scenario: Paying with a coupon

- **WHEN** a visitor pays for an order with an applied code
- **THEN** the amount charged is the discounted total, not the pre-coupon one

#### Scenario: Recorded order

- **WHEN** that payment is recorded
- **THEN** the recorded order carries the same codes that determined the charged amount

#### Scenario: Code applied after the payment was priced

- **WHEN** a code is applied or removed after a quote was shown
- **THEN** the payment is priced from a quote that includes the change, never from a stale one

### Requirement: Apply is disabled while there is nothing to discount

Where the order's total is known to be zero, the coupon box SHALL be disabled and SHALL say why. No
request SHALL be made in that state: a code applied to a £0 order can only be refused, and each
attempt consumes one of the visitor's rate-limited tries. While the total is still unknown — a quote
in flight — the box SHALL remain usable rather than flickering disabled.

#### Scenario: Order totals zero

- **WHEN** the quote comes back at £0 because every group is on its free option
- **THEN** the code input and Apply are disabled, and the visitor is told to select an option first
- **AND** no coupon request is made

#### Scenario: Order has a price

- **WHEN** the quote comes back above £0
- **THEN** the code input and Apply are usable and no such message is shown

#### Scenario: Quote still loading

- **WHEN** no quote has come back yet
- **THEN** the box is not disabled on the strength of an unknown total

### Requirement: Coupon fields work on ordinary forms too

A Gravity Form that is not the certificate order form SHALL render its coupon field as a code box with Apply, and SHALL post the accepted codes back with the submission under the coupon field's own input name, so Gravity Forms records the redemption. No total SHALL be shown there, because a non-payment form has none.

#### Scenario: Coupon field on a contact-style form

- **WHEN** a form carrying a coupon field is rendered
- **THEN** a code box with Apply is shown in that field's position, not a plain text input

#### Scenario: Submitting with an applied code

- **WHEN** the form is submitted with an accepted code
- **THEN** the code is included in the submission under the coupon field's input name

#### Scenario: No totals on a non-payment form

- **WHEN** a code is applied on such a form
- **THEN** the code is shown as applied and no price or discount is displayed
