# all-courses-catalogue Specification

## Purpose

Defines how the `/all-courses` catalogue page presents each course category's section — specifically how CMS-supplied category names are turned into readable call-to-action labels, so page copy stays correct whatever the CMS names a category.

## Requirements

### Requirement: Category call-to-action labels name the word "course" exactly once

Every "view all" call to action rendered for a course category SHALL contain the word `course` or `courses` exactly once, regardless of whether the CMS-supplied category name already ends in that word.

The site's course categories are editorial content: 18 of the 20 categories the API currently serves are named with a trailing `Courses` (for example `Care Certificate Courses`), and two are not (`Groupon`). A label composed by appending the word to the raw name therefore duplicates it for most categories and reads correctly for the rest.

#### Scenario: Category name already ends in "Courses"

- **WHEN** a category section is rendered for a category named `Care Certificate Courses`
- **THEN** each of its call-to-action labels reads `View all Care Certificate courses`
- **AND** the word `courses` appears exactly once in the label

#### Scenario: Category name ends in the singular "Course"

- **WHEN** a category section is rendered for a category named `Fire Marshal Course`
- **THEN** the trailing singular is stripped as well, and the label reads `View all Fire Marshal courses`

#### Scenario: Category name carries no course suffix

- **WHEN** a category section is rendered for a category named `Groupon`
- **THEN** the name is used unchanged and the label reads `View all Groupon courses`

#### Scenario: The suffix is the whole name

- **WHEN** a category is named only `Courses`
- **THEN** stripping the suffix would leave nothing, so the name is used unchanged and the label reads `View all Courses`
- **AND** the word still appears exactly once

#### Scenario: Every call to action on the catalogue page

- **WHEN** `/all-courses` is rendered with the live catalogue
- **THEN** no "view all" call to action anywhere on the page contains the word `course` or `courses` more than once

### Requirement: Category name casing is preserved

A call-to-action label SHALL reproduce the CMS-supplied category name's own casing for the part of the name it keeps. The catalogue's names include acronyms (`HACCP`) that a case transform would corrupt, and category names are editorial content the frontend does not own.

#### Scenario: Acronym in the category name

- **WHEN** a category section is rendered for a category named `HACCP Courses`
- **THEN** the label reads `View all HACCP courses`, not `View all haccp courses`

### Requirement: Each category section offers two equivalent entry points

A category section SHALL render its "view all" call to action twice — once inline beside the section heading and once as a button below the card grid — and both SHALL carry the same label and link to the same category page.

#### Scenario: Both call-to-action surfaces agree

- **WHEN** a category section is rendered
- **THEN** the heading-level link and the button below the grid show the same label text and point at the same `/course-cat/<slug>` destination
