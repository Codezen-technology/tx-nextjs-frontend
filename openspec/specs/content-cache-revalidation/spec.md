# content-cache-revalidation Specification

## Purpose

Lets WordPress purge this frontend's cached copies of its own content the moment an editor saves, instead of leaving each page stale until its TTL expires. Defines the authenticated purge endpoint's contract — what it accepts, what it refuses, and how it degrades when unconfigured — so a content edit is visible in seconds without a deploy.

## Requirements

### Requirement: Authenticated on-demand purge endpoint

The frontend SHALL expose an HTTP endpoint that purges named cache entries on request. The endpoint SHALL accept `POST` only, SHALL require the caller to present the shared revalidation secret, and SHALL never be served from a cache itself.

#### Scenario: Valid purge request

- **WHEN** a `POST` arrives carrying the correct shared secret and a body naming one or more known cache tags
- **THEN** the frontend purges the cached data behind each named tag
- **AND** responds `200` with the list of tags it purged
- **AND** the next request for a page built from that data reads fresh content from WordPress

#### Scenario: Wrong or missing secret

- **WHEN** a request presents no secret, an empty secret, or a secret that does not match
- **THEN** the frontend responds `401` with an opaque error and purges nothing

#### Scenario: Non-POST method

- **WHEN** the endpoint receives `GET`, `PUT`, `DELETE`, or any method other than `POST`
- **THEN** the frontend responds `405` and purges nothing

#### Scenario: Response is never cached

- **WHEN** any request reaches the endpoint
- **THEN** the response carries no-store caching semantics and is not served from a CDN or data cache on a later identical request

### Requirement: Fail closed when unconfigured

An unset shared secret SHALL disable the endpoint entirely rather than disabling the check. A deployment that omits the secret MUST NOT expose an unauthenticated cache-purge endpoint.

#### Scenario: Secret not configured on the deployment

- **WHEN** the shared secret is unset or blank in the environment and any request arrives — including one presenting a blank secret
- **THEN** the frontend responds `401` and purges nothing

#### Scenario: Site still serves content when unconfigured

- **WHEN** the shared secret is unset
- **THEN** every page continues to render normally, with cached content refreshing on its own TTL

### Requirement: Secret comparison leaks nothing

Rejections SHALL be indistinguishable from one another, and the secret comparison SHALL NOT reveal the secret through timing.

#### Scenario: Rejection reasons are indistinguishable

- **WHEN** a request is rejected for a wrong secret, a missing secret, or an unconfigured deployment
- **THEN** the status code and response body are identical in all three cases
- **AND** neither the expected secret, its length, nor the reason for rejection appears in the response

#### Scenario: Comparison time does not depend on the presented value

- **WHEN** a caller submits many candidate secrets of the same length
- **THEN** the time spent comparing does not vary with how many leading characters are correct

### Requirement: Only known cache tags may be purged

The endpoint SHALL accept a tag only when it is a registered static tag or matches a registered dynamic-tag pattern, and SHALL reject the request otherwise. A tag that is not recognised MUST NOT be forwarded to the cache layer.

#### Scenario: Known static tag

- **WHEN** an authenticated request names a registered tag such as the site-settings tag
- **THEN** that tag is purged and reported in the response

#### Scenario: Known dynamic tag

- **WHEN** an authenticated request names a per-entity tag matching a registered pattern, such as a single course, blog post, or page identified by its slug
- **THEN** that tag is purged and reported in the response

#### Scenario: Unknown tag

- **WHEN** an authenticated request names a tag that is neither registered nor matches a registered pattern
- **THEN** the frontend responds `400`, purges nothing at all — including any valid tags in the same request — and names the rejected tag so the caller can fix its mapping

#### Scenario: Malformed body

- **WHEN** an authenticated request carries no body, a body that is not valid JSON, or a body whose tag list is missing, empty, or not a list of strings
- **THEN** the frontend responds `400` and purges nothing

#### Scenario: Oversized request

- **WHEN** an authenticated request names more tags than the endpoint's per-request limit
- **THEN** the frontend responds `400` and purges nothing

### Requirement: Purge is idempotent and safe to retry

Purging SHALL be safe to repeat. The endpoint SHALL report success for a valid, registered tag whether or not anything was cached under it.

#### Scenario: Repeated purge of the same tag

- **WHEN** the same valid purge request is sent several times in a row
- **THEN** every response is `200` with the same tag list, and no error is raised for the entries already purged

#### Scenario: Tag with nothing cached under it

- **WHEN** a valid registered tag is purged while nothing is cached under it
- **THEN** the response is `200` and the tag is reported as purged

### Requirement: Site settings refresh promptly without a purge

Cached site settings — the payload carrying site identity, feature flags, and the sitewide floating bar — SHALL become stale within minutes rather than an hour, so a missed or unconfigured purge delays an editor's change by minutes at worst.

#### Scenario: Settings edit with no purge configured

- **WHEN** an editor changes a site setting and no purge call reaches the frontend
- **THEN** the change is visible to visitors within the settings freshness window, without a deploy

#### Scenario: Settings edit with purge configured

- **WHEN** an editor changes a site setting and the WordPress hook purges the settings tag
- **THEN** the change is visible on the next page load

#### Scenario: Settings upstream unavailable

- **WHEN** the settings endpoint is unreachable or times out while refreshing
- **THEN** pages continue to render using the frontend's fallback settings, and no error page is shown to visitors

### Requirement: WordPress purge call contract

WordPress SHALL notify the frontend when content the frontend caches is saved. The call SHALL be non-blocking with respect to the editor's save, and its failure SHALL NOT surface as a save failure.

> **Ownership:** this requirement binds the `wp-lms-backend-rest-api` plugin (handed over as `wp-hook-spec.md` in the originating change), not this repository. It is recorded here because it is the other half of the purge endpoint's contract; this repo can neither implement nor test it, and its scenarios are verified on the backend side.

#### Scenario: Editor saves a watched option

- **WHEN** an administrator saves a WordPress option the frontend caches, such as the floating-bar or site-settings options
- **THEN** WordPress sends a purge request naming the cache tags mapped to that option

#### Scenario: Frontend unreachable during save

- **WHEN** the purge request fails, times out, or returns an error status
- **THEN** the WordPress save still completes and reports success to the editor
- **AND** the frontend's cached copy refreshes on its own TTL instead

#### Scenario: Option saved without a real change

- **WHEN** an option is written with a value identical to the one already stored
- **THEN** no purge request is sent
