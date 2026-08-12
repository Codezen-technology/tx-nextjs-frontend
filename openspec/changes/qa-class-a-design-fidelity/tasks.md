## 1. Measurement infrastructure (design D1)

- [x] 1.1 Add a cache directory under `.context/figma/` and a note in the tracker on how dumps are refreshed; one `get_metadata` call per page, cached to disk, so re-runs cost no API quota
- [x] 1.2 Write the subagent brief used for every page: read the cached dump, return only `property → value → node id` for the properties this change needs, never the metadata itself
- [x] 1.3 Confirm the 440 frames exist for each covered page and record which do not (design Open Question) — a page with no mobile frame gets no derived mobile targets

## 2. Resolve the six divergent node pairs (design D2)

Per pair: measure both candidates on the properties Class A needs, then record
authoritative node + evidence, or record the disagreement and mark blocked.

- [x] 2.1 Homepage — `4571:10560` vs `6013:89909`. Largest section (~21 issues); do this one first so a stall surfaces early → **RESOLVED `6013:89909`**
- [x] 2.2 Blog — `4900:75788` vs `6015:127034` → **identical, either node**
- [x] 2.3 Blog single — `4040:11134` vs `6015:127141` → canvas measured; rival sampled out, see resolution note
- [x] 2.4 All Courses — `3306:50109` vs `6015:96163` (v2) → **identical, either node**. "v2" is a naming artefact, not a revision
- [x] 2.5 Category — `3294:42427` vs `6015:108699` → **identical, either node**
- [x] 2.6 About Us — `6239:102399` vs `6015:129608` → **`6239:102399`**. The doc node is a _section_ holding Desktop 1920 + Laptop 1280 + Mobile 441; the canvas node is the Desktop frame alone. Superset wins, and it is the only source of 1280/440 targets
- [x] 2.7 Record the three pages with no valid design reference (Cancellations, Priority Support, Privacy Policy) as such — their items get targets from the live WP site instead, per the runbook's finding 3
- [x] 2.8 Commit the node resolution table. No code yet

**All six pairs are resolved. Nothing in this change is gated on a Figma decision.**

## 3. Cross-page invariants and shared targets (design D3)

Targets that more than one page depends on. Page-specific measurement moved into
§5, so each page is measured and fixed in one pass rather than twice.

- [x] 3.1 Create the target table: page → property → breakpoint → expected value → tolerance → source node
- [x] 3.2 Grid invariants — content **1296**, side padding **312 / 128 / 24**, gutter **24**, card **306**, section rhythm **80**. Hold across eight independently measured nodes
- [x] 3.3 Laptop side padding (1280) — measured **128 px**, applied, verified exact in-browser. Independently confirmed a second time by the About Us laptop frame
- [~] 3.4 Section rhythm at 440 — frame shows **32** between category sections and **40** after trending; the report says 40. Two values exist; the owning page slice picks which one its row means
- [x] 3.5 Section heading weight — **per token, not per role.** The frame carries `Heading/Medium/H2` (32/500) _and_ `Heading/Bold/H2` (32/700) and picks by size: 48→700, 40→**500**, 32→700. Recorded in `targets.md`; ⚠️ contradicts commit `1c92a4e` for three 40px About Us headings — decision belongs to §5.8
- [ ] 3.6 Section heading **casing** — read Title Case off the frames. Weight is measured, casing is not
- [ ] 3.7 Card title hover colour — record the resting and hover token
- [ ] 3.8 Cart card content parity — enumerate the specific properties that differ, rather than carrying "parity with Figma" forward as one unmeasurable item
- [ ] 3.9 Confirm no derived target contradicts a shipped Class B or Class C fix — the ToC `scroll-mt-24` and the image sizing floors both encode spacing

## 4. Class E items measurement can answer

- [ ] 4.1 Mobile hero text field — measure the 440 frame; apply if unambiguous
- [ ] 4.2 Homepage search button shape and colour — check whether the frame settles it; escalate if not
- [ ] 4.3 Homepage section spacing ("took too much space") — same
- [ ] 4.4 Icon colours ×3 — pick the token clearing 4.5:1 contrast; record the ratio as the justification
- [ ] 4.5 Too-dark hover — lighter neutral meeting contrast; record the ratio
- [ ] 4.6 Cancellations button label contrast — same
- [ ] 4.7 Re-record whatever remains as `BLOCKED-DESIGN` with what specifically is still missing, replacing the current list

## 5. Apply, one slice per commit (design D5)

Ordered per `docs/qa/QA_EXECUTION.md`: unblock first, then descending open count,
with pages sharing a fix kept adjacent. Each slice runs the runbook's eight-step
recipe — scope, measure, derive, **assert before fixing**, apply, verify, flip the
row in `QA_BY_PAGE.md`, gate and commit.

