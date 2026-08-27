## ADDED Requirements

### Requirement: The trending card's call to action responds to hover

The trending card's call-to-action pill SHALL change appearance when the card is hovered.

The pill is a non-interactive element inside the card, because the whole card is the link — nesting an interactive control inside a link would be worse markup than the affordance is worth. Its hover state is therefore driven by the card, in the same way the card's title already is.

#### Scenario: Hovering the trending card

- **WHEN** the pointer rests anywhere on the trending card
- **THEN** the call-to-action pill's fill differs from its resting fill

#### Scenario: The change is transitioned

- **WHEN** the pill's transition is inspected
- **THEN** it covers the property the hover alters, so the change animates rather than snapping
