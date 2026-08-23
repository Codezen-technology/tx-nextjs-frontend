## MODIFIED Requirements

### Requirement: Hero section

The single blog post page SHALL render a full-bleed hero band (dark navy-to-teal gradient background) containing the post title, supporting/excerpt text, category label, publish date, and a framed featured image, matching the Figma "Header section" layout at desktop, laptop, tablet, and mobile breakpoints.

The hero is the featured image's **only** home on the page. The article column below SHALL NOT repeat it — in `6015:127141` the rich-text column opens with text, and its single image sits inline further down as part of the post's own content.

#### Scenario: Post has a featured image

- **WHEN** a blog post with a featured image is requested
- **THEN** the hero renders the title, category, date, and the featured image in a white-bordered frame beside the text content on desktop/laptop, and stacked above the text on tablet/mobile

#### Scenario: Post has no featured image

- **WHEN** a blog post without a featured image is requested
- **THEN** the hero still renders title, category, and date without producing a broken image or empty bordered frame

#### Scenario: The image is not repeated below

- **WHEN** a post with a featured image is rendered
- **THEN** no element in the article column uses that image's source
