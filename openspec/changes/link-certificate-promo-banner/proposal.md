## Why

The certificate page's promo banner has a "Link URL (optional)" field in WordPress — TX points it at `/pricing` — and the API has always returned it as `promoBanner.link`. The frontend never consumed it, by an explicit decision recorded in the `certificate-page-content` spec ("fields the frontend does not consume, since they have no corresponding element in the approved page design"). The consequence, reported from the live page: an editor fills in the link, saves, and the banner is still a dead picture. An advert that cannot be clicked is the one thing an advert must not be.

The image's `alt` has the same shape of problem: the CMS field is usually blank, so the banner renders as an unnamed image — and an unnamed image inside a link is an unnamed link.

## What Changes

- Render the promo banner as a link when `promoBanner.link` is set — `next/link` for our own origin, a new-tab anchor for anywhere else, matching how the floating bar already treats CMS-authored CTAs.
- Link the gradient fallback tile too, so the destination survives a banner that has no image yet.
- Fall back to `promoBanner.heading` for the image's `alt` when the CMS alt is blank, so the banner (and the link wrapping it) has an accessible name.
- Normalise the link in the service: a backend-origin URL becomes a site path, and anything that is not an http(s) URL or a site path is dropped.
- Extract the floating bar's existing href guard into `lib/utils/url` as `safeCmsHref` and use it for both. It was already the right rule for "a URL an editor typed"; it just lived in one feature's service.
- **BREAKING**: none. A banner with no link renders exactly as it does today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `certificate-page-content`: the promo banner gains its link, so `promoBanner.link` moves out of the "returned but not consumed" list and the banner requirement states the linking and accessible-name behaviour.

## Impact

- Code: `src/components/certificate/certificate-page-shell.tsx` (link wrapper + alt fallback), `src/lib/services/certificate.ts` (normalise the link), `src/lib/utils/url.ts` (`safeCmsHref`), `src/lib/services/settings.ts` (floating bar now delegates to it), `src/types/certificate.ts`.
- API: consumes an existing field. Nothing new is requested from the backend.
- Security: the link is editor-authored, so it goes through the same scheme guard the floating bar uses — `javascript:`, `data:`, `vbscript:` and protocol-relative values are dropped rather than rendered as an executable `href`.
- Caching: an edit reaches the page through `/api/revalidate` (or the 1h TTL). Local dev has no `WP_REVALIDATE_SECRET`, so a freshly-added link needs a dev-server restart to appear — that is existing behaviour, not something this change alters.
