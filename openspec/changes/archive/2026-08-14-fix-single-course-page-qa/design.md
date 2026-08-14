## Context

See `proposal.md` — **Why**. This section records the audit that produced the scope, so
the implementation does not repeat it.

### 1. Report item → code verdict

Source: QA report, **Single Course Page** section (Google Doc, tab `t.okgmx3x8u3ib`),
read 2026-08-14. Every item was checked against the code before this change was written.

| #           | Report item (Solution(Dev))         | Verdict                    | Evidence                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ----------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1           | Remove the hero background image    | **Already satisfied**      | `course-banner.tsx:56–65` paints `BANNER_OVERLAY_GRADIENT` over the section; the featured image renders only as the 306px sidebar thumbnail (`:74–83`). No background image exists to remove                                                                                                                                             |
| 2           | Hero body text should be longer     | **CONTENT-GAP**            | The banner renders title, rating and feature lists — no body paragraph. Nothing in this repo to lengthen                                                                                                                                                                                                                                 |
| 3           | Body line-height 150%               | **FIXED**                  | `QA-COURSE-A1`; `prose-wp p` is `leading-normal` in `globals.css:269–273`                                                                                                                                                                                                                                                                |
| 4a          | Arrow icons almost invisible        | **OPEN, target unlocated** | No arrow glyph exists in the page's own components. Candidates: curriculum `ChevronDown` at `text-neutral-500` on a `bg-neutral-30` row (`course-flat-curriculum.tsx:110–115`), and the `prose-wp` list marker at `opacity: 0.6` of `text-neutral-500` (`globals.css:280–290`). Must be located from the report screenshot before fixing |
| 4b          | Related-course title too small      | **PARTIAL-FIX**            | `course-related.tsx:30` is `text-[32px] font-bold` but omits `font-suse` and `leading-[1.2]`; the loading branch at `:16` is still `text-xl font-medium`                                                                                                                                                                                 |
| 4c          | Buy CTA → cart                      | **FIXED**                  | `QA-COURSE-B2`; `course-purchase-card.tsx:94` pushes `/cart`                                                                                                                                                                                                                                                                             |
| 5           | Remove breadcrumbs                  | **OPEN**                   | `page.tsx:188` renders `<CourseBreadcrumb />`; component at `course-breadcrumb.tsx:11–43`                                                                                                                                                                                                                                                |
| 6           | Remove curriculum hours             | **OPEN**                   | Three sites in `course-flat-curriculum.tsx`: summary `:88`, section header `:121–123`, unit row `:146–148`                                                                                                                                                                                                                               |
| 7           | Hover on FAQ +/− icon               | **OPEN**                   | `course-faq.tsx:31–45` — the toggle button carries no `hover:` rule at all                                                                                                                                                                                                                                                               |
| 8           | Hover on "For me" / "For teams"     | **PARTIAL-FIX**            | `course-purchase-card.tsx:112–117` — the inactive tab has `hover:text-neutral-700`; the active tab has none                                                                                                                                                                                                                              |
| 9 (mobile)  | Rating should match the course card | **OPEN, was mis-filed**    | The report's `Solution(Dev)` is populated, not blank — `QA-COURSE-E1` was filed `BLOCKED-DESIGN` on a stale reading. Both surfaces read the same normalized fields (`courses.ts:199–201`), so this is presentation, not data                                                                                                             |
| 10 (mobile) | Bullet body text breaks mid-line    | **OPEN, unmeasured**       | Needs a 440 measurement before a fix; `prose-wp ul li` is `relative pl-5` with an absolutely-positioned marker (`globals.css:274–290`)                                                                                                                                                                                                   |

Two report items therefore close without code, six need a fix, and two need a
measurement first.

### 2. Existing constraints

- `docs/qa/QA_BY_PAGE.md` is the only place a status flips (`QA_EXECUTION.md`), and
  `scripts/qa-doc-check.mjs` enforces four structural assertions inside `pnpm test`
