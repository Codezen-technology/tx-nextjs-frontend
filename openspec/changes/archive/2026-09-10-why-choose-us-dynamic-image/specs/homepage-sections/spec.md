# homepage-sections delta spec — Why Choose Us image

## Modified Requirement: Why Choose Us section is a 4-item icon grid

The Why Choose Us section SHALL render exactly the icon+title+description items returned by its data source, in a grid layout — not the prior alternating title/bullets/gif/CTA panel format. The section SHALL also render a CMS-configurable image on the right side. When the backend returns a non-empty `image` URL in the `why` object, it SHALL be used. When unconfigured (empty string or missing), the section SHALL fall back to the static `images/why-choose-us.webp` asset.

#### Scenario: Why Choose Us renders with a configured image

- **WHEN** the homepage loads and the `why` section includes a non-empty `image` URL
- **THEN** the section renders that image on the right side

#### Scenario: Why Choose Us renders with no configured image

- **WHEN** the homepage loads and the `why` section `image` field is empty or missing
- **THEN** the section renders the static `images/why-choose-us.webp` fallback image
