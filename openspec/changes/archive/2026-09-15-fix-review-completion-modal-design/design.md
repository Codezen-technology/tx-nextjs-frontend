## Context

Two player overlay modals need design fixes:

- `src/components/player/review-modal.tsx` (85 lines) — "Rate this course" dialog with star rating, title input, textarea, and cancel/submit buttons. Uses Zustand store for open/close state. Submit handled by `useSubmitReview` hook which POSTs to `/api/courses/{id}/reviews` via `bffJson`.

- `src/components/player/completion-modal.tsx` (65 lines) — "Congratulations!" dialog shown on course completion. Has a "Leave a review" button (opens review modal) and "Order your certificate" link. Uses hardcoded pink `#EE3C7A` and inline `style` attributes.

Both use the shadcn `Dialog`/`DialogContent` component from `@/components/ui/dialog.tsx`.

The project has a mature form field system in `src/components/ui/form-field.tsx` with constants `MARKETING_FIELD_CLASS` and `MARKETING_LABEL_CLASS` used by certificate forms, contact forms, and gravity forms.

## Goals / Non-Goals

**Goals:**

- Default review rating to 5 stars (reduce friction)
- Use `MARKETING_FIELD_CLASS` for review modal inputs (consistency with certificate/contact forms)
- Replace completion modal's pink with brand navy (`#0f217d`) and teal (`#16c2d5`)
- Replace raw `<button>` with shadcn `Button` in completion modal
- Replace inline `style` with Tailwind classes in completion modal
- Add `font-suse` / `font-open-sans` font classes to completion modal

**Non-Goals:**

- Changing the review API contract or error handling
- Modifying the `useSubmitReview` hook logic
- Redesigning the modal layout or adding new features
- Changing the Dialog base component

## Decisions

### 1. Use `MARKETING_FIELD_CLASS` directly instead of `FormInput`/`FormTextarea` components

**Choice**: Import the constant and apply via `className`.

**Why**: The review modal's inputs are simple elements with local state. Wrapping them in `FormInput`/`FormTextarea` would add ref forwarding overhead and the `formInputVariants` CVA machinery for no benefit. The constant gives the same visual result.

**Alternative considered**: Use `FormInput`/`FormTextarea` components — rejected because they add unnecessary abstraction for two simple inputs.

### 2. Keep completion modal colors as Tailwind arbitrary values

**Choice**: Use `text-[#0f217d]`, `bg-[#3f4d97]`, `text-[#16c2d5]` instead of mapping to design tokens.

**Why**: The brand navy (`#0f217d`, `#3f4d97`) and teal (`#16c2d5`) are used extensively in the dashboard pages (subscription, profile, my-learning) as arbitrary values. The `lms-primary` token resolves to `#0f217d` but `#3f4d97` has no token. Consistency with the existing dashboard pattern means arbitrary values here.

**Alternative considered**: Map to `text-lms-primary` / `bg-lms-primary` — rejected because the button uses `#3f4d97` (lighter navy) which has no token, and mixing token + arbitrary for the same color family is confusing.

### 3. Default rating 5, remove disabled guard

**Choice**: `useState(5)` and remove `disabled={rating === 0}` from submit button.

**Why**: With default 5, the rating is always >= 1 so the disabled check is dead code. Removing it simplifies the component and makes the intent clear.

**Alternative considered**: Keep `disabled={rating === 0}` as defensive code — rejected because it's unreachable and misleading.

## Risks / Trade-offs

- **[Risk]** Arbitrary color values (`text-[#0f217d]`) drift from tokens over time → **Mitigation**: These exact values are already used in 20+ dashboard files; consolidating them into tokens is a separate, larger effort.
- **[Risk]** Defaulting to 5 stars may inflate average ratings → **Mitigation**: This is a deliberate product decision to reduce friction; the learner can still change it.
- **[Trade-off]** Using the constant instead of FormInput component means no automatic error state styling → **Mitigation**: The review modal doesn't show field-level errors (errors are toast-only), so this is fine.