- `e2e/course-detail.spec.ts` already exists and is scoped to this route
- The page's other section headings are already on `font-suse text-[32px]
leading-[1.2] font-bold` (`course-faq.tsx:25`, `course-flat-curriculum.tsx:81`,
  `course-screenshots.tsx:53`, `course-what-you-learn.tsx:10`) — the token is
  established, not being invented here

## Goals / Non-Goals

**Goals:**

- Close the six verified defects with the smallest change that satisfies the spec
- Give the two unmeasured items a measurement step before any code
- Bring `QA_BY_PAGE.md`'s Single Course section up to the full report, so the page index
  stops under-reporting

**Non-Goals:**

- Redesigning the banner, purchase card or curriculum
- Touching `QA-COURSE-C1` (`CANT-REPRODUCE` — hidden desktop copies at 440, correctly
  diagnosed)
- A general hover/contrast sweep across other pages. `interactive-contrast` already owns
  the cross-page contrast floor; this change stays on `/course/[slug]`

## Decisions

### D1 — Delete the visual breadcrumb, keep the JSON-LD

`buildBreadcrumbSchema` in `page.tsx` and `<CourseBreadcrumb />` are independent. QA
flagged the visible bar; search engines consume the schema. Removing both would trade a
visual defect for an SEO regression, which `SEO.md` forbids.

`CourseBreadcrumb` is imported only by this route — confirm with a repo-wide grep, then
delete the component file rather than leaving dead code behind.

_Alternative considered:_ hide the bar with `sr-only`. Rejected — an invisible nav is
still in the a11y tree and still announced by screen readers, so it does not satisfy the
requirement, it only hides the violation from a sighted reviewer.

### D2 — Strip durations from the component, not from the API

`formatDuration` stays; the curriculum stops calling it. `durationSeconds` remains on
the type and in the payload, because the learn-player and the purchase card's
`durationLabel` both use it. Removing the field would be a much larger blast radius for
a display-only complaint.

_Alternative considered:_ a `showDuration` prop. Rejected — no caller wants `true`; a
flag with one value is a config option nobody asked for.

### D3 — Hover states use the tokens already on the surface

FAQ rows sit on `bg-secondary-50`; the hover goes to `bg-secondary-100`, which is
already the open-answer background on the same component. The purchase tabs get a
background shift on both states rather than a colour-only shift, because the active tab
is already at its strongest colour and has nowhere to go.

_Alternative considered:_ a new `--hover-*` token in `globals.css`. Rejected — one page,
two components; `QA_EXECUTION.md` §5 says a shared token only when more than one page
needs it.

### D4 — Locate the arrow before fixing it

The report's screenshot is not in the repo and no arrow glyph exists in the page's own
components. Guessing which glyph was flagged risks "fixing" a control nobody complained
about while the real one stays invisible. The task list therefore measures both
candidates at their rendered colours, applies the 3:1 floor from the spec, and fixes
whichever fails. If both pass, the row closes `CANT-REPRODUCE` with the measured ratios
recorded — that is a legitimate outcome, and it is evidence, unlike "looks fine".

### D5 — Rating parity is enforced by deleting the fabricated rating, not by copying it

**Revised after measurement.** The premise above — that both surfaces read the same
number and differ only in rounding — was half right. `normalizeCourse` does yield one
`rating` / `ratingCount` (`courses.ts:199–201`), so the data is shared. But
`course-card.tsx:85–90` falls back to a **hard-coded** value when that data is absent:

```tsx
<span className="text-sm">{course.id % 2 === 0 ? "4.7" : "4.9"}</span>
```

No course in either catalogue carries a rating today (`rating_count` is 0 for all 50
items locally and all 50 on `trainingexcellence.org.uk`), so every card on the site
currently shows an invented 4.7 or 4.9, alternating by course ID, while the detail page
correctly shows nothing. That is the mismatch QA reported.

So the fix is on the card, and the direction reverses: the header does **not** follow
the card, because the card's value is not a rating. The placeholder is removed and both
surfaces render a rating only when one exists. The spec requirement was rewritten to say
this — parity is the consequence, not the rule.

Beyond the QA row, a fabricated rating is a factual claim about other buyers' opinions
shown next to a price. Keeping it to preserve a visual is not a trade this change is
willing to make silently, and the removal is called out for the user rather than buried
in a task list.

_Alternative considered:_ show the placeholder on both surfaces so they agree. Rejected
on the above.

### D6 — New QA-IDs continue the page's existing sequence

`A1`, `B2`, `C1`, `E1` are taken. New rows: `A2` breadcrumb, `A3` curriculum hours,
`A4` FAQ hover, `A5` purchase-tab hover, `A6` related heading, `A7` arrow contrast,
`A8` mobile bullet wrap, `B3` mobile rating (re-classified from `E1`, which is marked
`RECLASSIFIED` and points at `B3` rather than being deleted — the report's item numbers
must stay traceable).

### D7 — Tests live in `e2e/course-detail.spec.ts`

That file is already this route's home, and `Auto` references use the
`` `e2e/course-detail.spec.ts > test name` `` form, not `file:line` — the doc's own
legend calls line refs legacy because they go stale on insertion.

## Risks / Trade-offs

- **The arrow row closes as `CANT-REPRODUCE` and QA disagrees on re-test** → the
  measured ratios are recorded in the row's `Manual` cell, so the disagreement is about
  a number rather than an impression, and it re-opens with a target
- **Deleting `CourseBreadcrumb` breaks an unseen import** → grep before delete;
  `pnpm typecheck` catches the rest
- **Hover assertions are flaky under Playwright** → assert the computed style after an
  explicit `hover()` and `waitForFunction` on the style change, not on a screenshot
- **Removing durations reduces information density on a page that sells a course** →
  accepted; it is what the report asks for, and `durationLabel` still shows total
  duration in the purchase card, so the buyer still sees course length before paying
- **The doc-checker rejects the new rows** → run `pnpm test` before commit, per the
  recipe; assertions 3 and 4 (GAP ↔ Tests to write, index arithmetic) are the ones new
  rows usually trip

## Migration Plan

No data or API migration. Ships as one branch; each slice below is independently
revertable at file granularity. Rollback is `git revert` of the branch — nothing is
persisted and no cache tags change.

## Open Questions

- Which glyph the report's "arrow icons" screenshot points at. Deferrable: D4 resolves
  it by measurement, and either outcome is a defined row status. It does not change the
  spec or the task breakdown.
