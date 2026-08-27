# faq-section Specification

## Purpose

Covers the FAQ accordion wherever it appears on the marketing site — its presentation against the measured design frames, and the keyboard and screen-reader behaviour a disclosure widget owes its users.

## Requirements

### Requirement: One FAQ presentation across the site

Every FAQ section SHALL be rendered by one component, so that the pages carrying an FAQ cannot drift apart. Two independent frames — the single-blog article and the help page — specify the same treatment, so the design is site-wide rather than per page.

#### Scenario: Two pages, one look

- **WHEN** the FAQ sections on `/help` and on a single blog post are compared
- **THEN** their container, dividers, question type, toggle icon and answer panel are the same

#### Scenario: A page adopting an FAQ

- **WHEN** a new page renders an FAQ
- **THEN** it uses the same component and inherits the presentation without restating it

### Requirement: The FAQ matches the measured frame

The FAQ SHALL carry the values measured from the design: a container filled with the secondary tint at half alpha, square-cornered and unbordered; rows divided by the neutral divider token; questions set in the body face at regular weight in the mid-neutral tone; a toggle icon of the measured size; and an open answer in an inset panel filled with the solid secondary tint.

#### Scenario: Container and dividers

- **WHEN** an FAQ section is rendered
- **THEN** its container carries the half-alpha secondary tint with square corners and no border
- **AND** each row is separated by the neutral divider token, not by the secondary tint

#### Scenario: Question and toggle

- **WHEN** a question row is rendered
- **THEN** the question is set at regular weight in the mid-neutral tone, not bold in the darkest one
- **AND** its toggle icon is the measured size

#### Scenario: Open answer

- **WHEN** a question is expanded
- **THEN** its answer sits in an inset panel filled with the solid secondary tint

### Requirement: The FAQ is operable by keyboard and announced correctly

Each question SHALL be a button that reports its expanded state, and each answer SHALL be associated with the question that controls it. The accordion SHALL be navigable by keyboard.

This is a requirement because the site previously had two FAQ implementations with different semantics; converging on the weaker one would have been a regression that no visual check would catch.

#### Scenario: Expanded state is announced

- **WHEN** a screen reader encounters a question
- **THEN** it is announced as a button with its expanded or collapsed state

#### Scenario: The answer is associated with its question

- **WHEN** a question is expanded
- **THEN** the answer region is associated with the question that controls it

#### Scenario: Keyboard navigation

- **WHEN** a user moves through the questions with the keyboard
- **THEN** focus moves between them and a question can be toggled without a pointer

### Requirement: Questions show a hover affordance

A question row SHALL change appearance on hover, on both the row and its toggle icon, including when it is the open row.

The design frames carry no hover state; this behaviour was established by an earlier accepted fix and is preserved so that a restyle does not silently remove it.

#### Scenario: Hovering a closed question

- **WHEN** the pointer rests on a closed question row
- **THEN** the row and its toggle icon both change appearance

#### Scenario: Hovering the open question

- **WHEN** the pointer rests on the question row that is currently open
- **THEN** it changes appearance too
