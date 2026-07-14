# Social Login Integration Plan — headless frontend

> Wires Firebase-based social sign-in (Google/Facebook/Apple) into `tx-headless-frontend`
> against the `POST /auth/social` endpoint added to `wp-lms-backend-rest-api`'s
> `lms-backend/v1` namespace.
>
> Backend refs: `wp-lms-backend-rest-api/SOCIAL_AUTH_PLAN.md` (architecture decision +
> why it's self-verifying, not bridged to WPLMS's own Firebase login),
> `wp-lms-backend-rest-api/docs/SOCIAL_AUTH_API.md` (request/response contract),
> `wp-lms-backend-rest-api/docs/FIREBASE_PROJECT_SETUP.md` (Firebase Console setup).
>
> **Status: implemented and verified end-to-end** against the real `trainingexcellence`
> Firebase project (real Google popup → real WP account resolution → real dashboard
> load). This doc is the as-built record — see §5 for what's still open.

---

## 0. Architecture decision

**Reuse the existing BFF (Backend-for-Frontend) proxy pattern exactly as-is** — same
shape as `/api/auth/login` and `/api/auth/register`. No new pattern introduced.

| Piece              | Decision                                                                                                              | Why                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token verification | Backend-only (`FirebaseTokenVerifier`, self-verifying against Google's JWKS)                                          | Frontend never verifies anything — it only collects an ID token client-side and hands it to the BFF. Zero trust placed in the browser.                                           |
| Session storage    | httpOnly cookies (`access_token`, `refresh_token`, `user_logged_in`), set server-side by the Next.js route handler    | Identical to every other auth method here — JWT never touches client-side JS or localStorage.                                                                                    |
| Firebase SDK       | Client-side only (`firebase/app` + `firebase/auth`, v12), used solely to run `signInWithPopup` and obtain an ID token | No Firebase Admin SDK, no service account, nothing server-side-Firebase in this repo — matches the backend's own "self-verify, no Admin SDK" decision.                           |
| Provider list      | Google, Facebook, Apple — matches what's toggled on in the backend's Firebase project                                 | Adding a provider later is a Firebase Console change only; the code path is provider-agnostic (`sign_in_provider` is read from the token server-side, never sent by the client). |

**Why not a dedicated `/social-login` page or client-side redirect flow:** the existing
`SocialAuthButtons` component was already scaffolded (disabled, "Coming soon") and
shared between `LoginForm` and `RegisterForm`. Wiring it in place kept both entry
points working with zero page/route restructuring.

---

## 1. Request topology

```
Browser
  │  click "Continue with Google" (SocialAuthButtons)
  ▼
firebase/auth signInWithPopup()          — client-side only, real Google OAuth popup
  │  returns Firebase ID token (RS256 JWT, signed by Google)
  ▼
POST /api/auth/social                     (same-origin Next.js route handler)
  │  { id_token }
  ▼
POST {WP_API_URL}/wp-json/lms-backend/v1/auth/social   (server-to-server fetch)
  │  FirebaseTokenVerifier verifies signature/iss/aud against Google's JWKS
  │  find-or-create WP user, issue this API's own JWT
  ▼
Next.js route handler sets httpOnly cookies, returns { user }
  ▼
useSocialLogin() — setUser(), invalidate queries, toast, redirect to /dashboard/my-learning
```

Server-to-server leg means **no CORS involved** — same reason `/api/auth/login`
never needed `LMS_BACKEND_API_ALLOWED_ORIGINS` to include `localhost:3000`.

---

## 2. Files

| File                                          | Change                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/api/endpoints.ts`                    | `+ auth.social`                                                                                                                                                                                                                                                                                                                                                       |
| `src/app/api/auth/social/route.ts`            | **New.** Mirrors `auth/login/route.ts` verbatim — same cookie-setting logic, only the request body shape and target endpoint differ.                                                                                                                                                                                                                                  |
| `src/lib/services/auth.ts`                    | `+ socialLogin(idToken)`                                                                                                                                                                                                                                                                                                                                              |
| `src/lib/hooks/useAuth.ts`                    | `+ useSocialLogin()` — mirrors `useLogin()` (same store/cache-invalidation/redirect behavior)                                                                                                                                                                                                                                                                         |
| `src/lib/firebase/client.ts`                  | **New.** Lazy Firebase app singleton (`getApps()[0] ?? initializeApp(...)`) + `signInWithSocialProvider(key)` for `google`/`facebook`/`apple`.                                                                                                                                                                                                                        |
| `src/components/auth/social-auth-buttons.tsx` | Wired live — was `disabled`/"Coming soon". Dropped the unused `onSuccess` prop (`useSocialLogin` already owns success handling, matching how `LoginForm`/`RegisterForm` use `useLogin`/`useRegister` internally rather than prop callbacks). Ignores `auth/popup-closed-by-user` / `auth/cancelled-popup-request` — not real errors, just the user closing the popup. |
| `src/lib/env.ts`                              | `+ FIREBASE_API_KEY` / `FIREBASE_AUTH_DOMAIN` / `FIREBASE_PROJECT_ID` / `FIREBASE_STORAGE_BUCKET` / `FIREBASE_MESSAGING_SENDER_ID` / `FIREBASE_APP_ID`                                                                                                                                                                                                                |
| `.env.local` / `.env.example`                 | `+ NEXT_PUBLIC_FIREBASE_*` block                                                                                                                                                                                                                                                                                                                                      |
| `package.json`                                | `+ firebase@^12.16.0` (client SDK only)                                                                                                                                                                                                                                                                                                                               |

No changes to `src/lib/stores/auth.store.ts`, `src/types/user.ts`, or any route/page
files — the existing `AuthUser` shape and Zustand store are reused unmodified.

---

## 3. Env config

```bash
# .env.local — must match LMS_BACKEND_API_FIREBASE_PROJECT_ID in the backend's wp-config.php
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Values come from Firebase Console → Project Settings → "Your apps" → Web app config.
Not secret — safe as `NEXT_PUBLIC_*` (this is exactly what the Firebase JS SDK expects
to ship client-side).

---

## 4. Verified

- `tsc --noEmit` clean.
- `eslint` clean on all new/changed files (2 pre-existing unrelated warnings elsewhere
  in `useAuth.ts`, not touched by this change).
- `/login` renders 200, all three provider buttons live (no `disabled` attribute).
- **Real end-to-end run**: clicked "Continue with Google" → real Google OAuth popup →
  signed in with a real account → `POST /api/auth/social 200` → redirected to
  `/dashboard/my-learning` → resolved to an existing WP account (matched by email,
  since a real Google account's email already had a WP user with real enrollment data:
  5 active courses, 2 certificates) → `wp_usermeta.firebase_uid` written for that user →
  no console errors, no fatals.

---

## 5. Open / not done

- **Facebook and Apple are wired in code but unverified** — same code path as Google
  (provider is read from the token server-side, not client-supplied), but I haven't
  clicked them. Needs those providers actually enabled in the Firebase Console first
  (see `FIREBASE_PROJECT_SETUP.md` §3) before a real click-through is possible.
- **No frontend tests added** — `src/__tests__/login-form.test.tsx` /
  `register-form.test.tsx` exist for the password flow; no equivalent for
  `SocialAuthButtons` yet. Would need to mock `firebase/auth`'s `signInWithPopup`.
- **`lms_social_email_unverified` (409) has no dedicated UI message** — falls through
  to the generic toast error path (`err.message` from the BFF's sanitized error). Works,
  but the copy is whatever the backend sends (`docs/SOCIAL_AUTH_API.md`'s table),
  not a purpose-written frontend string. Low priority — this case only fires when a
  provider hands back an unverified email that collides with an existing account, which
  is rare for Google (always verified) and only plausible for Facebook.
- **No i18n strings** — button labels ("Continue with Google" etc.) and the "Signing
  in..." pending state are hardcoded English, unlike the rest of the form which may be
  routed through `next-intl`. Not checked against this repo's i18n conventions.
