## MODIFIED Requirements

### Requirement: Hero section displays a live course carousel

The hero section SHALL render a stacked, auto-navigable carousel of course cards sourced from the featured-courses data, positioned to the side of the headline.

At every viewport width where the carousel is rendered, the complete card stack SHALL be laid out inside the hero's content container: no card SHALL extend past the container's right edge, and no card SHALL be clipped by an ancestor's overflow handling. The carousel SHALL become visible only at widths where the hero lays out as a horizontal row, so the card stack is never placed into a container sized to its own navigation controls.

At widths below the carousel's breakpoint the hero SHALL render exactly one featured course card in its place. At every width the hero SHALL present exactly one of the two presentations — carousel or single card — never both and never neither.

The hero's featured-course data SHALL be read through the cached server fetcher used by other server-rendered homepage data, so that the read participates in the framework data cache and honours on-demand revalidation.

#### Scenario: Hero carousel with featured courses available

- **WHEN** the homepage loads and featured courses are returned successfully
- **THEN** the hero carousel renders those courses using the existing course card presentation

#### Scenario: Card stack fits its container at every carousel width

- **WHEN** the homepage is rendered at 1280px, 1300px, 1440px and 1920px viewport widths
- **THEN** every rendered hero course card's right edge is less than or equal to the hero content container's right edge, and `document.documentElement.scrollWidth` equals the viewport width

#### Scenario: Exactly one course presentation below the carousel breakpoint

- **WHEN** the homepage is rendered at 440px, 768px and 1024px viewport widths
- **THEN** the hero renders a single featured course card and does not render the stacked carousel

#### Scenario: Carousel and horizontal hero row switch on together

- **WHEN** the homepage is rendered at the width immediately below the carousel's breakpoint and again at the breakpoint itself
- **THEN** the carousel is absent at the first width and present at the second, and at the second width the hero headline column and the carousel are laid out side by side rather than stacked

#### Scenario: Hero carousel with no featured courses

- **WHEN** the homepage loads and no featured courses are available
- **THEN** the hero renders its headline, search and accreditation content without a carousel region, and does not render an empty or partially built carousel shell

#### Scenario: Transient featured-course failure degrades to the rest of the hero

- **WHEN** the featured-course read fails or times out while the homepage is being server-rendered
- **THEN** the hero still renders its headline, search and accreditation content rather than failing the page, the failure is not persisted as an empty course list for the revalidation window, and a subsequent request that can reach the upstream renders the carousel
