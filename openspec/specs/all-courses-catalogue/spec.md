# all-courses-catalogue Specification

## Purpose

Defines how the `/all-courses` catalogue page presents its categories — how CMS-supplied category names are turned into readable call-to-action labels, so page copy stays correct whatever the CMS names a category, and how the catalogue lays itself out across breakpoints so the page is usable on a phone as well as a desktop.

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

### Requirement: The catalogue fits its viewport at every supported breakpoint

At 1920, 1280 and 440 the `/all-courses` page SHALL render its content within the viewport width: the document's scrollable width SHALL NOT exceed the viewport width, and no in-flow element SHALL extend past the content column's end edge.

A decorative full-bleed surface that is clipped by its own container — the hero's pattern is the only one on this page — is not an in-flow element and is excluded.

#### Scenario: Catalogue at 440

- **WHEN** `/all-courses` is rendered at a 440px viewport
- **THEN** the document's scrollable width equals the viewport width
- **AND** the page cannot be panned horizontally

#### Scenario: Catalogue at 1280 and 1920

- **WHEN** `/all-courses` is rendered at 1280 or at 1920
- **THEN** the document's scrollable width equals the viewport width
- **AND** the content column's horizontal geometry is the page grid's for that breakpoint

### Requirement: The catalogue stacks below the desktop breakpoint

Below the breakpoint at which the filter rail and the course grid both fit, the catalogue SHALL present the filter and the course list as a single column, filter first. At and above that breakpoint the filter SHALL sit beside the course list as a rail.

#### Scenario: Small viewport

- **WHEN** the catalogue is rendered below the desktop breakpoint
- **THEN** the filter occupies the full content width
- **AND** the course sections appear below it, each card at the full content width or in the grid that fits

#### Scenario: Desktop viewport

- **WHEN** the catalogue is rendered at or above the desktop breakpoint
- **THEN** the filter renders as a rail beside the course list
- **AND** the course grid keeps its column count for that breakpoint

### Requirement: The category filter is collapsed by default on small viewports

Below the desktop breakpoint the category filter SHALL render collapsed, behind a control that expands and collapses it, and that control SHALL communicate how many categories are currently selected. At and above the desktop breakpoint the filter SHALL render expanded with no control, and SHALL NOT be collapsible.

The catalogue serves seventeen categories on the deployed site; rendered open above the course list on a phone they push the first course card roughly a viewport-and-a-half down the page.

#### Scenario: Small viewport, no filters active

- **WHEN** the catalogue is rendered below the desktop breakpoint and no category is selected
- **THEN** the category list is not visible
- **AND** a control labelled for the filter is visible, reporting no active selection

#### Scenario: Small viewport, expanding the filter

- **WHEN** a user activates the filter control
- **THEN** the category list becomes visible with every category and its course count
- **AND** activating the control again hides the list

#### Scenario: Small viewport, filters active

- **WHEN** one or more categories are selected below the desktop breakpoint
- **THEN** the control reports the number of selected categories, whether the list is visible or not

#### Scenario: Desktop viewport

- **WHEN** the catalogue is rendered at or above the desktop breakpoint
- **THEN** the category list is visible without any interaction
- **AND** no expand/collapse control is present

### Requirement: The catalogue scrolls to results only on a filter change

The catalogue SHALL move the viewport to the course results only in response to a user changing the selected categories. First render SHALL leave the viewport where the browser put it.

Scrolling on mount lands a visitor inside the card grid with the hero and page heading above the fold, and on a small viewport with no page heading in view at all.

#### Scenario: First render

- **WHEN** `/all-courses` is loaded
- **THEN** the viewport stays at the top of the document
- **AND** the hero is visible

#### Scenario: A category is selected

- **WHEN** a user selects or deselects a category
- **THEN** the viewport moves to the start of the course results

#### Scenario: Restoring a scroll position

- **WHEN** a browser restores a scroll position on back-navigation to the catalogue
- **THEN** the catalogue does not override it
