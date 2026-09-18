> Implemented and verified on `tx-local-site`.

## 1. Shared href guard

- [x] 1.1 Move the floating bar's `safeBarHref` logic into `lib/utils/url` as `safeCmsHref`, keeping the reasoning about `javascript:` parsing with a `"null"` origin
- [x] 1.2 Delegate `safeBarHref` to it so there is one implementation, and confirm the floating bar's existing unsafe-scheme tests still pass

## 2. Link the banner

- [x] 2.1 Type `promoBanner.link` on `CertPageContent`
- [x] 2.2 Normalise it in `certificateService.getPage` with `safeCmsHref`
- [x] 2.3 Wrap the banner — image or placeholder — in `next/link` for our own origin, a new-tab anchor otherwise
- [x] 2.4 Fall back to the banner heading for the image's `alt` when the CMS alt is blank

## 3. Tests

- [x] 3.1 Service: site path kept, WP-origin URL becomes a path, third-party URL untouched, unsafe schemes dropped, missing link tolerated
- [x] 3.2 Shell: links where the CMS points, opens third-party destinations in a new tab, renders unlinked when no link, links the placeholder tile, names the image from the heading
- [x] 3.3 Full suite, typecheck and lint

## 4. Verify live

- [x] 4.1 `/certificate` on `tx-local-site` renders `<a href="https://trainingexcellence.org.uk/pricing" target="_blank" rel="noopener noreferrer">` around the banner, with `alt="Premium Access"`
- [x] 4.2 Confirm the earlier "not working" state was the dev server's 1h fetch cache holding a payload from before the link was authored — not a rendering fault
