## Purpose

Defines the wallet payment path on the cart page — an Apple Pay or Google Pay
purchase that produces the same order a card payment would, without the buyer
visiting the checkout form.

## ADDED Requirements

### Requirement: Wallet buttons appear only when a wallet can pay

The cart SHALL offer wallet payment only when the buyer's device has a usable
wallet and the cart has a payable total. When no wallet is available, the cart
SHALL look exactly as it did before this change — no empty space, no divider,
no placeholder.

#### Scenario: Device with a wallet

- **WHEN** a buyer with a saved wallet card opens a cart with a total above zero
- **THEN** a wallet button is offered beneath the checkout button

#### Scenario: Device with no wallet

- **WHEN** a buyer with no wallet available opens the same cart
- **THEN** no wallet button and no "or" divider are shown

#### Scenario: Empty or still-loading cart

- **WHEN** the cart is empty, or its totals have not loaded
- **THEN** no wallet payment interface is initialised

### Requirement: The wallet sheet shows the cart's real total and currency

The amount and currency shown in the wallet sheet SHALL be the cart's current
total, in the store's currency. Currency SHALL be identified to the payment
provider by its ISO 4217 code, never by its display symbol.

#### Scenario: Total changes before the buyer taps

- **WHEN** the buyer applies a coupon or changes a quantity, then opens the
  wallet sheet
- **THEN** the sheet shows the updated total

#### Scenario: Store currency is not the default

- **WHEN** the WooCommerce cart reports a currency other than GBP
- **THEN** the wallet sheet is presented in that currency

#### Scenario: Currency symbol is never used as a currency

- **WHEN** the wallet interface is initialised
- **THEN** the value given as the currency is an ISO code such as `GBP`, and the
  interface initialises without error

### Requirement: The wallet's billing details reach WooCommerce

A wallet purchase SHALL carry the buyer's name, email, and billing address from
the wallet through to the order. The wallet interface SHALL request a billing
address and an email, because the buyer supplies them nowhere else on this path.

#### Scenario: Wallet returns a full address

- **WHEN** the buyer authorises a payment and the wallet returns name, email,
  and a postal address
- **THEN** the created order carries all of them

#### Scenario: Buyer's name is a single word

- **WHEN** the wallet returns a name with no surname
- **THEN** the order is still created, with that name as the forename

### Requirement: WooCommerce remains the authority on what is charged

The order and its payment SHALL be created by WooCommerce. This app SHALL NOT
create a PaymentIntent for a cart, and SHALL NOT expose an endpoint that would
create one on request. The total sent to the wallet is presentational.

#### Scenario: Amount tampered with in the browser

- **WHEN** the total held in the browser differs from the cart WooCommerce holds
- **THEN** the amount captured is WooCommerce's, not the browser's

#### Scenario: No client-driven intent creation

- **WHEN** the application's routes are enumerated
- **THEN** none of them creates a PaymentIntent from an unauthenticated request

### Requirement: Authentication and failure are handled in the wallet flow

A wallet payment that needs cardholder authentication SHALL complete it without
leaving the cart. A payment that fails SHALL leave the cart intact, tell the
buyer why, and allow another attempt.

#### Scenario: Card requires 3-D Secure

- **WHEN** the payment comes back requiring authentication
- **THEN** the buyer is prompted to authenticate, and on success the order
  proceeds to confirmation

#### Scenario: Payment declined

- **WHEN** the payment fails or WooCommerce rejects the checkout
- **THEN** the failure reason is shown, the cart still holds its items, and the
  buyer can try again

#### Scenario: Buyer dismisses the wallet sheet

- **WHEN** the buyer closes the wallet without authorising
- **THEN** nothing is charged and the cart is unchanged

#### Scenario: Double submission

- **WHEN** a second confirmation arrives while one is still in flight
- **THEN** only one order is created

### Requirement: A successful wallet payment ends where a card payment ends

On success the buyer SHALL be taken to the order confirmation for the new order,
and the cart SHALL be emptied exactly once.

#### Scenario: Successful purchase

- **WHEN** a wallet payment succeeds
- **THEN** the buyer lands on the confirmation page for that order
- **AND** the cart is emptied, with no duplicate clear request
