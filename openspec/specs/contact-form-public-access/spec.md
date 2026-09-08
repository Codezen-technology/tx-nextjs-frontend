## Purpose

Ensures the contact form submission endpoint is accessible to anonymous (non-authenticated) users through the Next.js BFF proxy, matching the WordPress plugin's public permission model.

## Requirements

### Requirement: Contact form submission SHALL be publicly accessible

The BFF proxy for `POST /api/contact` SHALL NOT require an authenticated session. Anonymous visitors MUST be able to submit the contact form without logging in.

#### Scenario: Anonymous user submits contact form successfully

- **WHEN** an unauthenticated user POSTs valid contact form data (`first_name`, `email`, `message`) to `/api/contact`
- **THEN** the BFF proxies the request to WordPress without checking for an `access_token` cookie
- **AND** the WordPress response is returned to the client with the appropriate status code

#### Scenario: Anonymous user receives validation errors

- **WHEN** an unauthenticated user POSTs invalid contact form data (e.g. missing `first_name`) to `/api/contact`
- **THEN** the BFF proxies the request to WordPress
- **AND** the WordPress validation error response is returned to the client

### Requirement: Server-side contact page fetcher SHALL not log to console in production

The server-side service that fetches contact page content for SSR MUST NOT emit `console.log` output in production builds.

#### Scenario: Contact page loads without server-side logging

- **WHEN** the contact-us page is server-rendered
- **THEN** no `console.log` statements execute in the contact page service module

### Requirement: Frontend message max-length SHALL be documented

The frontend message character limit MUST be clearly documented and intentionally chosen relative to the backend limit.

#### Scenario: User sees character counter

- **WHEN** a user types in the message textarea on the contact form
- **THEN** a character counter displays the current length against the maximum allowed
