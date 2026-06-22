import { useQuery } from "@tanstack/react-query";
import { promoService } from "@/lib/services/promo";
import { queryKeys } from "@/lib/utils/query-keys";

/**
 * Sidebar promo banner. Marketing config — low churn, so a generous
 * staleTime avoids refetching on every dashboard navigation.
 */
export function usePromoBanner() {
  return useQuery({
    queryKey: queryKeys.settings.promoBanner,
    queryFn: () => promoService.getBanner(),
    staleTime: 5 * 60 * 1000,
  });
}
