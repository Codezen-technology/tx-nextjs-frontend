import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toFrontendPath } from "@/lib/utils/url";
import type { MembershipUpsell } from "@/types/settings";

/** Public read for the cart/checkout "Premium Access" membership banner. */
export const membershipUpsellService = {
  async getUpsell(): Promise<MembershipUpsell | null> {
    const { data } = await api.get<MembershipUpsell | null>(endpoints.settings.membershipUpsell);
    if (!data) return null;
    // "View more details" must resolve on the frontend, not the WP backend.
    return { ...data, permalink: data.permalink ? toFrontendPath(data.permalink) : data.permalink };
  },
};
