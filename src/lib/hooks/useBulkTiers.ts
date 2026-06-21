import { useQuery } from "@tanstack/react-query";
import { cartRulesService } from "@/lib/services/cart-rules";
import { queryKeys } from "@/lib/utils/query-keys";

/** Bulk-discount tiers — global config, rarely changes (1h stale). */
export function useBulkTiers() {
  return useQuery({
    queryKey: queryKeys.cartRules.bulkTiers,
    queryFn: () => cartRulesService.getBulkTiers(),
    staleTime: 60 * 60 * 1000,
  });
}
