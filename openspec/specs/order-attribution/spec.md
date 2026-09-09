# order-attribution Specification

## Purpose

Ties every order placed through the headless frontend back to the visit that produced it — the campaign, search engine or referring site a shopper arrived from, and the page they landed on. Defines how that context is captured while the shopper still has a browser context, how it travels with the order to WooCommerce, and what the WooCommerce admin shows as a result, so marketing spend can be attributed to revenue without WordPress rendering any page.

## Requirements

### Requirement: Visit attribution captured on the frontend

The frontend SHALL derive attribution for every page navigation from the request's query string and referrer, and SHALL persist it across the visit. Capture MUST NOT depend on client-side JavaScript running, and the persisted values MUST NOT be readable by browser scripts.

#### Scenario: Campaign arrival

- **WHEN** a visitor arrives on any page with `utm_source`, `utm_medium` and `utm_campaign` in the query string
- **THEN** the frontend records those values, the landing page, and the referrer for the visit
- **AND** the record survives subsequent navigation within the site

#### Scenario: Capture without JavaScript

- **WHEN** a visitor with JavaScript disabled, or with a content blocker active, arrives with campaign parameters
- **THEN** attribution is still recorded

#### Scenario: Not exposed to page scripts

- **WHEN** a script running on the page attempts to read the persisted attribution
- **THEN** the value is unavailable to it

#### Scenario: Corrupt persisted state

- **WHEN** a request arrives carrying persisted attribution the frontend cannot decode
- **THEN** the frontend discards it, starts a fresh record from the current request, and serves the page normally

### Requirement: Traffic source classification

The frontend SHALL classify each arrival into exactly one source type. Explicit campaign parameters SHALL take precedence over paid click identifiers, which SHALL take precedence over the referrer. A referrer from this site's own host SHALL be treated as no referrer.

#### Scenario: Explicit campaign

- **WHEN** any `utm_*` parameter is present
- **THEN** the source type is `utm` and every supplied parameter value is recorded unchanged
- **AND** a `utm_source` or `utm_medium` the arrival omitted takes the direct-arrival default, matching the convention WooCommerce itself uses

#### Scenario: Paid click identifier without campaign parameters

- **WHEN** the arrival carries a Google, Meta or Microsoft advertising click identifier and no `utm_*` parameter
- **THEN** the source type is `utm`, the source is the corresponding ad platform, and the medium is `cpc`

#### Scenario: Search engine referrer

- **WHEN** the referrer is a recognised search engine and no campaign parameter or click identifier is present
- **THEN** the source type is `organic`, the source is the engine's name, and the medium is `organic`

#### Scenario: External referrer

- **WHEN** the referrer is an external site that is not a recognised search engine
- **THEN** the source type is `referral`, the source is the referring hostname, and the medium is `referral`

#### Scenario: Direct arrival

- **WHEN** there is no referrer, the referrer is this site, or the referrer cannot be parsed
- **THEN** the source type is `typein` and the source and medium take the direct-arrival defaults

### Requirement: First-touch and session lifecycle

The frontend SHALL track first-touch attribution and current-session attribution independently. First-touch SHALL be recorded once and never overwritten. A session SHALL end after a period of inactivity, and a new campaign arriving mid-session SHALL start a new session. Internal navigation SHALL NOT start a new session or alter the recorded campaign.

#### Scenario: First touch preserved across campaigns

- **WHEN** a visitor first arrives from one campaign, then returns later from a different one
- **THEN** first-touch still reports the original campaign
- **AND** the session reports the newer campaign

#### Scenario: Internal navigation

- **WHEN** a visitor moves between pages on this site
- **THEN** the session's campaign, landing page and start time are unchanged
- **AND** the session's page count increases

#### Scenario: Session expiry

- **WHEN** a visitor returns after the inactivity period and arrives from a search engine
- **THEN** a new session begins with the new source and its own landing page and start time
- **AND** the visitor's lifetime session count increases

#### Scenario: Campaign change mid-session

- **WHEN** a visitor with a live session arrives on a page carrying a different campaign
- **THEN** a new session begins with the new campaign

### Requirement: Attribution stored on every order

Every order created through the frontend SHALL carry the visitor's attribution to WooCommerce, in the same request that creates the order. This SHALL apply to all order-creating paths, including cart checkout, direct purchase, and payment of a previously created order. Attribution SHALL be taken from the frontend's own persisted record and MUST NOT be accepted from a request body.

#### Scenario: Cart checkout

- **WHEN** a visitor with recorded attribution completes checkout from the cart
- **THEN** the resulting WooCommerce order carries that visit's source type, campaign parameters, landing page, session start time, page count, session count and user agent

#### Scenario: Direct purchase

- **WHEN** a visitor with recorded attribution buys a single item without using the cart
- **THEN** the resulting order carries the same attribution, including the device type derived from the user agent

#### Scenario: Payment of an existing order

- **WHEN** a visitor pays an order that was created earlier
- **THEN** attribution is sent with the payment request
- **AND** if the order already carries attribution, the existing values are kept

#### Scenario: Attribution not accepted from the client

- **WHEN** a request to create an order includes attribution values in its body
- **THEN** those values are ignored and the frontend's own record is used

#### Scenario: Visitor with no recorded attribution

- **WHEN** an order is created for a visitor whose attribution record is absent
- **THEN** the order is created exactly as it would have been before this capability existed

### Requirement: Origin visible in the WooCommerce admin

Stored attribution SHALL be readable through WooCommerce's existing order Origin column, order edit screen and Analytics reports, without any change to WordPress.

#### Scenario: Campaign order

- **WHEN** an administrator views the orders list for an order attributed to a campaign whose source is `newsletter`
- **THEN** the Origin column reads `Source: Newsletter`

#### Scenario: Organic order

- **WHEN** an administrator views the orders list for an order attributed to organic Google traffic
- **THEN** the Origin column reads `Organic: Google`

#### Scenario: Direct order

- **WHEN** an administrator views the orders list for a directly attributed order
- **THEN** the Origin column reads `Direct`

#### Scenario: Attribution reporting

- **WHEN** an administrator filters WooCommerce Analytics by attribution
- **THEN** orders placed through the headless frontend appear under their recorded source

### Requirement: Third-party analytics plugin receives the same attribution

Where the store runs an analytics plugin that records its own copy of visit
attribution on the order, and that plugin can be supplied the values without
modifying it, the frontend SHALL send them alongside its own. This SHALL be
severable: removing it MUST leave every other requirement in this capability
satisfied.

#### Scenario: Plugin metabox populated

- **WHEN** an order is placed by a visitor with recorded attribution
- **THEN** the plugin's own order record holds the real landing page, traffic source and campaign
- **AND** not the placeholder it substitutes when a request carries no browser context

#### Scenario: Payment of an existing order does not erase it

- **WHEN** an order that already carries plugin attribution is paid in a later request
- **THEN** the values are still present afterwards

#### Scenario: Visitor with no recorded attribution

- **WHEN** an order is placed by a visitor whose attribution record is absent
- **THEN** no plugin parameters are sent and the order is placed exactly as it would have been

### Requirement: Attribution never blocks a purchase

Attribution SHALL be best-effort. No failure to derive, persist, transmit or store it may fail an order, fail a payment, delay a shopper's response, or change any route's response shape.

#### Scenario: Attribution rejected by WooCommerce

- **WHEN** WooCommerce rejects or ignores the attribution sent with an order
- **THEN** the order is still created and paid, and the shopper sees the normal confirmation

#### Scenario: Response shape unchanged

- **WHEN** any order-creating request completes
- **THEN** its response body and status are the same as they were before this capability existed
