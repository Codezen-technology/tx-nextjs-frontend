"use client";

import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useImpersonation, useSwitchBack } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Impersonation banner.
 *
 * - `sticky` (default) — flows at the top of the marketing SiteShell.
 * - `fixed` — pinned to the very top for dashboard shells that use fixed
 *   headers/sidebars. Pair with a `--imp-offset` of 40px on the shell root so
 *   the header/sidebar shift down by the banner height.
 */
export function ImpersonationBanner({ variant = "sticky" }: { variant?: "sticky" | "fixed" }) {
  const switchBack = useSwitchBack();
  const { active, displayName } = useImpersonation();

  if (!active) return null;

  return (
    <div
      className={cn(
        "z-50 border-b border-amber-300 bg-amber-50 text-sm text-amber-950",
        variant === "fixed"
          ? "fixed inset-x-0 top-0 flex h-10 items-center px-4"
          : "sticky top-0 px-4 py-2",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          You are viewing the site as{" "}
          <span className="font-semibold">{displayName || "another user"}</span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-400 bg-white hover:bg-amber-100"
          disabled={switchBack.isPending}
          onClick={() => switchBack.mutate()}
        >
          {switchBack.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftRight className="mr-2 h-4 w-4" />
          )}
          Switch back
        </Button>
      </div>
    </div>
  );
}
