"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useMe } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";

/** WP roles that may access the B2B business dashboard. */
export const BUSINESS_ROLES = [
  "administrator",
  "business_manager",
  "b2b_manager",
  "b2b_customer",
  "wplms_business",
];

export function hasBusinessAccess(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((r) => BUSINESS_ROLES.includes(r));
}

export function BusinessAccessGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-100 border-t-[#3F576F]" />
      </div>
    );
  }

  if (!hasBusinessAccess(user?.roles)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="border-neutral-30 max-w-md rounded-xl border bg-white p-10 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3F576F]/10 text-[#3F576F]">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">Business access required</h2>
          <p className="mt-2 text-sm text-neutral-300">
            This area is only available to business owners and managers. If you believe this is a
            mistake, contact your administrator.
          </p>
          <Button asChild className="mt-6 bg-[#3F576F] hover:bg-[#33485d]">
            <Link href="/dashboard/my-learning">Back to my learning</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
