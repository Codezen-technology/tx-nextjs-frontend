## Why

The Contact Us form submission REST API is broken for non-authenticated users. The BFF proxy defaults to `requiresAuth: true`, which blocks anonymous visitors before the request ever reaches WordPress. The WP endpoint is intentionally public (`__return_true` permission), but the frontend proxy gate prevents it from working. Additionally, there's a `console.log` left in production server code and a minor max-length mismatch between frontend and backend.

## What Changes

- Set `requiresAuth: false` on the contact form BFF proxy call so anonymous users can submit the form
- Remove stray `console.log({data})` from the server-side contact page fetcher
- Align the frontend message max-length with the backend (or document the intentional difference)

## Capabilities

### New Capabilities

- `contact-form-public-access`: Ensures the contact form submission endpoint is accessible to anonymous users through the BFF proxy

### Modified Capabilities

(none — no existing spec-level behavior changes)

## Impact

- **Files**: `src/app/api/contact/route.ts`, `src/lib/services/contact.server.ts`, `src/components/contact/contact-form.tsx`
- **APIs**: `POST /api/contact` (BFF) — currently returns 401 for anonymous users, will return 200/400/500 as designed
- **Dependencies**: None
- **Systems**: Contact Us page form submission flow
