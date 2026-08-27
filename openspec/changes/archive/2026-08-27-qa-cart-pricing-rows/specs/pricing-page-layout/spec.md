## ADDED Requirements

### Requirement: The pricing page's categories section carries no call to action

On the pricing page, the "explore courses by category" section SHALL render its heading and grid with no accompanying call-to-action link.

The same section on the homepage SHALL keep its link. The two pages' frames differ on this point, so the section is configured per page rather than changed everywhere — the homepage's placement was measured and accepted separately.

#### Scenario: The categories section on the pricing page

- **WHEN** `/pricing` is rendered
- **THEN** the categories section's heading row contains no "view all courses" link

#### Scenario: The same section on the homepage

- **WHEN** the homepage is rendered
- **THEN** the categories section still carries its "view all courses" link
