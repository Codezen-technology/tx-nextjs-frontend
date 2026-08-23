## ADDED Requirements

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
