## ADDED Requirements

### Requirement: Per-course licence balance has a BFF route

The business dashboard SHALL expose a BFF route that returns the licence-pool balance for a
single course, reachable at `GET /api/business/licences/balance/{courseId}`, forwarding to the
`lms-b2b/v1` facade route `GET /licences/balance/{courseId}`. The client method
`getCourseLicenceBalance(courseId)` SHALL resolve through this route rather than 404 at the BFF
boundary.

A service method whose HTTP path has no handler is a parity gap: the client and the upstream
contract agree on the endpoint, but the BFF that bridges them is missing, so the call fails
before it reaches WordPress.

#### Scenario: A per-course balance request

- **WHEN** the frontend requests `GET /api/business/licences/balance/{courseId}` for an
  authenticated business user
- **THEN** the request is proxied to the facade's `/licences/balance/{courseId}` with the
  session's bearer token, and the per-course balance is returned

#### Scenario: The aggregate balance route is unaffected

- **WHEN** the frontend requests `GET /api/business/licences/balance` (no course id)
- **THEN** it continues to return the pool-summary balance as before, unchanged by this addition
