# legal-content-links Specification

## Purpose

Governs how links inside long-form legal copy — privacy policy, terms, cancellations — are presented, so that contact details are both readable and recognisable as links.

## Requirements

### Requirement: Links in legal content meet WCAG AA contrast

A link rendered inside long-form legal content SHALL present a contrast ratio of at least **4.5:1** against the background it is painted on, measured from the colours as rendered.

#### Scenario: A contact link in the privacy policy

- **WHEN** the email and telephone links in the privacy policy are rendered and their computed colour and background are read
- **THEN** the contrast ratio between them is at least 4.5:1

### Requirement: Links in legal content are identifiable without colour

A link inside long-form legal content SHALL be distinguishable from the surrounding body text by something other than colour alone — an underline or equivalent non-colour cue.

Colour alone fails users who cannot perceive the difference, and these links carry the only contact route the document offers.

#### Scenario: A link among body text

- **WHEN** a link inside legal content is rendered
- **THEN** it carries a non-colour cue distinguishing it from the surrounding text
