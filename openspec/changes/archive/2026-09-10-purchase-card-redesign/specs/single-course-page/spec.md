## MODIFIED Requirements

### Requirement: Every accordion and tab control has a visible hover state

Each interactive control in the page's FAQ accordion and in the purchase card's
audience tabs SHALL change its rendered appearance on hover — background, colour or
both. This SHALL hold for the **active** tab as well as the inactive one; an active
control that cannot respond to the pointer reads as disabled.

#### Scenario: FAQ toggle responds to hover

- **WHEN** the pointer moves over an FAQ question row or its `+`/`−` icon
- **THEN** the row's computed background or the icon's computed colour differs from its
  resting value

#### Scenario: Both purchase tabs respond to hover

- **WHEN** the pointer moves over the "Individual" tab and then the "Business" tab, in
  either selection state
- **THEN** each tab's computed background or colour differs from its resting value
