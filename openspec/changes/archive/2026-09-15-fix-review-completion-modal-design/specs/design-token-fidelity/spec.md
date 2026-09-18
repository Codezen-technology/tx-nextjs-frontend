## MODIFIED Requirements

### Requirement: Player modal inputs use design system field styling

Player overlay modals (review, completion) that contain form inputs SHALL use the
project's established form field styling constants (`MARKETING_FIELD_CLASS`,
`MARKETING_LABEL_CLASS` from `form-field.tsx`) rather than ad-hoc inline classes.
This ensures consistent focus rings, border radius, placeholder colors, and
padding across all form surfaces.

#### Scenario: Review modal input styling

- **WHEN** the review modal renders its title input and textarea
- **THEN** both elements use classes derived from `MARKETING_FIELD_CLASS` including `rounded-lg`, `border-neutral-40`, `focus-visible:border-secondary-500`, and `focus-visible:ring-2 focus-visible:ring-secondary-500/30`

#### Scenario: Completion modal uses no inline style attributes

- **WHEN** the completion modal renders its heading, icon, and buttons
- **THEN** no `style={}` attributes are used for color or background; all colors are expressed as Tailwind classes (arbitrary values permitted for brand colors not in the token system)

### Requirement: Player modal text uses project font families

Player overlay modals SHALL apply `font-suse` to headings and `font-open-sans`
to body text, matching the typography conventions used on the certificate page
and dashboard.

#### Scenario: Completion modal heading font

- **WHEN** the completion modal renders the "Congratulations!" heading
- **THEN** the heading element has `font-suse` applied

#### Scenario: Completion modal body font

- **WHEN** the completion modal renders body text or button labels
- **THEN** those elements have `font-open-sans` applied

### Requirement: Completion modal uses shadcn Button component

The completion modal SHALL use the shadcn `Button` component from
`@/components/ui/button` for all interactive buttons, rather than raw HTML
`<button>` elements. This ensures consistent focus styles, disabled states,
and variant support.

#### Scenario: Leave a review button

- **WHEN** the completion modal renders the "Leave a review" action
- **THEN** it uses `<Button variant="outline">` with consistent padding and focus ring

## ADDED Requirements

### Requirement: Player modal DialogContent may use hardcoded brand colors

The `DialogContent` component in player overlay modals (review, completion) MAY
use hardcoded brand colors via Tailwind arbitrary values when the design token
system does not cover the specific shade needed (e.g. `bg-[#00204A]` for dark
navy backgrounds). This exception applies only to the top-level `DialogContent`
background; all other elements within the modal SHALL use tokens or Tailwind
classes.

#### Scenario: DialogContent uses hardcoded navy background

- **WHEN** the player modal is rendered inside a dark-themed layout (e.g. course player with `bg-black`)
- **THEN** `DialogContent` may use `bg-[#00204A]` to ensure consistent dark background regardless of the `--background` CSS variable's theme state

#### Scenario: DialogContent border is removed for dark backgrounds

- **WHEN** `DialogContent` uses a hardcoded dark background color
- **THEN** the `border` utility class may be removed to avoid a visible light border against the dark background
