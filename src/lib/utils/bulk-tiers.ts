import type { BulkTier } from "@/types/cart-rules";

/**
 * Tier that applies to `quantity`.
 *
 * Tiers may overlap or arrive unsorted, so the best (highest-percentage) match wins
 * rather than the first one in the array. `max === 0` means open-ended.
 */
export function resolveBulkTier(
  tiers: BulkTier[] | undefined | null,
  quantity: number,
): BulkTier | null {
  if (!tiers?.length) return null;
  return tiers.reduce<BulkTier | null>((best, tier) => {
    const applies = quantity >= tier.min && (tier.max === 0 || quantity <= tier.max);
    if (!applies) return best;
    return !best || tier.percentage > best.percentage ? tier : best;
  }, null);
}

/** Per-unit price after `tier`'s percentage. Display only — checkout re-prices server-side. */
export function bulkTierUnitPrice(unitPrice: number, tier: BulkTier | null): number {
  if (!tier) return unitPrice;
  return unitPrice * (1 - tier.percentage / 100);
}
