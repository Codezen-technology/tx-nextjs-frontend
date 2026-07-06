import type { LicencePool } from "@/types/business-dashboard";

export function poolAvailable(pool: LicencePool): number {
  if (pool.available != null) return pool.available;
  return Math.max(0, (pool.quantity ?? 0) - (pool.used ?? 0));
}

export function sumAvailableLicences(pools: LicencePool[]): number {
  return pools.reduce((sum, pool) => sum + poolAvailable(pool), 0);
}

export function sumLicenceTotals(pools: LicencePool[]): { quantity: number; used: number } {
  return pools.reduce(
    (acc, pool) => ({
      quantity: acc.quantity + (pool.quantity ?? 0),
      used: acc.used + (pool.used ?? 0),
    }),
    { quantity: 0, used: 0 },
  );
}

export function formatPoolCourseName(pool: Pick<LicencePool, "course_id" | "course_name">): string {
  if (pool.course_id === 0) return "Any course";
  return pool.course_name;
}

export function isMigratedCreditPool(pool: LicencePool): boolean {
  return pool.course_id === 0 && pool.order_id === 0 && (pool.price_per_licence ?? 0) === 0;
}
