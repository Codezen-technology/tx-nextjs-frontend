## Purpose

Decides which option the certificate order form opens on, so a visitor sees the same pre-selection and the same opening total as the Gravity Forms-rendered version of that form — the one an admin edits against.

## ADDED Requirements

### Requirement: The form opens on Gravity Forms' own default

Each product group SHALL open on the choice the backend reports as that form's default. Where a group reports no default, the group SHALL open on its free "I don't need…" option if it has one, and otherwise open with nothing selected — a priced choice SHALL NOT be pre-selected on the visitor's behalf.

#### Scenario: Group with a priced default

- **WHEN** the digital group's default is its £14.99 option
- **THEN** that option is selected on load and the opening total is £14.99

#### Scenario: Group whose default is the free option

- **WHEN** the hardcopy group's default is its £0 "I don't need…" option
- **THEN** that option is selected on load and the group adds nothing to the total

#### Scenario: Group with no default and no free option

- **WHEN** a group reports no default and offers no £0 choice
- **THEN** nothing is selected in that group, and the order is not priced until the visitor chooses

#### Scenario: Backend does not report defaults

- **WHEN** the config carries no default information at all
- **THEN** the group falls back to its free option, as it did before defaults were reported

### Requirement: The visitor's own choice always wins

Once a visitor selects an option, that selection SHALL persist for the rest of the session and SHALL NOT be re-overridden by the default, including after the order is re-priced.

#### Scenario: Visitor overrides the default

- **WHEN** a visitor picks the £9.99 option in a group whose default is £14.99
- **THEN** £9.99 stays selected and the order is priced at £9.99

#### Scenario: Re-quote after another change

- **WHEN** the visitor then changes shipping, re-pricing the order
- **THEN** their £9.99 choice is still selected
