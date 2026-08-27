## 1. Evidence

- [x] 1.1 Record all four measurements in `.context/figma/targets.md`, each with the row it closes
- [x] 1.2 Record the `/blog` hover-probe correction — `hasText` resolved the whole card, so the first sweep reported card titles as dead controls and missed the pill

## 2. Failing tests first

- [x] 2.1 Restart `pnpm dev`, warm `/about-us`, `/blog`, `/privacy-policy`, `/support-request`
- [x] 2.2 `QA-ABOUT-A1` — assert no breadcrumb navigation renders on `/about-us`; watch it fail
- [x] 2.3 `QA-BLOG-A5` — assert the trending pill's fill changes when the card is hovered, and that the change is transitioned; watch it fail
- [x] 2.4 `QA-PRIVACY-A2` — assert every `mailto:`/`tel:` link in the legal content clears 4.5:1 against its background and carries a non-colour cue; watch it fail reporting 2.14
- [x] 2.5 `QA-SUPPORT-A2` — assert the Additional Details textarea grows when more text than its initial height is typed; watch it fail

## 3. Implementation

- [x] 3.1 Remove `<AboutBreadcrumb />` from `about-us/page.tsx` and delete `about-breadcrumb.tsx`
- [x] 3.2 Give the trending pill `group-hover:` fill plus a transition covering it
- [x] 3.3 Give legal-content links an AA-clearing colour and an underline; verify the chosen token by measurement, not by assumption
- [x] 3.4 Make the Gravity Forms textarea grow with its content, bounded by a maximum
- [x] 3.5 Re-run 2.2–2.5 green

## 4. Mutation check

- [x] 4.1 Restore the breadcrumb, confirm its assertion fails, restore
- [x] 4.2 Remove the pill's `group-hover:`, confirm its assertion fails naming the unchanged fill, restore
- [x] 4.3 Revert the link colour, confirm the contrast assertion fails reporting the ratio, restore
- [x] 4.4 Fix the textarea height back, confirm the growth assertion fails, restore

## 5. Docs

- [x] 5.1 Four rows → `FIXED`, each with its test reference and what was measured
- [x] 5.2 Page index — About Us, Blog, Privacy Policy, Priority Support recounted; `Ready` recomputed
- [x] 5.3 **Appendix B emptied** — `QA-ABOUT-A1` and `QA-SUPPORT-A2` were its last two rows; state that one of the three "Done" conditions is now met
- [x] 5.4 Note the two Class A rows still open and why each is a different kind of work

## 6. Gate

- [x] 6.1 `pnpm typecheck` clean
- [x] 6.2 `pnpm lint` — no new errors
- [x] 6.3 `pnpm test` — green including the doc checker
- [x] 6.4 Restart `pnpm dev`, warm the touched routes, full `pnpm test:e2e`; compare against the baseline of 4 specs × 3 projects, re-run extras before believing them
- [x] 6.5 `openspec validate qa-final-class-a-rows --strict`
- [x] 6.6 Commit
