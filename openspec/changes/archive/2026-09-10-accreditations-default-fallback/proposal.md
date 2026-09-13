## Why

When a course has no accreditations configured in the backend, the accreditations section either shows a bare "No accreditation information available." text or is hidden entirely. The business wants the section to always render with 2 trusted default rows (CPD + UKRLP) as fallback, maintaining visual consistency across all course pages.

## What Changes

- `CourseAccreditations` component gains a `DEFAULT_ACCREDITATIONS` constant with 2 hardcoded rows
- Component uses defaults when `accreditations` array is empty
- Page-level conditional removed — section always renders
- "No accreditation information available." text removed

## Capabilities

### Modified Capabilities

- `single-course-page`: Accreditations section always shows with fallback data

## Impact

| File                                                  | Change                                    |
| ----------------------------------------------------- | ----------------------------------------- |
| `src/components/courses/course-accreditations.tsx`    | Add defaults, remove early return         |
| `src/app/[locale]/(marketing)/course/[slug]/page.tsx` | Remove conditional, always render section |
