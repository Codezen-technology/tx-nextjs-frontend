## Why

The "Rate this course" review modal and the "Congratulations" completion modal in the player have design inconsistencies:

1. **Review modal defaults to 0 stars** — learners must click a star before submitting, adding friction to what should be a quick action. The modal also uses raw `<input>` and `<textarea>` elements with ad-hoc styling (`border px-3 py-2 text-sm`) instead of the project's established form field system (`MARKETING_FIELD_CLASS` from `form-field.tsx`), resulting in inconsistent focus rings, placeholder colors, and padding compared to the certificate and contact forms.

2. **Completion modal uses hardcoded pink (`#EE3C7A`)** for the heading and icon, which is not in the design token system. It also uses a raw `<button>` instead of the shadcn `Button` component, and applies inline `style` attributes for colors and shadows instead of Tailwind classes. The brand navy (`#0f217d` / `#3f4d97`) used elsewhere in the dashboard should be the heading color.

## What Changes

- **Review modal**: Default star rating changes from 0 to 5. Input and textarea adopt `MARKETING_FIELD_CLASS` for consistent focus states, border radius, and placeholder styling. Add visible `<label>` elements. Add helper text above stars.
- **Completion modal**: Replace pink (`#EE3C7A`) heading/icon with brand navy (`#0f217d`) and teal accent (`#16c2d5`). Replace raw `<button>` with shadcn `Button variant="outline"`. Replace inline `style` attributes with Tailwind classes. Add `font-suse` / `font-open-sans` font classes.

## Capabilities

### New Capabilities

_(none — this is a design fix, not a new feature)_

### Modified Capabilities

- `design-token-fidelity`: Extending the principle of design-system-consistent styling to player modals (review + completion). Currently only covers public marketing pages; this adds player overlay modals to the same standard.

## Impact

- **Files modified**: `src/components/player/review-modal.tsx`, `src/components/player/completion-modal.tsx`
- **New imports**: `MARKETING_FIELD_CLASS`, `MARKETING_LABEL_CLASS` from `@/components/ui/form-field`; `Button` from `@/components/ui/button`; `cn` from `@/lib/utils/cn`
- **No API changes**: The POST endpoint, auth headers, error handling, and cache invalidation remain identical
- **No breaking changes**: The review submission body shape is unchanged; default rating of 5 is purely a UX improvement
