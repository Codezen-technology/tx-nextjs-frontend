## Context

See proposal.md — Why. Two existing pieces shape this:

- `lib/utils/url.ts` documents the split the app already follows: rewrite WP-origin URLs at the
  **service** layer, and let components decide `<Link>` vs `<a target="_blank">` via `isExternalUrl`.
- `lib/services/settings.ts` carried a private `safeBarHref()` guarding the floating bar's
  CMS-authored CTA, with the reasoning written out: `new URL("javascript:alert(1)")` parses with an
  origin of `"null"`, which reads as "not our origin" and would render an executable `href`.

The promo banner is the same kind of value — a URL an editor typed into WordPress — reaching a
different component.

## Goals / Non-Goals

**Goals:**

- Make the banner clickable where the CMS says it should be, with one implementation of "is this
  editor-supplied href safe".
- Keep the security reasoning in one place instead of copying a four-line check into a second file.

**Non-Goals:**

- Consuming the other unconsumed fields (`trustBadges`, `accreditationBanner`, `hero.eyebrow`). They
  still have no element in the approved design; this change is about the one that was reported.
- Changing what the backend sends. `promoBanner.link` has been in the response all along.

## Decisions

### Extract the guard, don't copy it

`safeCmsHref` moves to `lib/utils/url` and `safeBarHref` becomes a one-line delegation. A copy would
have meant two places to fix the day the rule changes — and the floating bar's existing tests
(`javascript:`, `JavaScript:`, padded, `data:`, `vbscript:`, `//evil.test`) now exercise the shared
implementation, so the extraction is covered by tests that already existed.

**Alternative considered:** guard inside the component. Rejected — it would run on every render, and
`lib/utils/url` explicitly says rewriting belongs to the service layer.

### Normalise in `certificateService.getPage`, render in the shell

The service returns a link that is already safe and already a path where it should be; the component
only chooses `<Link>` or a new-tab anchor. That is the boundary the rest of the app uses, and it
keeps the component free of URL parsing.

### Link the placeholder tile too

A banner whose image has not been uploaded yet still has a destination worth honouring, and an
editor who filled in the link would otherwise see it work only after adding an image — a confusing
coupling between two independent fields.

### Alt falls back to the heading

`alt=""` marks an image as decorative; inside a link it produces a link with no accessible name.
The heading is the banner's own words and is the closest thing to an author-supplied name.

## Risks / Trade-offs

- **An off-site destination opens in a new tab** → `rel="noopener noreferrer"` is set, so the opened
  page gets no handle on this one. Same treatment the floating bar's CTA already gets.
- **TX's link points at `trainingexcellence.org.uk`, the production site** → on production that is
  this site's own origin and navigates in place; in local dev it is genuinely another origin and
  opens in a new tab. Correct in both, and the content's own choice rather than something to special-case.
- **An edit is not visible immediately in dev** → the page fetch is cached for an hour and local dev
  has no `WP_REVALIDATE_SECRET` to purge with, so a newly added link needs a dev-server restart.
  Pre-existing; noted so the next person does not read it as a bug in this change.

## Migration Plan

Additive rendering over an existing API field. No new request, no config, nothing to roll back
beyond reverting the deploy.
