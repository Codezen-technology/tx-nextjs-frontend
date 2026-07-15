## MODIFIED Requirements

### Requirement: Course card renders badges, price, and countdown

The shared course card component SHALL render: a badge pill for each entry in `badges` (with a fixed label per known badge key, except `bestseller` which is instead shown as a ribbon per the Top Seller requirement below), the sale price with the regular price struck through when `sale.is_on_sale` (or the price-comparison fallback) is true, and a synthetic recurring countdown when the course is on sale. The countdown period is a static 6 hours, computed purely from wall-clock time (`6h - (Date.now() mod 6h)`), independent of the API's `sale.sale_ends_at` value — it resets to 6:00:00 automatically every 6 hours and is identical across every card rendered at the same moment.

#### Scenario: Card for a course on sale

- **WHEN** a course card receives a course with `sale.is_on_sale: true` (or `originalPrice > price` as fallback)
- **THEN** the card shows the struck-through regular price, the sale price, and an "OFFER ENDS IN" countdown showing the time remaining until the next 6-hour wall-clock boundary, formatted `HH : MM : SS`

#### Scenario: Countdown reaches zero and recurs

- **WHEN** the wall-clock time crosses a 6-hour boundary while an on-sale course card is displayed
- **THEN** the displayed countdown resets to `06 : 00 : 00` and continues counting down again, without a page reload or any change to the underlying course/sale data

#### Scenario: Card for a course not on sale

- **WHEN** a course card receives a course with `sale.is_on_sale: false` (and no price-comparison fallback triggers it)
- **THEN** the card does not show a countdown, regardless of the current wall-clock time

#### Scenario: Card for a course with no badges

- **WHEN** a course card receives a course with an empty `badges` array
- **THEN** the card renders with no badge pills, with no layout gap left behind

## ADDED Requirements

### Requirement: Course card shows a rating and bookmark affordance

The shared course card component SHALL show a rating row (numeric average + star icon + review count) when `course.rating` is present, and SHALL show a decorative bookmark button unconditionally. The component SHALL NOT fabricate a rating value when `course.rating` is absent.

#### Scenario: Course with a rating and review count

- **WHEN** a course card receives a course with `rating: 4.5` and `ratingCount: 1326`
- **THEN** the card displays "4.5", a filled star icon, and "(1,326 Reviews)"

#### Scenario: Course with no rating

- **WHEN** a course card receives a course with `rating` undefined
- **THEN** the card renders no rating value and no fabricated placeholder number

#### Scenario: Bookmark button is present but non-functional

- **WHEN** any course card is rendered
- **THEN** a bookmark icon button is shown in the top-right of the content area, with no wishlist/persistence side effect wired to it in this change

### Requirement: Course card shows a Top Seller ribbon for bestseller courses

The shared course card component SHALL render a diagonal "TOP SELLER" ribbon on the top-right corner of the course image when `badges` includes `"bestseller"`, and SHALL omit the "Bestseller" text pill in that case to avoid duplicating the same claim.

#### Scenario: Course flagged as bestseller

- **WHEN** a course card receives a course with `badges: ["bestseller"]`
- **THEN** the card shows the "TOP SELLER" ribbon on the image and does not show a separate "Bestseller" text pill among the badge pills

#### Scenario: Course not flagged as bestseller

- **WHEN** a course card receives a course with `badges` not containing `"bestseller"`
- **THEN** no ribbon is rendered

### Requirement: Course card meta row and CTA match the updated visual design

The shared course card component SHALL render the modules-count and students-count meta items label-first (`"Modules {n}"`, `"Students {n}"`), a solid (non-dashed) divider above the price row, and a solid full-width pill CTA button reading "View Course" (no arrow glyph) linking to the course detail page.

#### Scenario: Meta row with modules and students data

- **WHEN** a course card receives a course with `modules_count: 25` and `studentsCount: 2000`
- **THEN** the meta row shows "Modules 25" and "Students 2k+"

#### Scenario: CTA button

- **WHEN** any course card is rendered
- **THEN** the CTA is a solid full-width pill button reading "View Course" that links to `/course/{slug}`
