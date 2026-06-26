import { useQuery } from "@tanstack/react-query";
import { checkoutFieldsService } from "@/lib/services/checkout-fields";
import { queryKeys } from "@/lib/utils/query-keys";

/**
 * Store-configured billing checkout fields. Store config — low churn,
 * so a generous staleTime avoids refetching on every checkout visit.
 */
export function useCheckoutFields() {
  return useQuery({
    queryKey: queryKeys.settings.checkoutFields,
    queryFn: () => checkoutFieldsService.getFields(),
    staleTime: 5 * 60 * 1000,
  });
}
