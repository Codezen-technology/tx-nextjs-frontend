## Context

The `CourseAccreditations` component currently has an early return when `accreditations.length === 0`. The page also wraps it in a conditional. Both need updating to always show the section with hardcoded defaults.

## Decisions

1. **Default data lives in the component file** — co-located with the component that uses it
2. **Fallback logic in component, not page** — component handles its own empty state; page always renders it
3. **Logos use local `/images/` paths** — `cpd-logo.png` and `ukrlp-logo.png` already exist in `public/images/`

## Default Data (from Figma node 6239:163384)

- CPD Service Accredited: `/images/cpd-logo.png`
- UKRLP Registered Provider: `/images/ukrlp-logo.png`
