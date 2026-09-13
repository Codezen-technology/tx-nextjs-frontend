## Context

The homepage "Why Choose Us" section is rendered by `WhyChooseGrid` in `src/components/home/why-choose-grid.tsx`. Currently, the right-side image is hardcoded to `/images/why-choose-us.webp`. The WordPress backend (`GET /lms-backend/v1/home`) now returns the `why` section as `{ items: [...], image: "..." }` instead of a flat array. The `image` field is a full CDN URL when configured, or an empty string when unconfigured.

The home page is a React Server Component that fetches data server-side via `serverApi.home.get()` with ISR (300s revalidation). No client-side fetching is needed.

## Goals / Non-Goals

**Goals:**

- Consume the new `image` field from the backend `why` section
- Fall back to static `/images/why-choose-us.webp` when `image` is empty/unconfigured
- Minimal changes — 3 files, no new dependencies

**Non-Goals:**

- Client-side refetching or TanStack Query integration (server-side ISR handles this)
- Image optimization beyond what `next/image` provides automatically
- Changes to other homepage sections

## Decisions

### 1. Change the `why` type from array to object

**Decision:** Update `HomePageData.why` from `HomeWhyFeature[]` to `{ items: HomeWhyFeature[]; image: string }`.

**Rationale:** Matches the backend response shape exactly. No transformation needed at the fetch layer. The alternative (adding a separate `why_image` field) would require backend changes and break the single-source-of-truth pattern.

### 2. Pass `image` as a separate prop to WhyChooseGrid

**Decision:** The component receives `features` and `image` as distinct props rather than the raw `why` object.

**Rationale:** Keeps the component interface clean and explicit. The component doesn't need to know about the backend response shape — it just gets what it needs.

### 3. Use `<img>` instead of `<Image>` for the fallback

**Decision:** Keep the existing `<img>` tag rather than switching to `next/image`.

**Rationale:** The image URL from the backend could be any external CDN. Using `<img>` avoids needing to configure `next.image.remotePatterns` for every possible CDN domain. The static fallback is a local asset but keeping consistency with the dynamic path is simpler.

## Risks / Trade-offs

- **[Risk]** Backend returns unexpected shape → Mitigation: TypeScript type enforcement at compile time; `home?.why?.items` optional chaining handles missing data gracefully.
- **[Trade-off]** No `next/image` optimization for the dynamic image → Acceptable because CDN URLs typically have their own optimization (e.g., Cloudflare Polish, Bunny Optimizer).
