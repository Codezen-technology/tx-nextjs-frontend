## 1. State Logic Changes

- [x] 1.1 Remove auto-tab-switch from `commitQuantity` (delete `setTab(next > 1 ? "Business" : "Individual")`)
- [x] 1.2 Add `showBulkPricing` state: `const [showBulkPricing, setShowBulkPricing] = useState(false)`
- [x] 1.3 Reset `showBulkPricing` to `false` when switching tabs in `selectTab`
- [x] 1.4 Update `BulkDiscountTable` currency display to use `Intl.NumberFormat` (fixes "GBP" → "£")

## 2. Individual Tab Content

- [x] 2.1 Add "Extra X% saved" badge next to quantity stepper (visible when `tab === "Individual" && qty > 1 && activeTier`)
- [x] 2.2 Add "See Bulk Pricing" / "Hide Bulk Pricing" toggle link with chevron icon
- [x] 2.3 Move `BulkDiscountTable` rendering from Business tab to Individual tab (conditional on `showBulkPricing`)
- [x] 2.4 Pass `activeTier` info to badge from `resolveBulkTier`

## 3. Business Tab Content

- [x] 3.1 Remove price display, quantity stepper, and bulk table from Business tab
- [x] 3.2 Add "Built for Your Whole Team" heading (SUSE bold)
- [x] 3.3 Add description text: "Flexible, CPD-certified online courses..."
- [x] 3.4 Add divider line
- [x] 3.5 Add "Why Choose Training Excellence for Teams?" subheading
- [x] 3.6 Add team benefit bullet points (5 items with check icons)
- [x] 3.7 Add "Request a Quote" button linking to `/contact-us/`

## 4. BulkDiscountTable Restyling

- [x] 4.1 Remove checkmark column (the `w-5` slot with `<Check>` icon)
- [x] 4.2 Update header bg from `bg-neutral-40` to `bg-[#f5f6f8]`
- [x] 4.3 Remove active row highlight (`bg-secondary-50`, `aria-current`)
- [x] 4.4 Update discount badge colors: `bg-[#eaf2ec] text-[#4f9254]`
- [x] 4.5 Add `border-b border-[#f5f6f8]` to rows instead of gap

## 5. Test Updates

- [x] 5.1 Remove tests that expect auto-switching behavior (lines 105, 145, 154, 164, 176)
- [x] 5.2 Update "switches to teams tab" test to click Business tab directly
- [x] 5.3 Add test for bulk pricing toggle on Individual tab
- [x] 5.4 Add test for Business tab content (no qty, "Request a Quote" CTA)
- [x] 5.5 Add test for "Extra X% saved" badge visibility

## 6. Spec Updates

- [x] 6.1 Update `openspec/specs/single-course-page/spec.md` tab names from "For me"/"For teams" to "Individual"/"Business"
