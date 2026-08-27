# cart-line-item Specification

## Purpose

Defines what a cart row tells the shopper about the product it represents, so the basket shows the same facts the design specifies.

## Requirements

### Requirement: A cart row labels its unit price

A cart row SHALL present the product's unit price with a label identifying it as the price, distinguishing it from the line total shown alongside it.

A row shows two money values — the price of one unit and the total for the quantity — and an unlabelled pair invites the reader to mistake one for the other.

#### Scenario: A row for a single product

- **WHEN** a cart row is rendered for a product costing 24.99
- **THEN** its unit price is shown labelled as the price, and the line total is shown separately

#### Scenario: A discounted product

- **WHEN** the product's regular price is higher than its current price
- **THEN** the labelled unit price shows the current price, and the regular price is shown struck through beside it
