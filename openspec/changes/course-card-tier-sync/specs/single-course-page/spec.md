## ADDED Requirements

### Requirement: The purchase tab follows the quantity from every quantity control

The purchase card's selected tab SHALL be derived from the committed quantity, whichever
control committed it. A quantity greater than one SHALL select "For teams"; a quantity of
exactly one SHALL select "For me". This SHALL hold for the decrement button, the increment
button, typing a value into the quantity field, and blurring the field after typing.

A buyer who lowers the quantity to one by typing must not be left looking at a team
purchase of a single licence — the tab is the card's claim about who is buying, and it is
read alongside a total that has already reverted to the single-licence price.

Choosing a tab by clicking it remains the buyer's decision and keeps its existing
behaviour: selecting "For me" resets the quantity to one, so the invariant continues to
hold after the click.

#### Scenario: Typing 1 into the quantity field

- **WHEN** the card is on "For teams" at a quantity above one
- **AND** the buyer selects the quantity field and types `1`
- **THEN** the "For me" tab becomes the selected tab

#### Scenario: Stepping down to 1

- **WHEN** the card is on "For teams" at a quantity of two
- **AND** the buyer presses the decrease-quantity button
- **THEN** the quantity is one and the "For me" tab becomes the selected tab

#### Scenario: Blurring the field on a value of 1

- **WHEN** the buyer clears the quantity field and blurs it, so the quantity is clamped to one
- **THEN** the "For me" tab becomes the selected tab

#### Scenario: Raising the quantity above one

- **WHEN** the card is on "For me" and the buyer raises the quantity to two by any control
- **THEN** the "For teams" tab becomes the selected tab

### Requirement: The bulk-discount table marks the tier the current quantity has reached

When the bulk-discount table is shown, the row for the tier that applies to the current
quantity SHALL be rendered in an active state, and every other row SHALL be rendered
inactive. The tier marked active SHALL be the same tier used to compute the per-unit
price shown in the card's header, so the highlighted row and the headline total can never
disagree.

A quantity below the lowest tier's minimum SHALL leave every row inactive — there is no
discount in force to point at.

The active row SHALL be distinguishable by more than colour alone, and SHALL be exposed to
assistive technology rather than being conveyed only visually.

#### Scenario: A quantity inside a bounded tier

- **WHEN** tiers of 10–19, 20–49 and 50–100 users are offered and the quantity is 21
- **THEN** the "20 - 49 users" row is the active row, and the 10–19 and 50–100 rows are inactive

#### Scenario: A quantity on a tier boundary

- **WHEN** the quantity is exactly the minimum of a tier, or exactly its maximum
- **THEN** that tier's row is the active row

#### Scenario: A quantity below every tier

- **WHEN** the lowest tier starts at 10 users and the quantity is 1
- **THEN** no row is marked active and the header shows the undiscounted price

#### Scenario: The highlight agrees with the header price

- **WHEN** overlapping tiers both apply to the quantity and the larger discount wins the header price
- **THEN** the row marked active is the tier that produced that price, not the first matching tier

#### Scenario: The active row is announced

- **WHEN** a row is the active row
- **THEN** its state is available to assistive technology, and the row carries a non-colour cue in addition to its colour treatment
