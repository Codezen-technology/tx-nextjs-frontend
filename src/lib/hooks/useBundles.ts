import { useQuery } from "@tanstack/react-query";
import { bundlesService } from "@/lib/services/bundles";
import { queryKeys } from "@/lib/utils/query-keys";

export function useBundles(params: { page?: number; perPage?: number; search?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.bundles.list(params),
    queryFn: () => bundlesService.list(params),
  });
}

export function useFeaturedBundles(limit = 4) {
  return useQuery({
    queryKey: queryKeys.bundles.featured(limit),
    queryFn: () => bundlesService.featured(limit),
  });
}

export function useBundle(slug: string) {
  return useQuery({
    queryKey: queryKeys.bundles.detail(slug),
    queryFn: () => bundlesService.getBySlug(slug),
    enabled: Boolean(slug),
  });
}
