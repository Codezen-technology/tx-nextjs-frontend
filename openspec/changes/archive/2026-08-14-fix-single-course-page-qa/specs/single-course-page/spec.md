## Purpose

Defines the composition and interaction contract for the public single-course page
(`/course/[slug]`) — what the page shows, what it deliberately does not show, and which
of its controls must give the user a visible response before they commit to a click.

## ADDED Requirements

### Requirement: The course page shows no visual breadcrumb trail

The single-course page SHALL NOT render a visible breadcrumb navigation bar. The page
SHALL continue to emit `BreadcrumbList` JSON-LD, because the structured data is consumed
by search engines rather than displayed, and removing it would be an SEO regression
unrelated to the visual defect.

#### Scenario: No breadcrumb bar is painted

- **WHEN** the single-course page is rendered at any of 1920, 1280 or 440
- **THEN** no element with an accessible breadcrumb role or label is present in the
  document

#### Scenario: Structured data survives the removal

- **WHEN** the page's JSON-LD blocks are parsed
- **THEN** one of them is a `BreadcrumbList` describing Home → Courses → category →
  course

### Requirement: The curriculum lists lectures without durations

The course-curriculum section SHALL present sections and lectures without any duration
or hours value — not in the section-count summary line, not on a section header, and not
on an individual lecture row. Lecture counts, preview badges and section titles are
unaffected.

#### Scenario: No duration on any curriculum surface

- **WHEN** the curriculum section is rendered with every section expanded
- **THEN** no text matching a duration format (for example `2h 30m`, `45 min`,
  `3 hours`) appears anywhere within it

#### Scenario: Lecture counts are retained

- **WHEN** a curriculum section header is rendered
- **THEN** it still states how many lectures that section contains

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

- **WHEN** the pointer moves over the "For me" tab and then the "For teams" tab, in
  either selection state
- **THEN** each tab's computed background or colour differs from its resting value

### Requirement: Section headings on the course page use one heading token

Every section heading on the single-course page SHALL render at the same token — SUSE,
32px, bold, 1.2 line-height — including the "Related Courses" heading and including the
heading rendered in a section's loading state. A section's loading placeholder SHALL NOT
render its heading at a different size or weight from its loaded state.

#### Scenario: Related Courses matches its peers

- **WHEN** the computed font family, size, weight and line-height of the "Related
  Courses" heading are compared with the "Course Curriculum" heading
- **THEN** all four values are equal

#### Scenario: The loading state does not change the heading

- **WHEN** the related-courses section is rendered in its loading state
- **THEN** its heading's computed size and weight equal those of the loaded state

### Requirement: Icon controls meet a minimum visibility threshold

Arrow, chevron and list-marker glyphs on the single-course page SHALL render at a
contrast ratio of at least **3:1** against their own background, the WCAG AA floor for
non-text graphical objects.

#### Scenario: A chevron against its row background

- **WHEN** a curriculum section-header chevron's computed colour and the header's
  computed background are read
- **THEN** their contrast ratio is at least 3:1

### Requirement: A rating is rendered only when the course has one

No surface SHALL display a rating value that is not present in the course data. A
course with no rating SHALL render no rating on its card and none in its detail header —
a placeholder, a default, or a value derived from anything other than the course's own
rating field is prohibited, because a rating is a factual claim about other buyers'
opinions.

Where a course does carry a rating, the card and the detail header SHALL present the
same number at every breakpoint, including 440.

#### Scenario: A course with no rating

- **WHEN** a course whose rating field is absent or zero is rendered on a listing card
  and on its detail page
- **THEN** neither surface displays a numeric rating

#### Scenario: A course with a rating, at 440

- **WHEN** a course that carries a rating is viewed at 440 on a listing page and on its
  detail page
- **THEN** the numeric rating rendered in both places is the same string

### Requirement: Body copy wraps at word boundaries on mobile

Prose and bullet-list body copy on the single-course page SHALL wrap at word boundaries
at 440. No list item or paragraph SHALL break a word mid-token or leave a line ended
before its available width is used.

#### Scenario: A bullet list at 440

- **WHEN** a bullet list in the page's body copy is rendered at a 440 viewport
- **THEN** no line within it terminates before the list item's content width, other
  than the last line of that item
