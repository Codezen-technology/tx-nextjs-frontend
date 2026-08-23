# site-header-navigation Specification

## Purpose

Defines the open, close, and dismissal behaviour of the desktop site header's navigation menus — the "Our courses" mega menu and the smaller nav dropdowns — including the guarantee that the rest of the page stays interactive while a menu is open.

## Requirements

### Requirement: Mega menu opens on pointer hover over its trigger

The desktop "Our courses" trigger SHALL open the mega menu as soon as the pointer enters it, with no intent delay.

#### Scenario: Pointer enters the trigger

- **WHEN** the pointer enters the "Our courses" trigger on a viewport at the `lg` breakpoint or wider
- **THEN** the mega menu panel is visible
- **AND** the trigger reports `aria-expanded="true"`

### Requirement: Mega menu stays open while the pointer travels from trigger to panel

The visual gap between the trigger and the top edge of the mega menu panel SHALL NOT dismiss the menu. Hover intent survives the crossing at any pointer speed, including a pointer that pauses inside the gap.

#### Scenario: Pointer crosses the gap slowly

- **WHEN** the mega menu is open and the pointer moves from the trigger down into the panel, pausing in the gap between them for longer than the hover close delay
- **THEN** the mega menu panel is still visible when the pointer reaches the panel

#### Scenario: Pointer rests inside the panel

- **WHEN** the pointer is anywhere inside the mega menu panel
- **THEN** the mega menu panel stays visible for as long as the pointer remains inside it

### Requirement: Mega menu closes when the pointer leaves both trigger and panel

The mega menu SHALL close shortly after the pointer leaves the union of the trigger and the panel. A short close delay is permitted so that a pointer travelling diagonally along the panel edge does not dismiss it, but the menu MUST NOT stay open indefinitely.

#### Scenario: Pointer moves away from the menu

- **WHEN** the mega menu is open and the pointer moves to a point outside both the trigger and the panel
- **THEN** the mega menu panel is no longer visible within 500 ms
- **AND** the trigger reports `aria-expanded="false"`

#### Scenario: Pointer wanders across the page below the panel

- **WHEN** the mega menu is open and the pointer moves across several points in the page body outside the panel
- **THEN** the mega menu panel is no longer visible

### Requirement: The page stays fully interactive while the mega menu is open

An open mega menu SHALL NOT place any element over the header or over page content outside the panel's own bounds. Every control outside the panel MUST remain the topmost element at its own coordinates, so it can be hovered and clicked.

#### Scenario: Header controls are reachable while the menu is open

- **WHEN** the mega menu is open
- **THEN** hit-testing the site logo, the header course-search input, and the "Our courses" trigger each resolves to that control — not to any menu-owned overlay

#### Scenario: Page content below the panel is reachable

- **WHEN** the mega menu is open
- **THEN** hit-testing a point in the page body below the panel's bottom edge resolves to page content, not to any menu-owned overlay

### Requirement: Mega menu is dismissible by click, keyboard, and navigation

Hover SHALL NOT be the only way to open or dismiss the mega menu. Pointer-less and touch users MUST retain a working path.

#### Scenario: Click toggles the menu

- **WHEN** the user clicks the "Our courses" trigger while the menu is closed
- **THEN** the mega menu opens
- **AND** clicking the trigger again closes it

#### Scenario: Escape closes the menu

- **WHEN** the mega menu is open and the user presses `Escape`
- **THEN** the mega menu closes

#### Scenario: Click outside closes the menu

- **WHEN** the mega menu is open and the user presses the pointer down on any element outside the trigger and the panel
- **THEN** the mega menu closes
- **AND** that element receives the click it would have received with the menu closed

#### Scenario: Navigation closes the menu

- **WHEN** the mega menu is open and the user follows a link that changes the current path
- **THEN** the mega menu is closed on the destination page

### Requirement: Nav dropdowns follow the same hover contract

The smaller header dropdowns (for example "Resources") SHALL open on hover, close when the pointer leaves the trigger and its panel, and remain operable by click, focus, `Escape`, and outside click.

#### Scenario: Resources dropdown opens and closes on hover

- **WHEN** the pointer enters the "Resources" trigger and then moves away from both the trigger and its panel
- **THEN** the dropdown opens on enter and is no longer visible within 500 ms of the pointer leaving

#### Scenario: Keyboard focus opens the dropdown

- **WHEN** keyboard focus moves into the "Resources" trigger
- **THEN** the dropdown opens
- **AND** it closes when focus leaves the trigger and its panel

### Requirement: The header nav contains the links the business asked for

The site header SHALL present a "Pricing" link, and SHALL NOT present a "Contact us" link.
This holds on both nav surfaces — the desktop nav and the mobile drawer — because they are
two renderings of one navigation, and a link removed from one and left in the other is
still on the site.

Contact remains reachable: the footer keeps its "Contact us" link and `/contact-us` keeps
its route.

#### Scenario: Desktop nav membership

- **WHEN** the header is rendered at a desktop width
- **THEN** a link to `/pricing` is present and no link to `/contact-us` is present

#### Scenario: Mobile drawer membership

- **WHEN** the mobile drawer is opened at 440
- **THEN** a link to `/pricing` is present and no link to `/contact-us` is present

### Requirement: The Resources dropdown lists only resources

The `Resources` dropdown SHALL NOT list "Help Centre" or "About Us". Both remain in the
header's utility row, so removing them from the dropdown removes a duplicate rather than a
destination.

#### Scenario: Dropdown contents

- **WHEN** the Resources dropdown is opened
- **THEN** it lists neither Help Centre nor About Us

#### Scenario: The destinations stay reachable

- **WHEN** the header is rendered
- **THEN** links to `/help` and `/about-us` are still present in the utility row
