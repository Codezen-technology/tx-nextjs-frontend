"use client";

import type { LicencePricingTier } from "@/types/business-pricing";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BulkDiscountModalProps {
  tiers: LicencePricingTier[];
  open: boolean;
  onClose: () => void;
  unit?: "seat" | "licence";
}

export function BulkDiscountModal({
  tiers,
  open,
  onClose,
  unit = "licence",
}: BulkDiscountModalProps) {
  const unitPlural = unit === "seat" ? "seats" : "licences";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-sm flex-col">
        <DialogHeader className="shrink-0 text-center">
          <div className="mb-2 text-3xl">🏷️</div>
          <DialogTitle>Bigger orders = bigger discounts</DialogTitle>
          <p className="text-sm text-neutral-500">
            Lock in a better price and access training whenever you need it.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <table className="w-full text-sm">
            <tbody>
              {tiers[0] && tiers[0].min_qty > 1 && (
                <tr className="border-b">
                  <td className="py-2 text-neutral-700">
                    1–{tiers[0].min_qty - 1} {tiers[0].min_qty - 1 !== 1 ? unitPlural : unit}
                  </td>
                  <td className="py-2 text-right font-semibold text-neutral-500">Standard price</td>
                </tr>
              )}
              {tiers.map((tier, i) => {
                const next = tiers[i + 1];
                const label = next
                  ? `${tier.min_qty}–${next.min_qty - 1} ${unitPlural}`
                  : `${tier.min_qty}+ ${unitPlural}`;
                return (
                  <tr key={tier.id ?? i} className="border-b last:border-0">
                    <td className="py-2 text-neutral-700">{label}</td>
                    <td className="py-2 text-right font-semibold text-green-700">
                      {tier.discount_percent}% off
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button onClick={onClose} className="mt-4 w-full bg-neutral-900 hover:bg-neutral-700">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
