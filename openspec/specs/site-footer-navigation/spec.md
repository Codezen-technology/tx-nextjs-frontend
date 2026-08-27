# site-footer-navigation Specification

## Purpose

Defines which links the site footer presents when its menu is owned by WordPress, and how
the frontend honours a business decision to remove an item that the CMS still serves.

## Requirements

### Requirement: Removed footer links do not render, whatever the CMS returns

The footer SHALL NOT render a link the business has asked to remove, on either data path —
the WordPress menu or the built-in fallback. Specifically it SHALL NOT render "Force for
Good", "Work for us" or "Resources".

Matching SHALL be by destination path, not by label, because a CMS editor can rename a menu
item without changing where it goes.

#### Scenario: The CMS still serves a removed item

- **WHEN** the footer menu endpoint returns an item pointing at `/force-for-good`,
  `/careers` or `/resources`
- **THEN** that item is absent from the rendered footer

#### Scenario: The CMS returns no menu at all

- **WHEN** the footer menu endpoint returns an empty menu and the built-in fallback is used
- **THEN** the same three destinations are absent from the rendered footer

#### Scenario: An editor renames a removed item

- **WHEN** a menu item's label changes but it still points at a removed destination
- **THEN** it is still absent

### Requirement: The removal list names the CMS as the durable fix

The filter SHALL be a single named, commented list, and its comment SHALL state that the
authoritative fix is deleting the items from the WordPress menu. Filtering CMS content in
the frontend is a guard, not the intended long-term arrangement, and a reader who finds a
menu item mysteriously missing SHALL be able to find out why from the code.

#### Scenario: A developer investigates a missing footer link

- **WHEN** a developer looks for why a CMS menu item does not appear
- **THEN** they find one list, with a comment explaining the decision and pointing at the
  CMS

### Requirement: Links the business kept are unaffected

Filtering SHALL remove only the named destinations. Every other item the CMS serves SHALL
render, in the order and the column the CMS placed it in.

#### Scenario: The remaining menu is untouched

- **WHEN** the CMS serves a ten-item menu of which three are on the removal list
- **THEN** the other seven render, in their original order and columns
