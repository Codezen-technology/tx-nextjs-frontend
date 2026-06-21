import { BundleCard } from "./bundle-card";
import type { Bundle } from "@/types/bundle";

interface BundlesGridProps {
  bundles: Bundle[];
}

export function BundlesGrid({ bundles }: BundlesGridProps) {
  if (bundles.length === 0) {
    return (
      <p className="py-16 text-center font-open-sans text-neutral-400">
        No bundles available right now. Please check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}