Slices 5.2–5.8 are independent; the order is by value, not dependency.

- [x] 5.1 Shared utilities in `globals.css` — anything used by more than one page
- [x] 5.2 **Homepage** — all 4 rows closed. `A1` **FIXED**: frame band is 844 around a 577 column → 133/134 inset, not the report's "80–100"; `lg:py-42.5` → `lg:py-[133px]` · `A3` **FIXED**: weight 700 asserted; casing is not a defect — the frame mixes cases, so there is no Title Case rule · `A4` **FIXED**: dropped `group-hover:text-secondary-500` · `A2` **FIXED** by 5.2a below
- [x] 5.2a **Vertical rhythm ramp, mobile step** (closes `A2`) — sections are flush and each contributes its own padding, so the inter-section gap is the sum of two. Measured gaps: **80 @1920, 56 @1280, 40 @440**; build shipped 112–144 at 440. The 440 step is applied as `--spacing-section` (20px, half the gap) on every top-level section of `/`, `/pricing`, `/cancellations` and `/support-request`; each keeps its own `lg:` desktop padding, so 1920 and 1280 are untouched. The 32 that also appears at 440 is intra-section card-block pitch, not rhythm — settled in `.context/figma/targets.md`. Heroes are excluded: a hero owns its own inset (`A1`). Banded sections carry a further 40 in the frame and 20 here — recorded as a known deviation, not silently absorbed
- [ ] 5.2b **Vertical rhythm ramp, desktop steps** — 80 @1920 and 56 @1280 are measured but unapplied; the build ships 128–160 at 1920. No open QA row asks for them and every section would move, so this is its own slice
- [x] 5.3 **Blog** — moved to its own change, `qa-blog-design-fidelity`, and closed there. All 3 rows `FIXED`: `A2` hero inset measured at **85** and applied as `2xl:py-[85px]` (build shipped 80) · `A3` verify-and-close, already exactly 128 at 1280 and already guarded · `A4` weight already 700 and now asserted; casing recorded as not-a-defect on the Blog frame's own evidence. One page, one owner — do not re-work it here
- [ ] 5.4 **Course Category** (3 rows) — `A1` 128px @1280 · `A2` hero spacing @1920 (hero band is **480**, not All Courses' 320 — do not share the target) · `A3` heading casing
- [ ] 5.5 **All Courses** (2 rows) — `A2` hero spacing @1920 (hero band **320**) · `A3` heading casing. Measure headings alongside 5.4
- [ ] 5.6 **Checkout + Priority Support** (3 rows) — one dropdown fix closes both. `pr-10` (40px) must drop to 16px _and_ the chevron at `right-3` must move, or the text overlaps. `CHECK-A2` headings are `text-2xl` (24px), a size with no measured token — verify before closing. No Figma ref for either page → live-WP fallback
- [ ] 5.7 **Contact + Cancellations** (2 rows) — both hero spacing @1920, both live-WP fallback. Record the URL and value as the source so the rows can close rather than staying `MANUAL-VISUAL`
- [ ] 5.8 **About Us** (0 QA rows) — settle the 3.5 contradiction: revert the three 40px headings to `font-medium` per the frame, or record a design ruling that supersedes it. Also fold About Us's measured 1280/440 targets into the shared ramp if they disagree with what ships

## 6. Fidelity check (design D3, D4)

- [x] 6.1 Add an E2E spec that reads the target table and asserts computed values, one case per row
- [x] 6.2 Failure messages must name page, property, breakpoint, expected and observed — a bare "expected 80 got 64" is not actionable across 27 items
- [x] 6.3 Run under all three viewport projects
- [x] 6.4 Mutation-test it: change one applied value and confirm the check fails with the right message, then revert
- [x] 6.5 Confirm the check passes when an _uncovered_ property on the same page changes, so it has not become de-facto visual regression

## 7. Close-out

- [ ] 7.1 Update `QA_REPORT_PROGRESS.md` — Class A counts, and move any Class E item that measurement resolved
- [ ] 7.2 Update `docs/qa/QA_BY_PAGE.md` with per-item status and the measurement as evidence (`.context/qa-tracker.md` was removed; `QA_BY_PAGE.md` supersedes it)
- [ ] 7.3 File the Class D proposals as their own OpenSpec changes: Team Training page, All Courses mobile, Checkout section, Category FAQ, Blog + All Courses hero gradient, Single Blog mobile ToC drawer, Pricing third card
- [ ] 7.4 Full gate: `pnpm typecheck && pnpm lint && pnpm test` plus E2E, compared against the known pre-existing baseline (`smoke:9`, `auth-flow:15`, `auth-flow:22`, `cancellations:11`, `cancellations:28`)
- [ ] 7.5 Write the PR description, stating which items measurement resolved, which stayed blocked, and what specifically is still needed for each
