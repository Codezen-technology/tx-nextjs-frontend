# cart-page-sections Specification

## Purpose

Defines what the Cart page presents around its line items — the courses it suggests next, and
how a line item's controls arrange themselves when the row is too narrow to hold them in one
line.

## Requirements

### Requirement: A cart line item groups its total and remove control to the row's end

When a cart row is too narrow to place its title, quantity, total and remove control on one
line, the quantity control SHALL stay at the start of the controls line and the line total and
remove control SHALL sit together at its end.

A total and a remove control floating mid-row read as unanchored: the eye has no edge to scan
down when a basket holds several rows, and the remove control lands under the thumb's resting
arc rather than at the edge where destructive controls are expected.

#### Scenario: A narrow viewport

- **WHEN** the cart is rendered at 440px and a row's controls wrap below the product title
- **THEN** the quantity control is aligned to the start of the controls line, and the line
  total and remove control are aligned to its end

#### Scenario: A wide viewport

- **WHEN** the cart is rendered at 1280px or wider
- **THEN** the controls keep their existing single-line arrangement beside the product title

### Requirement: The cart suggests further courses

The Cart page SHALL present a section of suggested courses below its line items, headed
"Customers Also Purchased", showing at most three courses.

#### Scenario: A cart holding items

- **WHEN** the Cart page is rendered with at least one line item
- **THEN** a "Customers Also Purchased" section appears below the cart contents with up to
  three course cards

#### Scenario: Suggestions are still loading

- **WHEN** the suggested courses have not yet loaded
- **THEN** the section reserves its space rather than appearing after the page has settled

#### Scenario: No suggestions are available

- **WHEN** no suggested courses can be shown
- **THEN** the section is absent, and no empty heading is left behind
