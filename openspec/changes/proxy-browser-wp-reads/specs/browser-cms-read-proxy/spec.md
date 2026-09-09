## Purpose

Guarantees that a visitor's browser never reads WordPress content across origins, so content sections cannot go blank because the CMS host's bot protection answered with a challenge page that carries no CORS headers. Defines the read-proxy's contract — which reads it accepts, which it refuses, how it treats signed-out and signed-in visitors, and which parts of the upstream response must survive the hop unchanged.

## ADDED Requirements

### Requirement: Browser reads of CMS content are same-origin

Every WordPress REST read initiated by client-side code SHALL be issued to this frontend's own origin. No client-side read SHALL target the CMS host directly.

#### Scenario: Client-side content read on a public page

- **WHEN** a page's client-side code reads WordPress content such as a discount table, an upsell banner, or a course list
- **THEN** the request goes to this frontend's origin
- **AND** no request to the CMS host appears in the browser's network log
- **AND** no CORS error is possible for that read

#### Scenario: CMS answers with a bot-protection challenge

- **WHEN** the CMS host responds to the frontend's server-side call with a challenge interstitial instead of the REST payload
- **THEN** the visitor's browser is unaffected by any missing cross-origin headers on that interstitial
- **AND** the failure surfaces to client code as an ordinary upstream error it can handle, not as an opaque network error

#### Scenario: Server-rendered reads are unchanged

- **WHEN** a page is rendered on the server
- **THEN** its content reads reach the CMS directly, exactly as before this capability existed
- **AND** the read proxy is not involved

### Requirement: The read proxy accepts only namespaced reads

The proxy SHALL serve retrieval requests only, and only for the WordPress REST namespaces that client-side code is allowed to read. It MUST NOT act as a general-purpose forwarder to arbitrary upstream paths or hosts.

#### Scenario: Read on an allowed namespace

- **WHEN** a retrieval request names one of the allowed read namespaces and a path beneath it
- **THEN** the proxy forwards it to the CMS under that namespace
- **AND** returns the upstream response to the caller

#### Scenario: Query parameters are preserved

- **WHEN** a retrieval request carries query parameters such as a page number or page size
- **THEN** the proxy forwards those parameters to the CMS unchanged
- **AND** the upstream response reflects them

#### Scenario: Namespace outside the allowlist

- **WHEN** a request names a namespace that client-side code is not permitted to read, including the commerce namespaces that have their own dedicated routes
- **THEN** the proxy refuses it without contacting the CMS
- **AND** responds with a client error

#### Scenario: Non-retrieval method

- **WHEN** the proxy receives a request whose method is anything other than a retrieval
- **THEN** it refuses the request without contacting the CMS
- **AND** forwards no request body upstream

#### Scenario: Missing or empty path

- **WHEN** a request names no path beneath a namespace
- **THEN** the proxy refuses it with a client error without contacting the CMS

#### Scenario: Relative path segments that would change the namespace

- **WHEN** a request names an allowed namespace but its resource path contains a segment that walks upwards, such as `..`
- **THEN** the proxy refuses it with a client error without contacting the CMS
- **AND** the upstream request it would otherwise have made cannot resolve to a namespace outside the allowlist

#### Scenario: The allowlist does not depend on the web framework

- **WHEN** a path containing upward or empty segments reaches the proxy by any route, including one the framework did not normalise
- **THEN** the proxy still refuses it, because the check happens where the namespace decision is made

### Requirement: Proxied reads work signed-out and signed-in

A read that the CMS serves publicly SHALL remain readable by a signed-out visitor. When the visitor is signed in, the proxy SHALL present their credential so personalised fields are returned, and SHALL NOT let a stale credential turn a public read into a failure.

#### Scenario: Signed-out visitor reads public content

- **WHEN** a visitor with no session requests public content through the proxy
- **THEN** the proxy forwards the read without a credential
- **AND** the visitor receives the public response

#### Scenario: Signed-in visitor reads the same content

- **WHEN** a visitor with a valid session requests the same content
- **THEN** the proxy presents their credential to the CMS
- **AND** the visitor receives the response including any fields the CMS personalises for them

#### Scenario: Session has expired

- **WHEN** a signed-in visitor's credential is rejected by the CMS as expired
- **THEN** the proxy renews it and retries once
- **AND** if renewal fails, retries the read without a credential and returns the public response rather than an error

#### Scenario: Credential is never exposed to page scripts

- **WHEN** any read passes through the proxy
- **THEN** the visitor's access credential is not present in the response body, in a response header, or in any form readable by page scripts

### Requirement: Upstream response metadata survives the hop

A read that passes through the proxy SHALL be indistinguishable to calling code from the same read made directly, in every respect that calling code depends on.

#### Scenario: Paginated list read

- **WHEN** the CMS reports a list's total item count and total page count as response metadata rather than in the body
- **THEN** that metadata reaches the calling code through the proxy
- **AND** the caller computes the same totals it would have computed reading the CMS directly

#### Scenario: Upstream returns an error

- **WHEN** the CMS rejects a read with an error code and a human-readable message
- **THEN** the proxy returns the same status
- **AND** the calling code can read both the error code and the human-readable message from the response

#### Scenario: Upstream returns a non-JSON body

- **WHEN** the CMS responds with a body the proxy cannot parse as JSON, such as a challenge page or an error page
- **THEN** the proxy responds with a gateway error
- **AND** does not pass the unparseable body through to the browser

#### Scenario: Envelope-wrapped payload

- **WHEN** the CMS wraps a payload in its success envelope
- **THEN** the calling code receives the payload in the same shape it receives today when reading the CMS directly

### Requirement: Only successful, impersonal responses are cacheable

If proxied responses are cached, the cache SHALL be keyed so that no visitor can be served a response produced for a different visitor's session, and a failed read SHALL never be shared.

#### Scenario: Personalised read is not shared

- **WHEN** a signed-in visitor's read returns fields personalised to them
- **THEN** no other visitor is ever served that cached response

#### Scenario: Public read is shareable

- **WHEN** a read carries no credential and succeeds, returning identical content for everyone
- **THEN** the response may be cached and reused across visitors

#### Scenario: Upstream failure is never cached

- **WHEN** a read fails — the CMS returns a client error, a server error, or a body the proxy could not parse
- **THEN** the response is marked uncacheable
- **AND** a single failing moment at the CMS cannot be replayed to other visitors after it has passed

### Requirement: Browser form submissions reach the CMS

A form a visitor submits in the browser SHALL reach WordPress, signed-out as well as signed-in, and SHALL NOT be blocked by the read path's restriction to retrieval requests.

#### Scenario: Signed-out visitor submits a form

- **WHEN** a visitor with no session submits a public form such as a contact or cancellation request
- **THEN** the submission reaches WordPress and the visitor sees its result

#### Scenario: Submission is rejected with per-field errors

- **WHEN** WordPress rejects a submission and names which fields are invalid and why
- **THEN** the per-field messages reach the browser intact
- **AND** the visitor is shown which fields to fix rather than a generic failure

#### Scenario: Submission carries file uploads

- **WHEN** a submission includes uploaded files
- **THEN** the files reach WordPress intact

#### Scenario: Submissions are not cached

- **WHEN** any form submission passes through
- **THEN** the response is never stored or shared
