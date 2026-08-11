## MODIFIED Requirements

### Requirement: Photographic image fields default to empty

The three commitment-block images and five team-section photos SHALL be ACF fields with no default value — they SHALL be null/empty in the API response until an admin uploads one. The frontend SHALL render a neutral placeholder in place of any unset image, matching the page's existing placeholder pattern, rather than a broken image or omitted layout.

An image field that is set but whose URL cannot be displayed SHALL be treated the same way as an unset one: the frontend SHALL render the placeholder rather than a broken graphic, an empty framed container, or a collapsed element, and the surrounding layout SHALL keep its designed dimensions. This covers a stored path that returns 404, an unreachable host, and a response that is not a decodable image.

#### Scenario: Fresh install has no images

- **WHEN** `GET /lms-backend/v1/about/page` is called on a fresh install
- **THEN** every commitment block's `image` and every team photo slot is `null`, and the frontend renders its placeholder graphic in each of those slots

#### Scenario: Admin uploads a commitment-block image

- **WHEN** an admin uploads an image to the first commitment block ("What We Offer?") and saves
- **THEN** subsequent responses return a non-null `image` URL for that block, and the frontend renders the real image instead of the placeholder

#### Scenario: A stored image URL cannot be loaded

- **WHEN** an image field holds a URL that returns an error status or is not a decodable image
- **THEN** the frontend renders the placeholder in that slot, the block keeps its designed dimensions, and no broken-image indicator is shown

#### Scenario: About Us page is checked at the reported breakpoints

- **WHEN** the end-to-end suite loads `/about-us` at 1920, 1280 and 440
- **THEN** every image on the page has decoded and has a non-zero bounding box, or has been replaced by the placeholder
