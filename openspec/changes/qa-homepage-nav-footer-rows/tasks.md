## 1. Confirm the page against the inventory

- [x] 1.1 Re-read the Homepage section of `docs/qa/QA_BY_PAGE.md` and confirm `A9`, `A11`, `A12`, `A13` are the four rows in scope and each cites a real item in `QA_REPORT_ITEMS.md`
- [x] 1.2 Record the prod footer menu payload (`/lms-backend/v1/footer`) in the `A9` row's `Manual` field — the row currently claims "Work for us is already gone", which is true of the local fallback and false of prod

## 2. Write the tests first

- [x] 2.1 Create `e2e/site-nav.spec.ts` scoped to the shared header and footer, with a comment saying why these assertions live outside any page spec
- [x] 2.2 `A11` — assert no `a[href="/contact-us"]` in the header at desktop widths, and none in the mobile drawer at 440
- [x] 2.3 `A12` — open the Resources dropdown; assert it contains no link to `/help` and none to `/about-us`; assert both are still reachable from the header's utility row
- [x] 2.4 `A13` — assert `a[href="/pricing"]` exists in the header at desktop widths and in the mobile drawer at 440
- [x] 2.5 `A9` — assert the footer renders no link to `/force-for-good`, `/careers` or `/resources`
- [x] 2.6 Three of four failed as written. **`A9` passed against the unfixed build** — locally the footer endpoint returns `nav: []`, which renders no menu at all, so the assertion could not fail on this data. That is what task 4.4 exists for; the unit test against the captured prod payload is `A9`'s real guard

## 3. Header

- [x] 3.1 `A12` — reduce `resourcesLinks` (`header.tsx:25–29`) to Blog only; leave the dropdown in place per design D4
- [x] 3.2 `A11` — remove the `/contact-us` link from the desktop main row (`header.tsx:~468`) and from the mobile drawer (`~572`)
- [x] 3.3 `A13` — add a `/pricing` link after "Training teams" in the desktop main row, matching the surrounding link's classes and `aria-current` handling
- [x] 3.4 `A13` — add the same link to the mobile drawer in the matching position
- [x] 3.5 Check no other component links into the removed dropdown entries or relies on the nav array's length

## 4. Footer

- [x] 4.1 Add a `REMOVED_FOOTER_PATHS` constant to `footer.tsx` holding `/force-for-good`, `/careers`, `/resources`, with a comment naming the report item and stating that deleting the items from the WP menu is the durable fix
- [x] 4.2 Apply it inside `buildNavColumns` to all three shapes — `{about, support}`, the flat WP array, and the fallback — matching on the destination **after** `remapNavHref` / `toFrontendPath`
- [x] 4.3 Remove the same three entries from `FALLBACK_NAV_LINKS`
- [x] 4.4 Verify against the prod payload shape, not just the local empty menu: feed `{about: [...], support: [...]}` through `buildNavColumns` in a unit test and assert the three are gone and the other seven survive in order

## 5. Verify

- [x] 5.1 Re-run `e2e/site-nav.spec.ts` at `chromium`, `desktop-1920` and `mobile-440`; all four rows green
- [x] 5.2 Mutation-check one assertion: restore one removed link, confirm the test fails naming it, revert
- [x] 5.3 Confirm the rest of the suite is unchanged against the seven known pre-existing failures listed in `QA_EXECUTION.md`
- [x] 5.4 `pnpm typecheck && pnpm lint && pnpm test`

## 6. Flip statuses and commit

- [x] 6.1 `QA_BY_PAGE.md` — the four rows to `FIXED`, `Auto` to `` `e2e/site-nav.spec.ts > <test name>` ``, removed from **Tests to write**
- [x] 6.2 Recompute the Homepage index row (`Open` 6 → 2) and its `Ready` value
- [x] 6.3 Clear the four entries from Appendix B
- [x] 6.4 Note on `A12` that the Resources dropdown now holds one item and needs a design ruling
- [x] 6.5 `pnpm test` — the doc checker passes all six assertions
- [x] 6.6 Commit as `fix(qa-homepage): close the four nav and footer rows`
