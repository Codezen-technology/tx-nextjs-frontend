import type { HomePageData, HomeWhySection } from "@/types/home";

/**
 * Reads the homepage `why` block whichever shape the backend sent.
 *
 * The plugin changed this field from a bare `HomeWhyFeature[]` to
 * `{ items, image }` so the section's right-hand image could be CMS-driven.
 * Production has not caught up, and the two shapes fail differently: reaching
 * straight for `.items` on the array yields `undefined`, `WhyChooseGrid` bails
 * on an empty feature list, and the entire Why Choose Us section vanishes from
 * the homepage with nothing logged. Normalising here keeps the section on the
 * page against both builds; the image simply falls back to the static asset on
 * the older one.
 */
export function normalizeWhySection(why: HomePageData["why"] | undefined): HomeWhySection {
  if (Array.isArray(why)) return { items: why, image: "" };
  return { items: why?.items ?? [], image: why?.image ?? "" };
}
