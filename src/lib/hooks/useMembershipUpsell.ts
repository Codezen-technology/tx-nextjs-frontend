import { useQuery } from "@tanstack/react-query";
import { membershipUpsellService } from "@/lib/services/membership-upsell";
import { queryKeys } from "@/lib/utils/query-keys";

/**
 * Cart/checkout membership upsell banner. Marketing config — low churn,
 * so a generous staleTime avoids refetching on every navigation.
 */
export function useMembershipUpsell() {
  return useQuery({
    queryKey: queryKeys.settings.membershipUpsell,
    queryFn: () => membershipUpsellService.getUpsell(),
    staleTime: 5 * 60 * 1000,
  });
}
