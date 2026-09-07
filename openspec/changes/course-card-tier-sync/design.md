## Context

See `proposal.md` — Why.

Two facts about the current code shape the approach:

1. `CoursePurchaseCard` already has a single funnel for quantity, `commitQuantity()`, but
   it only handles one direction (`if (next > 1) setTab("teams")`). The decrement button
   bypasses that funnel entirely and re-implements clamping plus its own
   `if (next === 1) setTab("me")`. So the invariant lives in two places and is complete in
   neither.
2. `BulkDiscountTable` fetches its own tiers via `useBulkTiers()` and knows nothing about
   quantity. The card independently calls the same hook and passes the resolved tier
   through `bulkTierUnitPrice()` to produce the header price.

`resolveBulkTier()` already encodes the non-obvious selection rule — tiers may overlap or
arrive unsorted, and the highest percentage wins, not the first match. Any highlight logic
that does not go through it will disagree with the header price on exactly the inputs the
rule exists for.

## Goals / Non-Goals

**Goals:**

- One place derives the tab from the quantity, so no control can be added later that
  forgets the rule.
- The highlighted row and the header price are guaranteed to come from the same tier
  by construction, not by two implementations agreeing.

**Non-Goals:**

- No change to tier maths, currency formatting, or the cart payload.
- No change to what clicking a tab does (`selectTab("me")` still resets quantity to 1).
- The table stays read-only: rows are not clickable shortcuts to a quantity. That is a
  plausible follow-up but it is a new interaction with its own design question (which
  quantity does "20 - 49 users" set?) and is out of scope here.

## Decisions

### Derive the tab inside `commitQuantity()`, and route the decrement button through it

`commitQuantity()` gains the complete rule:

```
const next = clampQuantity(value);
setQty(next);
setTab(next > 1 ? "teams" : "me");
```

The decrement button drops its bespoke clamp/`setQty`/`setTab` block and calls
`applyQuantity(qty - 1)` like the increment button already does. Typing and blur reach the
same funnel unchanged.

_Alternative considered:_ a `useEffect` on `qty` that syncs the tab. Rejected — it makes
the tab a lagging echo of state rather than a product of the same commit, and it would
fight `selectTab("me")`, which sets both the tab and the quantity in one go.

_Consequence worth naming:_ the tab becomes fully derived from quantity, so a buyer can
no longer sit on "For teams" at a quantity of one. That is the requested behaviour, and it
matches what "For me" already means (`selectTab("me")` forces quantity to 1), so the two
directions now agree instead of only one of them holding.

### Pass `quantity` into `BulkDiscountTable` and resolve the active tier there

The table takes a new required `quantity: number` prop and calls
`resolveBulkTier(tiers, quantity)` on the tiers it already has. A row is active when it is
that exact tier object — identity comparison against the array element, not a re-derived
match — so overlapping tiers cannot produce two active rows.

_Alternative considered:_ have the card resolve the tier and pass the active tier (or its
index) down. Rejected — the card and the table each call `useBulkTiers()` and TanStack
Query dedupes them, so both hold the same array instance and identity holds. Passing the
quantity keeps the table's props describing the buyer's input rather than an already-
computed answer, and leaves the table usable anywhere the quantity is known.

_Rejected outright:_ comparing on `tier.min`/`tier.max`. Two configured tiers can share a
band with different percentages; identity is exact and free.

### Active-row treatment

Colour alone is not sufficient (`interactive-contrast` and the WCAG 1.4.1 rule the repo
already follows elsewhere). The active row gets:

- a filled/raised background against the `bg-neutral-20` group, and the label in
  `text-neutral-900` instead of `text-neutral-500`;
- a non-colour cue — the label rendered semibold with a leading marker — so the row is
  identifiable in greyscale;
- `aria-current="true"` on the row, plus a visually hidden "current tier" phrase, so the
  state is announced rather than seen only.

Exact token values are a Figma-fidelity question for implementation; the requirement is
the pair of cues, not a specific hex.

## Risks / Trade-offs

- **A buyer intentionally viewing team pricing at quantity 1 is bounced to "For me".**
  → Accepted and intended: it is the requested behaviour, and the card already treated
  "For me" as meaning exactly one licence. The team tier table remains reachable by
  raising the quantity, which is the action that makes team pricing real.

- **`BulkDiscountTable`'s new prop is required, so any other call site breaks the build.**
  → Intended. There is one call site today (`course-purchase-card.tsx`); a compile error
  is the right outcome for a future caller that has no quantity to show a highlight for.
  Verified by `pnpm typecheck` rather than assumed.

- **Identity comparison depends on card and table sharing one tiers array.**
  → They do, via the shared query cache, and the test suite mocks `useBulkTiers` with a
  single literal. If a future refactor gives the table its own fetch, the highlight would
  silently stop matching. Mitigated by a test that asserts the active row against a header
  price produced from overlapping tiers — the case where a mismatch would show.

- **Tiers load after first paint.** → The table already renders a skeleton while
  `isLoading` and returns `null` for an empty list; no row is active in either state,
  which is correct — an unknown tier is not a highlighted one.
