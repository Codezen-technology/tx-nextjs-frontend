# blog-single-page Specification

## Purpose

TBD - created by syncing change blog-single-page-redesign. Update Purpose after archive.

## Requirements

### Requirement: Hero section

The single blog post page SHALL render a full-bleed hero band (dark navy-to-teal gradient background) containing the post title, supporting/excerpt text, category label, publish date, and a framed featured image, matching the Figma "Header section" layout at desktop, laptop, tablet, and mobile breakpoints.

#### Scenario: Post has a featured image

- **WHEN** a blog post with a featured image is requested
- **THEN** the hero renders the title, category, date, and the featured image in a white-bordered frame beside the text content on desktop/laptop, and stacked above the text on tablet/mobile

#### Scenario: Post has no featured image

- **WHEN** a blog post without a featured image is requested
- **THEN** the hero still renders title, category, and date without producing a broken image or empty bordered frame

### Requirement: Three-column reading layout on desktop and laptop

On viewports at or above the laptop breakpoint, the page SHALL present a three-column layout: a sticky Table of Contents column on the left, the article body in the center column, and a sticky share/promo column on the right.

#### Scenario: Desktop viewport

- **WHEN** the page is viewed at desktop width (≥1280px)
- **THEN** the TOC, article, and share/promo card render as three independently positioned columns, with the TOC and share/promo card remaining visible (sticky) as the article scrolls

#### Scenario: Tablet or mobile viewport

- **WHEN** the page is viewed below the laptop breakpoint
- **THEN** the TOC, article body, and share/promo card render as a single stacked column in TOC → article → share/promo order, none of them sticky

### Requirement: Table of Contents active-section highlighting

The Table of Contents SHALL visually distinguish the currently in-view article section using a tinted background, left accent border, and accent text color, and SHALL number each entry sequentially.

#### Scenario: User scrolls into a section

- **WHEN** the reader scrolls the article so a heading enters the viewport's active-tracking zone
- **THEN** the corresponding TOC entry gains the `secondary-50` background, a `secondary-500` left border, and `secondary-500` text color, and any previously active entry loses that styling

#### Scenario: User clicks a TOC entry

- **WHEN** the reader clicks a Table of Contents entry
- **THEN** the page scrolls smoothly to the corresponding heading in the article

### Requirement: Share card

The page SHALL render a share card offering a "Copy link" action and social sharing icon buttons, positioned in the right rail above or below a promotional block per the Figma design.

#### Scenario: Copy link

- **WHEN** the reader clicks "Copy link"
- **THEN** the current post's canonical URL is written to the clipboard and the user receives visible confirmation (e.g., button label or toast changes to indicate success)

#### Scenario: Social share icon

- **WHEN** the reader clicks a social share icon
- **THEN** a share flow/link for that platform opens with the post's URL and title pre-filled

### Requirement: Article prose supports tables, dot-marker lists, and FAQ content

The article body renderer SHALL style WP-authored `<table>` elements with bordered cells and a shaded header row, style `<ul>` list items with a small dot marker, and render FAQ-style content as an expandable accordion when structured FAQ data is available, or as styled static Q&A content otherwise.

#### Scenario: Post body contains a data table

- **WHEN** a post's HTML content includes a `<table>` element
- **THEN** the rendered table shows a shaded, bold header row and bordered cells consistent with the Figma salary-table example, without any layout overflow on narrow viewports

#### Scenario: Post body contains a bulleted list

- **WHEN** a post's HTML content includes a `<ul>` list
- **THEN** each list item renders with a small circular marker aligned to the Figma spacing, instead of the browser default bullet

#### Scenario: Post has structured FAQ content

- **WHEN** a post provides structured FAQ question/answer pairs
- **THEN** each FAQ item renders collapsed by default with a "+" icon, expands to show the answer and switches to a "−" icon when clicked, and only reflects the clicked item's state (other items are unaffected)

### Requirement: Related Courses section

The page SHALL render a "Related Courses" section between the article and the "More Blogs" section, showing a 4-up grid of course cards.

#### Scenario: Courses are available

- **WHEN** the related-courses data source returns at least one course
- **THEN** up to 4 course cards render using the existing `CourseCard` component with its standard image, title, price, and metadata

#### Scenario: No courses available

- **WHEN** the related-courses data source returns zero courses
- **THEN** the Related Courses section is omitted entirely rather than rendering an empty heading or grid

### Requirement: Related Blogs section shows four posts

The "More Blogs" section SHALL display up to 4 other blog posts (excluding the current post) using the existing blog card component.

#### Scenario: More than 4 other posts exist

- **WHEN** the blog has more than 4 posts besides the current one
- **THEN** exactly 4 are shown, excluding the current post

#### Scenario: Fewer than 4 other posts exist

- **WHEN** the blog has fewer than 4 other posts
- **THEN** all available other posts are shown and no placeholder cards fill the remaining slots
