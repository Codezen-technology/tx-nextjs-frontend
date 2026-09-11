## Why

The "Why Choose Us" section on the homepage currently renders a hardcoded static image (`images/why-choose-us.webp`). The backend now returns a configurable `image` URL alongside the `items` array in the `why` section of `GET /lms-backend/v1/home`. The frontend needs to consume this new field and fall back to the static image when unconfigured.

## What Changes

- The `HomePageData.why` type changes from `HomeWhyFeature[]` to `{ items: HomeWhyFeature[]; image: string }` to match the backend response shape.
- `WhyChooseGrid` component accepts a new `image` prop and renders it with fallback to the static webp.
- The home page passes `home?.why?.items` and `home?.why?.image` to `WhyChooseGrid`.

## Capabilities

### Modified Capabilities

- `homepage-sections`: The Why Choose Us requirement needs to include dynamic image support — the section SHALL render a CMS-configurable image with static fallback.

### New Capabilities

_(none — this is a small incremental change that extends an existing capability)_

## Impact

| Area                                      | Change                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/types/home.ts`                       | `HomePageData.why` type signature changes              |
| `src/components/home/why-choose-grid.tsx` | New `image` prop, fallback logic                       |
| `src/app/[locale]/(marketing)/page.tsx`   | Pass `items` and `image` separately to `WhyChooseGrid` |
| No new dependencies                       | —                                                      |
| No API changes                            | Backend already returns the `image` field              |
