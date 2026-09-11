# Tasks — accreditations-default-fallback

- [x] 1. **Update `src/components/courses/course-accreditations.tsx`**
  - Add `DEFAULT_ACCREDITATIONS` constant (2 items with slug, label, logo, description)
  - Remove the `if (!accreditations.length)` early return
  - Add `const items = accreditations.length ? accreditations : DEFAULT_ACCREDITATIONS;`
  - Change `accreditations.map(...)` to `items.map(...)`

- [x] 2. **Update `src/app/[locale]/(marketing)/course/[slug]/page.tsx`**
  - Remove the `{accreditations.length > 0 ? ... : null}` conditional (lines 241-245)
  - Always render the `<section>` with `CourseAccreditations`
