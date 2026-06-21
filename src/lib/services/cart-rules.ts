import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { BulkTier } from "@/types/cart-rules";

export const cartRulesService = {
  async getBulkTiers(): Promise<BulkTier[]> {
    const res = await api.get<{ tiers?: BulkTier[] }>(endpoints.cartRules.bulkTiers);
    return res.data?.tiers ?? [];
  },
};
