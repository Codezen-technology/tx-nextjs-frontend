## 1. Measurement infrastructure (design D1)

- [x] 1.1 Add a cache directory under `.context/figma/` and a note in the tracker on how dumps are refreshed; one `get_metadata` call per page, cached to disk, so re-runs cost no API quota
- [x] 1.2 Write the subagent brief used for every page: read the cached dump, return only `property → value → node id` for the properties this change needs, never the metadata itself
- [x] 1.3 Confirm the 440 frames exist for each covered page and record which do not (design Open Question) — a page with no mobile frame gets no derived mobile targets

## 2. Resolve the six divergent node pairs (design D2)

Per pair: measure both candidates on the properties Class A needs, then record
authoritative node + evidence, or record the disagreement and mark blocked.

- [x] 2.1 Homepage — `4571:10560` vs `6013:89909`. Largest section (~21 issues); do this one first so a stall surfaces early
- [x] 2.2 Blog — `4900:75788` vs `6015:127034`
- [x] 2.3 (canvas measured; rival sampled out — see resolution note) Blog single — `4040:11134` vs `6015:127141`
- [ ] 2.4 All Courses — `3306:50109` vs `6015:96163` (v2)
- [ ] 2.5 Category — `3294:42427` vs `6015:108699`
- [ ] 2.6 About Us — `6239:102399` vs `6015:129608`. The one pair citing the _newer_ node, so do not assume the blanket rule applies
- [ ] 2.7 Record the three pages with no valid design reference (Cancellations, Priority Support, Privacy Policy) as such — their items get no derived targets
- [ ] 2.8 Commit the node resolution table. No code yet

## 3. Derive and record targets (design D3)

- [x] 3.1 Create the target table: page → property → breakpoint → expected value → tolerance → source node
- [~] 3.2 Hero top/bottom spacing — measured **80 px** at 1920; applying is entangled with the deferred container decision — replace the report's "80–100px" with the measured value per page
- [~] 3.3 **Measured, needs a second look** — frame shows 32 px between category sections and 40 px after trending; the report says 40. Mobile section spacing (440) — measured value, not the report's "40px", if they differ
- [x] 3.4 Laptop side padding (1280) — measured **128 px**, applied, verified exact in-browser
- [ ] 3.5 Dropdown right padding — Checkout, Priority Support
- [ ] 3.6 Section header weight and casing — record both the weight and whether Title Case is what the frame actually shows
- [ ] 3.7 Card title hover colour — record the resting and hover token
- [ ] 3.8 Related-course section title sizing
- [ ] 3.9 Cart card content parity — enumerate the specific properties that differ, rather than carrying "parity with Figma" forward as one unmeasurable item
- [ ] 3.10 Sweep the report's remaining Class A items into the table; anything with no measurable target is recorded as blocked, not silently dropped
- [ ] 3.11 Commit the target table. Still no code

## 4. Fold in the Class E items measurement can answer

- [ ] 4.1 Mobile hero text field — measure the 440 frame; apply if unambiguous
- [ ] 4.2 Homepage search button shape and colour — check whether the frame settles it; escalate if not
- [ ] 4.3 Homepage section spacing ("took too much space") — same
- [ ] 4.4 Icon colours ×3 — pick the token clearing 4.5:1 contrast; record the ratio as the justification
- [ ] 4.5 Too-dark hover — lighter neutral meeting contrast; record the ratio
- [ ] 4.6 Cancellations button label contrast — same
- [ ] 4.7 Re-record whatever remains as `BLOCKED-DESIGN` with what specifically is still missing, replacing the current list

## 5. Apply the values (design D5, one commit per page)

- [x] 5.1 Shared utilities in `globals.css` first — anything used by more than one page
- [ ] 5.2 Homepage
- [ ] 5.3 Blog and Single Blog
- [ ] 5.4 All Courses and Category
- [ ] 5.5 Cart and Checkout
- [ ] 5.6 Remaining marketing pages
- [ ] 5.7 Confirm no applied value contradicts a shipped Class B or Class C fix — the ToC `scroll-mt-24` and the image sizing floors both encode spacing

## 6. Fidelity check (design D3, D4)

- [ ] 6.1 Add an E2E spec that reads the target table and asserts computed values, one case per row
- [ ] 6.2 Failure messages must name page, property, breakpoint, expected and observed — a bare "expected 80 got 64" is not actionable across 27 items
- [ ] 6.3 Run under all three viewport projects
- [ ] 6.4 Mutation-test it: change one applied value and confirm the check fails with the right message, then revert
- [ ] 6.5 Confirm the check passes when an _uncovered_ property on the same page changes, so it has not become de-facto visual regression

## 7. Close-out

- [ ] 7.1 Update `QA_REPORT_PROGRESS.md` — Class A counts, and move any Class E item that measurement resolved
- [ ] 7.2 Update `.context/qa-tracker.md` with per-item status and the measurement as evidence
- [ ] 7.3 Full gate: `pnpm typecheck && pnpm lint && pnpm test` plus E2E, compared against the known pre-existing baseline
- [ ] 7.4 Write the PR description, stating which items measurement resolved, which stayed blocked, and what specifically is still needed for each
