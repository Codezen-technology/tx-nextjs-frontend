## ADDED Requirements

### Requirement: The pricing section is identical on the homepage and the pricing page

The "Enjoy Unlimited Training, Save More!" section SHALL present the same offer on `/` and
on `/pricing`. Both pages SHALL read it from a single source, so the two cannot drift as
editors change one and not the other.

For every plan the section renders, the two pages SHALL agree on: the plan's name and
subtitle, its price and any struck-through was-price, its price unit, its badge
("Best Value" / "Most Popular" / none), its card variant, its call-to-action label, its
feature list including which features are marked included, and whether the plan is wired to
a purchasable product. The two pages SHALL render the same number of plans in the same
order, and the section's heading and description SHALL match.

The purchasability clause is the load-bearing one. A plan that adds to the cart on the
homepage SHALL add to the cart on `/pricing` — the pricing page is where the homepage's own
"View more details" link leads, so a plan that is buyable on one page and merely
navigational on the other quotes the visitor a price they cannot act on.

#### Scenario: Plans match between the two pages

- **WHEN** `/` and `/pricing` are rendered against the same backend
- **THEN** the pricing section on each shows the same plans, in the same order, with the
  same names, subtitles, prices, price units, was-prices, badges, variants, CTA labels and
  features

#### Scenario: The section's own heading matches

- **WHEN** `/` and `/pricing` are rendered against the same backend
- **THEN** the section's heading and description are the same on both

#### Scenario: A plan buyable on the homepage is buyable on the pricing page

- **WHEN** a plan on the homepage is wired to a product and its call to action adds that
  product to the cart
- **THEN** the same plan on `/pricing` is wired to the same product, and its call to action
  adds to the cart rather than navigating away

#### Scenario: An editor changes the offer

- **WHEN** the price, badge or feature list of a plan is changed in the backend
- **THEN** both pages reflect the change together; neither page can show a stale version of
  a plan the other has updated

#### Scenario: The section is absent

- **WHEN** the source payload carries no plans
- **THEN** neither page renders the pricing section, and neither renders an empty heading

### Requirement: The pricing page's pricing section carries no header call to action

On `/pricing`, the pricing section SHALL render its heading and description with no
accompanying header call-to-action link. That link points at `/pricing`; on the pricing page
it would offer the visitor the page they are already reading.

The same section on the homepage SHALL keep its link. As with the categories section in this
spec, the section is configured per page rather than changed everywhere.

#### Scenario: The pricing section on the pricing page

- **WHEN** `/pricing` is rendered
- **THEN** the pricing section's heading row contains no "View more details" link

#### Scenario: The same section on the homepage

- **WHEN** the homepage is rendered
- **THEN** the pricing section still carries its "View more details" link to `/pricing`
