## ADDED Requirements

### Requirement: The catalogue fits its viewport at every supported breakpoint

At 1920, 1280 and 440 the `/all-courses` page SHALL render its content within the viewport width: the document's scrollable width SHALL NOT exceed the viewport width, and no in-flow element SHALL extend past the content column's end edge.

A decorative full-bleed surface that is clipped by its own container — the hero's pattern is the only one on this page — is not an in-flow element and is excluded.

The page fails this today at 440: the document measures 660 against a 440 viewport, because the filter rail keeps its desktop width beside the course column.

#### Scenario: Catalogue at 440

- **WHEN** `/all-courses` is rendered at a 440px viewport
- **THEN** the document's scrollable width equals the viewport width
- **AND** the page cannot be panned horizontally

#### Scenario: Catalogue at 1280 and 1920

- **WHEN** `/all-courses` is rendered at 1280 or at 1920
- **THEN** the document's scrollable width equals the viewport width
- **AND** the content column's horizontal geometry is the page grid's for that breakpoint, unchanged from before this change

### Requirement: The catalogue stacks below the desktop breakpoint

Below the breakpoint at which the filter rail and the course grid both fit, the catalogue SHALL present the filter and the course list as a single column, filter first. At and above that breakpoint the filter SHALL sit beside the course list as a rail, as it does today.

#### Scenario: Small viewport

- **WHEN** the catalogue is rendered below the desktop breakpoint
- **THEN** the filter occupies the full content width
- **AND** the course sections appear below it, each card at the full content width or in the grid that fits

#### Scenario: Desktop viewport

- **WHEN** the catalogue is rendered at or above the desktop breakpoint
- **THEN** the filter renders as a rail beside the course list, at the width it ships today
- **AND** the course grid keeps its existing column count for that breakpoint

### Requirement: The category filter is collapsed by default on small viewports

Below the desktop breakpoint the category filter SHALL render collapsed, behind a control that expands and collapses it, and that control SHALL communicate how many categories are currently selected. At and above the desktop breakpoint the filter SHALL render expanded with no control, and SHALL NOT be collapsible.

The catalogue serves seventeen categories on the deployed site and sixteen on the local backend; rendered open above the course list on a phone they push the first course card roughly a viewport-and-a-half down the page.

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
