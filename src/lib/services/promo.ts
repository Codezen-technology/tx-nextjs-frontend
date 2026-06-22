import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PromoBanner } from "@/types/settings";

/** Public read for the student-dashboard sidebar promo banner. */
export const promoService = {
  async getBanner(): Promise<PromoBanner> {
    const { data } = await api.get<PromoBanner>(endpoints.settings.promoBanner);
    return data;
  },
};
