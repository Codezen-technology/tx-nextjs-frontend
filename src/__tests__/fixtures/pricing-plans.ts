import type { HomePricingPlan, HomePricingSection } from "@/types/home";

/**
 * Shared shapes for the pricing section's tests. The `vi.mock` calls for `useCart` and
 * `next/navigation` deliberately stay in each test file — Vitest hoists them above imports,
 * so they cannot be re-exported from here.
 */
export function makePlan(overrides: Partial<HomePricingPlan> = {}): HomePricingPlan {
  return {
    name: "Monthly Access",
    price: "£49.00",
    ctaLabel: "Get Started",
    variant: "default",
    features: [],
    ...overrides,
  };
}

/** A plan wired to WooCommerce — the shape the homepage payload carries. */
export const monthlyProduct: NonNullable<HomePricingPlan["product"]> = {
  id: 69664,
  name: "Monthly Access",
  price: 49,
  priceFormatted: "£49.00",
  regularPrice: 199,
  regularPriceFormatted: "£199.00",
  salePrice: 49,
  isOnSale: true,
  currency: "GBP",
  permalink: "https://example.test/product/monthly-access/",
  addToCartUrl: "https://example.test/cart/?add-to-cart=69664",
};

export function makePricingSection(
  overrides: Partial<HomePricingSection> = {},
): HomePricingSection {
  return {
    header: {
      title: "Enjoy Unlimited Training, Save More!",
      description: "Get Access to Hundreds of Premium Courses",
      ctaLabel: "View more details",
      ctaHref: "/pricing",
    },
    plans: [makePlan()],
    ...overrides,
  };
}
