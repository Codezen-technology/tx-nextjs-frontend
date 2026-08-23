## Why

The 2026-08-14 reconciliation left the Homepage with 6 open rows. Four of them are the
report's navigation and footer items, and they are the cheapest open work on the board —
link-list edits with no measurement and no Figma frame:

| Row           | Ref              | What the report asks for                                        |
| ------------- | ---------------- | --------------------------------------------------------------- |
| `QA-HOME-A11` | `R-HOME-1920-17` | Remove "Contact us" from the navbar                             |
| `QA-HOME-A12` | `R-HOME-1920-18` | Remove "Help Centre" and "About Us" from the Resources dropdown |
| `QA-HOME-A13` | `R-HOME-1920-19` | Add "Pricing" to the navbar                                     |
| `QA-HOME-A9`  | `R-HOME-1920-15` | Remove "Force for good, work for us, resources" from the footer |

The header three are what they look like: `header.tsx` hardcodes its nav, so each is a few
lines.

**`A9` is not.** The footer's link columns come from WordPress, not from the repo. Prod's
`/lms-backend/v1/footer` returns exactly the three items the report asks to remove:

```
about:   About us · Work for us · Resources · Force for Good · Reviews
support: Help and FAQs · Contact us · Verify certificate · Cancellations · Policies
```

So editing `FALLBACK_NAV_LINKS` — the obvious fix, and the one the row's note implied —
changes nothing on prod. That fallback is only used when WP returns an empty menu, which
is what the local environment does. The row also recorded "Work for us is already gone";
that was read off the fallback, and prod still serves it.

## What Changes

- **Header** — remove the "Contact us" link from the desktop nav and the mobile drawer;
  remove "Help Centre" and "About Us" from the `Resources` dropdown; add a "Pricing" link
  to both nav surfaces
- **Footer** — filter the three named items out of whatever the CMS returns, so the row
  closes against prod data rather than against the local fallback. The deny-list is
  named, commented and pointed at the CMS as the durable fix
- **Fallback** — drop the same three from `FALLBACK_NAV_LINKS` so both data paths agree
- **Tests** — a new `e2e/site-nav.spec.ts`, one assertion per row, running at all three
  QA breakpoints
- **Docs** — flip the four rows in `QA_BY_PAGE.md`, correct `A9`'s note about "Work for
  us", clear their Appendix B entries

Out of scope, stated rather than silently skipped:

- `QA-HOME-A10` (shorten the Certificate Validator body copy) — a copy decision with no
  target in the report; it needs someone to write the shorter sentence
- `QA-HOME-A8` (a section button with no hover) — the report identifies it by screenshot
  only and the page has several single-CTA sections

## Capabilities

### New Capabilities

- `site-footer-navigation`: which links the footer shows, and how the repo reconciles a
  CMS-owned menu with items the business has asked to remove

### Modified Capabilities

- `site-header-navigation`: gains requirements for which links the header nav contains —
  the existing spec covers only hover and dismiss behaviour, not membership

## Impact

**Code**

- `src/components/layout/header.tsx` — `resourcesLinks`, the desktop nav row, the mobile drawer
- `src/components/layout/footer.tsx` — `buildNavColumns`, `FALLBACK_NAV_LINKS`

**Tests**

- `e2e/site-nav.spec.ts` — new

**Docs**

- `docs/qa/QA_BY_PAGE.md` — four rows, the page index, Appendix B

**Not affected:** the mega menu, the WP menu itself (a CMS edit this repo cannot make),
and every other page's nav — the header is shared, so these four rows close site-wide.
