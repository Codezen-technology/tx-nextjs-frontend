## 1. Review Modal — Default Rating & Design Fix

- [x] 1.1 Change `useState(0)` to `useState(5)` for the rating state
- [x] 1.2 Remove `disabled={rating === 0}` from the submit button (always >= 1 now)
- [x] 1.3 Import `MARKETING_FIELD_CLASS` and `MARKETING_LABEL_CLASS` from `@/components/ui/form-field`
- [x] 1.4 Replace raw `<input>` className with `MARKETING_FIELD_CLASS`
- [x] 1.5 Replace raw `<textarea>` className with `MARKETING_FIELD_CLASS`
- [x] 1.6 Add `<label>` elements above the title input and textarea using `MARKETING_LABEL_CLASS`
- [x] 1.7 Add helper text above star rating: `<p className="font-open-sans text-sm text-neutral-500">How would you rate this course?</p>`
- [x] 1.8 Add `py-4` to the star rating container div for spacing

## 2. Completion Modal — Brand Colors & Component Fix

- [x] 2.1 Import `Button` from `@/components/ui/button` and `cn` from `@/lib/utils/cn`
- [x] 2.2 Replace `style={{ color: "#EE3C7A" }}` on heading with `className="text-[#0f217d]"`
- [x] 2.3 Replace `text-[#EE3C7A]` on `PartyPopper` icon with `text-[#16c2d5]`
- [x] 2.4 Add `font-suse` to the "Congratulations!" heading
- [x] 2.5 Add `font-open-sans` to the body text `<p>` element
- [x] 2.6 Replace raw `<button>` for "Leave a review" with `<Button variant="outline">`
- [x] 2.7 Replace `style={{ backgroundColor: "#3F4D97", boxShadow: "..." }}` on certificate link with `className="bg-[#3f4d97] shadow-[0px_4px_10px_0px_rgba(63,77,151,0.3)]"`
- [x] 2.8 Remove the `style` import if no longer used

## 3. Verification

- [x] 3.1 Run `pnpm lint` — no errors
- [x] 3.2 Run `pnpm typecheck` — no errors
- [x] 3.3 Visual check: review modal opens with 5 stars pre-selected, inputs have focus rings matching certificate form
- [x] 3.4 Visual check: completion modal heading is navy, icon is teal, no pink, no inline styles
