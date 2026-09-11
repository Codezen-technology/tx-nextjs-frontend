## Context

The `CoursePurchaseCard` component (`src/components/courses/course-purchase-card.tsx`) is a sticky sidebar on the course detail page. It currently has two tabs ("Individual" and "Business") that share most content — both show pricing, quantity stepper, and the same feature list. The only difference is the bulk discount table appears on the Business tab.

The Figma designs specify two distinctly different tab experiences:

- **Individual**: Pricing + quantity + toggleable bulk pricing table + "Buy This Course"
- **Business**: Team value proposition + "Request a Quote" CTA (no pricing, no quantity)

## Goals / Non-Goals

**Goals:**

- Match the Figma designs for both Individual and Business tabs
- Remove auto-tab-switch behavior (quantity changes don't switch tabs)
- Add "See/Hide Bulk Pricing" toggle on Individual tab
- Add "Extra X% saved" badge when quantity > 1
- Restyle `BulkDiscountTable` to match Figma (remove checkmark column, update colors)
- Update tests to cover new behavior

**Non-Goals:**

- Changing the bulk pricing API or tier data structure
- Modifying the `BulkDiscountTable` component's data fetching logic
- Changing the purchase flow or cart behavior

## Decisions

### Decision 1: Remove auto-tab-switch from `commitQuantity`

**Current**: `setTab(next > 1 ? "Business" : "Individual")` in `commitQuantity`
**New**: Delete this line. Tab stays on user's selection.

**Rationale**: The Figma designs show the Individual tab with a quantity stepper and bulk pricing — quantities > 1 are valid on Individual. Auto-switching is confusing.

**Alternative considered**: Keep auto-switch but only from Individual→Business. Rejected because Figma shows bulk pricing on Individual tab.

### Decision 2: Move bulk pricing table to Individual tab with toggle

**Current**: `{tab === "Business" && pricing && <BulkDiscountTable />}`
**New**: `{tab === "Individual" && showBulkPricing && pricing && <BulkDiscountTable />}`

**Rationale**: Figma shows the bulk pricing table under the Individual tab, toggled by "See Bulk Pricing" / "Hide Bulk Pricing" link.

**State**: Add `const [showBulkPricing, setShowBulkPricing] = useState(false)`

### Decision 3: Business tab is purely informational

**Current**: Business tab shows pricing, quantity, bulk table, "Buy This Course"
**New**: Business tab shows:

- "Built for Your Whole Team" heading
- Description text
- "Why Choose Training Excellence for Teams?" with bullet points
- "Request a Quote" button → `/contact-us/`

**Rationale**: Figma design shows no pricing or purchase controls on Business tab. The CTA is "Request a Quote" which is a lead generation flow, not direct purchase.

### Decision 4: Restyle BulkDiscountTable to match Figma

Changes to `bulk-discount-table.tsx`:

- Remove checkmark column (the `w-5` slot with `<Check>` icon)
- Header bg: `bg-neutral-40` → `bg-[#f5f6f8]` (Neutral/N20)
- Remove active row highlight (`bg-secondary-50`, `aria-current`)
- Discount badge: `bg-neutral-700 text-white` → `bg-[#eaf2ec] text-[#4f9254]`
- Row separator: add `border-b border-[#f5f6f8]` instead of gap

**Rationale**: Directly matches Figma design node 6539:8940.

### Decision 5: "Extra X% saved" badge placement

Show on Individual tab, next to the quantity stepper, when `qty > 1` and `activeTier` exists.

```tsx
{
  tab === "Individual" && qty > 1 && activeTier ? (
    <span className="bg-[#eaf2ec] text-[#198754] ...">Extra {activeTier.percentage}% saved</span>
  ) : null;
}
```

**Rationale**: Figma node 6522:2940 shows this badge inline with the quantity stepper.

## Risks / Trade-offs

- **Test breakage**: Multiple tests expect auto-switching behavior. These need updating. → Mitigation: Update tests as part of implementation.
- **BulkDiscountTable styling change**: The checkmark column removal and color changes affect the component's visual identity. → Mitigation: Matches Figma exactly; the component is only used in one place.
- **Business tab loses purchase capability**: Users on Business tab must navigate to contact form. → Mitigation: This is the intended design for lead generation.
