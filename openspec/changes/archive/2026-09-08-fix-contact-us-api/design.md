## Context

The `proxyToWP()` function in `src/lib/api/bff.ts` defaults `requiresAuth = true`, which causes it to reject requests without an `access_token` cookie before they reach WordPress. The WordPress `Contact_Controller` registers its `POST /contact` endpoint with `'permission_callback' => '__return_true'` — it is explicitly public. The BFF's default auth gate contradicts this intent, making the contact form unusable for anonymous visitors.

The contact page content endpoint (`GET /contact/page`) is also public on WordPress and consumed server-side via `serverFetch` (not through the BFF proxy), so it is unaffected.

## Goals / Non-Goals

**Goals:**

- Allow anonymous form submissions through the BFF proxy
- Remove production `console.log` from the server-side contact service
- Keep the fix minimal and isolated to the contact API route

**Non-Goals:**

- Refactoring `proxyToWP` to infer auth requirements from WordPress route metadata
- Changing the WordPress plugin's permission model
- Addressing the message max-length difference (1000 frontend vs 5000 backend) — this is an intentional UX choice, not a bug

## Decisions

### 1. Set `requiresAuth: false` on the contact proxy call

**Decision:** Add `requiresAuth: false` to the `proxyToWP` call in `src/app/api/contact/route.ts`.

**Rationale:** This is the most surgical fix. The `proxyToWP` function already supports `requiresAuth: false` — it's used by other BFF routes for public endpoints. No changes needed to the BFF library itself.

**Alternative considered:** Extracting a separate `proxyToWPPublic()` function — rejected as over-engineering for a single route.

### 2. Delete the `console.log` statement

**Decision:** Remove `console.log({data})` from `src/lib/services/contact.server.ts:54`.

**Rationale:** Server-side logs on every page load are noise. The `data` variable is already used in the merge logic on lines 59-72 — the log serves no debugging purpose in production.

### 3. Keep `MESSAGE_MAX = 1000` on the frontend

**Decision:** Leave the frontend limit at 1000 characters. The backend allows 5000, but 1000 is a reasonable UX constraint for a contact form. The frontend counter is informational — the backend enforces the real limit.

**Rationale:** Frontend limits are UX decisions, not security constraints. A 1000-char cap keeps the form focused. No change needed.

## Risks / Trade-offs

- **Risk:** Exposing the contact endpoint without auth could increase spam volume. **Mitigation:** The WordPress plugin already has IP-based rate limiting (5/hour) and a honeypot field. These remain effective regardless of BFF auth settings.
- **Risk:** Other BFF routes might copy the `requiresAuth: false` pattern incorrectly. **Mitigation:** This is a single, well-scoped change. The contact endpoint is the only one that needs it.
