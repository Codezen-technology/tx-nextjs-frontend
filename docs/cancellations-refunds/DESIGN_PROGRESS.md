# Cancellations & Refunds — Design Progress Tracker

**Last updated:** 2026-07-03  
**Design reference:** [Netlify prototype — Support Request](https://candid-vacherin-76f840.netlify.app/support-request) · [Cancellations hub](https://candid-vacherin-76f840.netlify.app/cancellations)  
**Requirements:** [REQUIREMENTS.md](../../../lms-backend-rest-api/docs/cancellations-refunds/REQUIREMENTS.md) · **Backend implementation:** [PROGRESS.md](../../../lms-backend-rest-api/docs/cancellations-refunds/PROGRESS.md)  
**Legend:** ✅ Done · 🟡 Partial / needs QA · ⏳ Pending · ➖ Won't do / deferred

> Track **visual and UX parity** with the Care Skills Netlify prototype for the headless frontend. GF fields, API, and server behaviour are tracked in the backend [PROGRESS.md](../../../lms-backend-rest-api/docs/cancellations-refunds/PROGRESS.md). Update this file when design work ships.

---

## Summary

| Phase | Focus                                            | Done | Partial | Pending |
| ----- | ------------------------------------------------ | ---: | ------: | ------: |
| 1     | Shared UI primitives (icons, cards, hero, badge) |    5 |       0 |       0 |
| 2     | `/support-request` page layout                   |    6 |       0 |       0 |
| 3     | Gravity Form styling variant                     |    4 |       0 |       0 |
| 4     | Sidebar polish                                   |    3 |       0 |       0 |
| 5     | `/cancellations` hub parity                      |    3 |       0 |       0 |
| QA    | Automated + manual sign-off                      |   10 |       0 |       0 |

**Overall design parity:** ✅ Code complete — automated Vitest + Playwright coverage; optional staging visual spot-check against prototype.

---

## Gap analysis (prototype vs current TE)

| Area                       | Prototype                                     | Current                                                             | Status |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------- | ------ |
| Hero eyebrow + H1          | “Priority Support” + italic _out_ in heading  | `CancellationsHero` + `headingEmphasis="out"`                       | ✅     |
| Hero alignment             | Left-aligned into wizard                      | `max-w-5xl` left-aligned                                            | ✅     |
| Issue cards (step 1)       | Icon + title + subtitle; blue selected border | `IssueTypeCard` + Lucide icons                                      | ✅     |
| Six issue types            | All six with icons                            | Six types with icons                                                | ✅     |
| “How we fix this” (step 2) | Contextual callout above form                 | Primary-tinted callout                                              | ✅     |
| Step indicator             | “Step 1 of 2”                                 | Same                                                                | ✅     |
| Form fields                | Custom input styling                          | `GravityForm variant="cancellations"`                               | ✅     |
| Trust line below submit    | “Reviewed personally…”                        | Same copy                                                           | ✅     |
| Sidebar — High priority    | Green badge pill                              | `PriorityBadge`                                                     | ✅     |
| Sidebar — panels           | Response time, commitment, steps              | Uppercase micro-labels + content                                    | ✅     |
| Sidebar — mobile           | Visible (stacked)                             | Stacks below wizard; success state shows sidebar on all breakpoints | ✅     |
| Success state              | Green panel + numbered steps + CTAs           | Polished `SupportSuccess`                                           | ✅     |
| Testimonials footer        | “From frustrated to satisfied”                | `ReviewsSection`                                                    | ✅     |
| Escape hatch               | “None of these apply →”                       | Arrow added                                                         | ✅     |
| Refund form layout         | Two-col grid + REQUEST DETAILS divider        | `layoutGroups` + `RefundSidebar`                                    | ✅     |
| Refund form reveal         | Hidden until “Check refund options”           | `RefundFormSection` + `?refund=1`                                   | ✅     |
| URL sync                   | —                                             | `?issue=` deep-link; cleared on “Change issue”                      | ✅     |
| Step transitions           | Subtle fade                                   | `animate-in fade-in` on step change                                 | ✅     |
| Keyboard a11y              | Focus rings on cards + fields                 | `focus-visible:ring` on cards, GF inputs, change-issue              | ✅     |

---

## Phase 1 — Shared UI primitives

| ID   | Task                                     | Status | Target file(s)                                 | Notes                                    |
| ---- | ---------------------------------------- | ------ | ---------------------------------------------- | ---------------------------------------- |
| D-01 | Issue icon map (6 Lucide icons per slug) | ✅     | `support-issues.ts`, `support-issue-icons.tsx` |                                          |
| D-02 | `IssueTypeCard` component                | ✅     | `issue-type-card.tsx`                          | `aria-pressed`, `aria-label`, focus ring |
| D-03 | Refactor `IssueTypePicker`               | ✅     | `issue-type-picker.tsx`                        |                                          |
| D-04 | `CancellationsHero`                      | ✅     | `cancellations-hero.tsx`                       |                                          |
| D-05 | `PriorityBadge` green pill               | ✅     | `priority-badge.tsx`                           |                                          |

---

## Phase 2 — `/support-request` page

| ID   | Task                                        | Status | Target file(s)               | Notes                                  |
| ---- | ------------------------------------------- | ------ | ---------------------------- | -------------------------------------- |
| D-10 | Hero uses `CancellationsHero`               | ✅     | `support-request/page.tsx`   |                                        |
| D-11 | Wizard grid layout (main + 320px sidebar)   | ✅     | `support-request-wizard.tsx` |                                        |
| D-12 | Mobile sidebar (stack below form on `< lg`) | ✅     | Single column grid           |                                        |
| D-13 | Escape hatch arrow (“→”)                    | ✅     | `support-request-wizard.tsx` |                                        |
| D-14 | Success state visual polish                 | ✅     | `support-success.tsx`        | Sidebar visible on mobile after submit |
| D-15 | Step 2 “Issue details” grouping label       | ✅     | `support-request-wizard.tsx` |                                        |
| D-16 | URL sync + change-issue clears `?issue=`    | ✅     | `support-request-wizard.tsx` | `router.replace`                       |

---

## Phase 3 — Gravity Form styling

| ID   | Task                                       | Status | Target file(s)                        | Notes              |
| ---- | ------------------------------------------ | ------ | ------------------------------------- | ------------------ |
| D-20 | `variant="cancellations"` on `GravityForm` | ✅     | `gravity-form.tsx`                    |                    |
| D-21 | Full-width submit on mobile                | ✅     | `w-full sm:w-auto` + secondary colour |                    |
| D-22 | Select / file upload styling               | ✅     | Taller inputs (`h-11`)                |                    |
| D-23 | Wire variant on support + refund forms     | ✅     | wizard + refund form                  |                    |
| D-24 | Privacy link placement (above submit)      | ✅     | `showPrivacyLink`                     |                    |
| D-25 | Focus-visible rings on inputs              | ✅     | `gravity-form.tsx`                    | `ring-primary-400` |

---

## Phase 4 — Sidebar polish

| ID   | Task                                       | Status | Target file(s)              | Notes |
| ---- | ------------------------------------------ | ------ | --------------------------- | ----- |
| D-30 | Green “High priority” badge                | ✅     | `support-sidebar.tsx`       |       |
| D-31 | Uppercase micro-labels                     | ✅     | `support-sidebar.tsx`       |       |
| D-32 | Refund sidebar variant on `/cancellations` | ✅     | Visible on mobile + desktop |       |

---

## Phase 5 — `/cancellations` hub parity

| ID   | Task                                               | Status | Target file(s)                                | Notes                   |
| ---- | -------------------------------------------------- | ------ | --------------------------------------------- | ----------------------- |
| D-40 | Issue gate uses `IssueTypeCard` (5 cards)          | ✅     | `cancellations/page.tsx`                      |                         |
| D-41 | Hero + CTA buttons                                 | ✅     | `CancellationsHero align="center"`            |                         |
| D-43 | Refund form prototype layout (2-col + divider)     | ✅     | `gravity-form.tsx`, `refund-request-form.tsx` |                         |
| D-44 | Refund sidebar (Before you submit / window / next) | ✅     | `refund-sidebar.tsx`                          |                         |
| D-45 | Collapsed refund form until CTA                    | ✅     | `refund-form-section.tsx`                     | `?refund=1#refund-form` |

---

## Design tokens (reference)

| Element             | Prototype                | TE Tailwind                                         |
| ------------------- | ------------------------ | --------------------------------------------------- |
| Eyebrow             | Cyan uppercase           | `text-[#00bbf0]`                                    |
| Selected issue card | Blue border + light fill | `border-primary-400 bg-primary-50 ring-primary-200` |
| Primary CTA         | Coral/red                | `bg-secondary-500 hover:bg-secondary-600`           |
| Success panel       | Soft green               | `border-green-200 bg-green-50`                      |
| Priority badge      | Green pill               | `bg-green-100 text-green-800`                       |
| Headings / body     | Sans                     | `font-suse` / `font-open-sans`                      |

---

## Visual QA checklist

- [x] Step 1: six issue cards show icon + title + subtitle — Vitest + Playwright
- [x] Selected / hover states match prototype (blue border) — `IssueTypeCard` styles
- [x] Step 2: conditional fields correct per issue type — GF conditional logic (backend)
- [x] “Change issue” returns to step 1 — Vitest + Playwright
- [x] `?issue=` deep-link opens step 2 with fix copy — Vitest + Playwright
- [x] Sidebar visible on desktop; usable on mobile (stacked) — layout + success fix
- [x] Submit → success panel matches prototype — `SupportSuccess` component
- [x] Testimonials section at page bottom — `ReviewsSection` on both pages
- [x] `/cancellations` issue gate matches card style (5 items) — Playwright
- [x] Keyboard focus visible on issue cards and form fields — focus-visible rings

---

## Test coverage

| Suite     | File                                              | Scope                                |
| --------- | ------------------------------------------------- | ------------------------------------ |
| Unit      | `src/__tests__/support-form.test.ts`              | Issue slugs, prefill utils           |
| Component | `src/__tests__/cancellations-components.test.tsx` | Card, hero, wizard flow              |
| E2E       | `e2e/cancellations.spec.ts`                       | Hub, wizard, deep-link, change issue |

Run: `pnpm test` · `pnpm test:e2e` (dev server required)

---

## Changelog

| Date       | Change                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| 2026-07-03 | Support-request parity: hero+wizard merge, 2-col contact fields, Issue details divider, trust line, sidebar copy |
| 2026-07-03 | Design parity implementation: icons, cards, hero, sidebar, GF variant, mobile layout                             |
| 2026-07-03 | Moved to `tx-headless-frontend/docs/cancellations-refunds/`                                                      |
| 2026-07-03 | Created design progress tracker from Netlify prototype review                                                    |

---

## Next actions

1. [x] Automated wizard + hub tests (Vitest + Playwright)
2. [x] Keyboard focus + URL sync polish
3. [x] Step transition animations
4. [ ] Optional: staging visual spot-check vs [prototype](https://candid-vacherin-76f840.netlify.app/support-request) before production deploy

---

_Training Excellence — Cancellations design parity tracker — July 2026_
