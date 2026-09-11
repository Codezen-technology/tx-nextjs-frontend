# Tasks — why-choose-us-dynamic-image

## Implementation Tasks

- [x] 1. **Update `HomePageData` type** in `src/types/home.ts`
  - Change `why: HomeWhyFeature[]` to `why: { items: HomeWhyFeature[]; image: string }`

- [x] 2. **Update `WhyChooseGrid` component** in `src/components/home/why-choose-grid.tsx`
  - Add `image?: string` to `WhyChooseGridProps` interface
  - Change `<img src="images/why-choose-us.webp" ...>` to `<img src={image || "/images/why-choose-us.webp"} ...>`

- [x] 3. **Update home page** in `src/app/[locale]/(marketing)/page.tsx`
  - Change `features={home?.why}` to `features={home?.why?.items}`
  - Add `image={home?.why?.image}` prop

- [x] 4. **Update spec** in `openspec/specs/homepage-sections/spec.md`
  - Add image fallback requirement to the Why Choose Us section (line ~100)
