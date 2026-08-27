# cms-image-resilience Specification

## Purpose

Defines how the frontend renders images whose source comes from WordPress, so
that a missing, mistyped, or unreachable image never collapses a section's
layout or leaves a broken graphic on a public page.

## Requirements

### Requirement: A CMS-sourced image occupies its reserved box regardless of load outcome

Any image rendered from a CMS-supplied URL SHALL occupy the layout box the design
reserves for it from first paint, and SHALL retain that box whether the source
loads, fails, or is still loading. Sizing SHALL NOT depend on the source's
intrinsic dimensions, because an image that fails to decode reports an intrinsic
size of zero and would collapse the element and the surrounding layout with it.

#### Scenario: Source loads successfully

- **WHEN** a page renders a CMS image whose URL resolves to a decodable image
- **THEN** the rendered element has a non-zero width and height matching the reserved box, and no layout shift occurs as the image finishes loading

#### Scenario: Source returns a 404 or fails to decode

- **WHEN** a page renders a CMS image whose URL returns an error status or is not a decodable image
- **THEN** the surrounding section retains its designed dimensions and the page does not reflow around a zero-height element

#### Scenario: Source is absent from the API response

- **WHEN** the CMS field for an image is null, empty, or missing
- **THEN** the page renders without that image and without an empty framed container in its place

### Requirement: A failed CMS image degrades to a fallback or to absence

When a CMS image cannot be displayed, the frontend SHALL render a designated
fallback image if the surface defines one, and SHALL otherwise render nothing in
that slot. It SHALL NOT render the browser's broken-image glyph, an empty bordered
frame, or a blank box the size of the missing image. A fallback that itself fails
SHALL NOT cause a repeated load attempt.

#### Scenario: Surface defines a fallback

- **WHEN** a CMS image fails to load on a surface that defines a fallback asset
- **THEN** the fallback asset is rendered in its place, at the same reserved dimensions

#### Scenario: Surface defines no fallback

- **WHEN** a CMS image fails to load on a surface with no fallback asset
- **THEN** nothing is rendered in that slot and no broken-image indicator is shown

#### Scenario: Fallback also fails

- **WHEN** both the CMS source and its fallback fail to load
- **THEN** nothing is rendered in that slot and the frontend does not retry in a loop

### Requirement: Content gaps are distinguishable from component defects

Where a CMS image fails because the stored path does not exist on the frontend
origin, the failure SHALL be recorded as a content gap against the CMS field
rather than treated as a frontend defect. The frontend SHALL continue to satisfy
the two requirements above while such a gap is open, so a public page is never
visibly broken by unresolved content.

#### Scenario: CMS stores a path with no corresponding asset

- **WHEN** a CMS image field holds a site-relative path that returns 404 on the frontend origin
- **THEN** the affected page still renders correctly per the fallback rules, and the offending field and path are recorded for correction in the CMS

### Requirement: Image rendering is verified at every reported breakpoint

Each public surface that renders CMS images SHALL be covered by an automated
check at 1920, 1280 and 440 that asserts, for every such image, both that the
source decodes and that the element's layout box is non-zero. Asserting only one
of the two SHALL NOT be sufficient, because the two failure modes are independent:
a decodable source can still be collapsed by its sizing, and a correctly sized box
can still be empty.

#### Scenario: Regression check runs at all three widths

- **WHEN** the end-to-end suite runs against a covered surface
- **THEN** each CMS image on that surface is asserted to have decoded and to have a non-zero bounding box, at 1920, 1280 and 440

#### Scenario: An image regresses to a collapsed box

- **WHEN** a change causes a CMS image to render with zero width or height
- **THEN** the automated check for that surface fails, naming the surface and the breakpoint
