import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { MembershipUpsell } from "@/types/settings";

/** Public read for the cart/checkout "Premium Access" membership banner. */
export const membershipUpsellService = {
  async getUpsell(): Promise<MembershipUpsell | null> {
    const { data } = await api.get<MembershipUpsell | null>(endpoints.settings.membershipUpsell);
    return data ?? null;
  },
};
