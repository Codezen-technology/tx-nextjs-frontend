## Context

See `proposal.md` — **Why**. What matters technically is that the two surfaces have
different owners.

**The header is ours.** `header.tsx` hardcodes every link: a `resourcesLinks` array at
`:25–29`, a utility row (`About us`, `Help`, search) and a main row (`Our courses`,
`Training teams`, `Resources`, `Contact us`) at `:407–480`, and a separate mobile drawer at
`:525–580` that repeats the same destinations. Nothing reads a WP menu.

**The footer is not.** `buildNavColumns` (`footer.tsx:109–128`) renders whatever
`/lms-backend/v1/footer` returns, in three shapes: `{about, support}` columns, a flat WP
menu array, or — when the endpoint returns nothing — `FALLBACK_NAV_LINKS`. Prod returns the
first shape and includes all three items the report asks to remove. Local returns `nav: []`,
which is why the fallback has been the thing everyone looked at.

That asymmetry is the whole design question: three of these rows are edits, one is a policy
decision about who owns the footer menu.

## Goals / Non-Goals

**Goals:**

- Close `A9`, `A11`, `A12`, `A13` against **prod** data, not against the local fallback
- Keep the two header surfaces in step, so no link survives on one and not the other
- Leave a reader able to find out why a CMS menu item stopped appearing

**Non-Goals:**

- Editing the WordPress menu — this repo cannot, and pretending otherwise is how the row
  would close while prod still showed the links
- Redesigning the nav. "Pricing" goes in the existing main row; nothing else moves
- `A10` and `A8` — see the proposal for why each needs an input this change does not have

## Decisions

### D1 — Filter the footer menu by path, in `buildNavColumns`

A named `REMOVED_FOOTER_PATHS` set, applied to every shape `buildNavColumns` handles, plus
the fallback. Matching is on the destination after `remapNavHref`/`toFrontendPath`, not on
the label, because an editor renaming "Work for us" to "Careers" must not resurrect it.

_Alternative considered — edit the WP menu and leave the code alone._ Correct, and it should
still happen; it is named in the filter's comment. But it cannot be done from here, it is
not verifiable by any test in this repo, and leaving the row open until someone with CMS
access acts is exactly how the QA report accumulated three months of unfiled work.

_Alternative considered — edit only `FALLBACK_NAV_LINKS`._ This is what the row's note
implied and it is wrong: prod never uses the fallback. It would have closed the row with a
change that does nothing to the site QA looked at.

**The trade-off is real and worth naming.** Filtering CMS content in the frontend means an
editor can add a menu item and not see it appear, with no error. That is why the list is
one constant, commented, and asserted — not a condition buried in a `.filter()` chain.

### D2 — Fallback and CMS paths get the same treatment

`FALLBACK_NAV_LINKS` loses the same three entries, and the filter runs over it too. Belt and
braces on purpose: the fallback is the local-development path, so if the two disagree the
disagreement shows up in dev, where it is cheap.

### D3 — "Pricing" goes in the main row, after "Training teams"

The report says "add pricing option on the navbar" and says nothing about placement. The main
row already holds the commercial destinations (`Our courses`, `Training teams`); the utility
row holds `About us`, `Help`, search. Pricing is commercial. Mobile drawer gets it in the
matching position.

### D4 — The Resources dropdown keeps its dropdown

Removing Help Centre and About Us leaves `Resources` with one item, Blog. A one-item dropdown
is poor UX and the obvious follow-up is to promote Blog to a plain link — but that is a nav
redesign the report did not ask for, and `site-header-navigation` describes dropdown hover
behaviour that would need revisiting. The dropdown stays; the oddity is recorded on the row
for design to rule on.

Both destinations stay reachable from the utility row, which is what makes the removal safe
rather than a functional loss.

### D5 — Tests go in a new `e2e/site-nav.spec.ts`

The header and footer are on every page, so these assertions do not belong in any page's
spec. The file navigates once to `/` and asserts membership; the mobile-drawer assertion runs
only in the `mobile-440` project, where the drawer exists.

Assertions are on link destinations (`a[href="/pricing"]`), not on visible text, matching the
spec's rule and surviving a copy change.

## Risks / Trade-offs

- **An editor adds a footer link and it silently vanishes** → only three paths are filtered,
  each commented; and the comment names the CMS as the fix, so the next person deletes the
  menu items and then the list
- **Prod's menu shape changes** (`{about, support}` → flat array) → the filter runs over both
  shapes and the fallback, so no shape is unguarded
- **Removing "Contact us" hurts a contact route users rely on** → the footer keeps its link
  and the route is unchanged; this is a nav-density decision the business made
- **The one-item Resources dropdown looks broken** → recorded on `QA-HOME-A12` for a design
  ruling rather than fixed on my own authority

## Migration Plan

No data, no API, no deploy step. One commit; `git revert` restores both surfaces.

The CMS follow-up — delete the three items from the WP footer menu — is worth doing but is
not a blocker for this change, and the filter is harmless once it has.
