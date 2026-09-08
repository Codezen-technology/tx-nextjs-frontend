## Why

The homepage hero course carousel intermittently appears clipped, mispositioned, or effectively invisible. Two independent causes were reproduced:

1. **Layout (deterministic by viewport width).** The three stacked cards are placed with hard-coded pixel offsets (`x: 0 / 177 / 383`, card width 306px → a 660px content span) inside a container that never guarantees 660px. Because the cards are absolutely positioned they contribute nothing to their parent's width, and `overflow-x-clip` on the hero `<section>` silently cuts whatever spills. Measured on the deployed site: at 1024px the strip collapses to **140px** wide and the third card is clipped at x=1102; at 1300px the third card ends at x=1344 against a 1300px viewport. Only ≥1440px renders correctly. Compounding this, the hero row only becomes horizontal at `xl` (1280px) while the carousel unhides at `lg` (1024px) and the mobile fallback card hides at `lg` — so between 1024–1279px the carousel is dumped into a column-flow container sized to its own nav arrows, and no usable course card is visible at all.

2. **Data path (hardening, not the reported symptom).** `HeroSection` fetches courses through the browser Axios singleton rather than the cached server fetcher, so the read sits outside the Next data cache, cannot be revalidated by tag, and resolves its base URL from `NEXT_PUBLIC_WP_API_URL` only — ignoring the server-only `WP_API_URL` override. An earlier draft of this proposal also claimed a failed fetch was cached as "no courses" for the homepage's 300s ISR window; that is wrong. `/[locale]` builds as `ƒ` (Dynamic), so there is no prerendered page to cache, and Next does not cache failed fetches. The reported intermittency is accounted for by the layout defect above.

## What Changes

- Make the hero carousel's card geometry width-aware so the full three-card stack fits its container at every breakpoint it is shown at, instead of relying on fixed pixel offsets that only fit at ≥1440px.
- Align the hero breakpoints so exactly one course presentation is visible at any width: the carousel and the horizontal hero row switch on at the same breakpoint, and the single-card mobile fallback covers everything below it.
- Give the carousel strip a real, reserved width so it no longer collapses to its nav-row content width in column flow.
- Guarantee the hero never overflows the viewport: at every covered breakpoint the rendered card stack stays inside the hero container, so `overflow-x-clip` has nothing to cut.
- Move the hero's course fetch onto the tagged server fetcher (`serverFetch`) so it participates in the Next.js data cache and honours on-demand revalidation, instead of going through the Axios client inside a Server Component.
- Keep an empty hero course list from silently deleting the section: the hero renders its single-card fallback presentation when the carousel cannot be shown, and a transient upstream failure does not get baked into the ISR-cached page.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `homepage-sections`: the "Hero section displays a live course carousel" requirement gains responsive-fit and breakpoint-parity guarantees (the full card stack must be visible and unclipped at every width where the carousel is shown, and a single-card presentation covers the widths where it is not). The "no featured courses" scenario is tightened so the hero degrades to its fallback presentation rather than the region vanishing, and the hero's course data must be fetched through the cached server fetcher so a transient upstream failure is not cached for the ISR window.

## Impact

- `src/components/home/hero-carousel.tsx` — card offset model, strip sizing, breakpoint class.
- `src/components/home/hero-section.tsx` — hero row breakpoint, mobile-fallback breakpoint, course fetch path, empty-state handling.
- `src/lib/api/server.ts` — a tagged server fetch for the hero's featured-course list (new helper if one does not already cover it).
- `src/app/[locale]/(marketing)/page.tsx` — unchanged behaviour, but its `revalidate = 300` ISR window is what makes the data bug user-visible; no change expected beyond what the fetch move implies.
- Homepage E2E/visual coverage at 1024, 1280, 1300, 1440 and 1920px viewports.
- No API contract change on the WordPress side.
