"use client";

import { useState } from "react";
import { useApplyCoupon, useRemoveCoupon, useCartQuery } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils/cn";
import { ParsedHtml } from "@/components/ui/parsed-html";

export function CouponInput() {
  const [code, setCode] = useState("");
  const { data: cart } = useCartQuery();
  const { mutate: apply, isPending: isApplying, error: applyError } = useApplyCoupon();
  const { mutate: remove, isPending: isRemoving } = useRemoveCoupon();

  const appliedCoupon = cart?.coupon_code ?? null;

  const handleApply = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    apply(trimmed, { onSuccess: () => setCode("") });
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm">
        <span className="font-medium text-green-700">
          Coupon applied: {appliedCoupon.toUpperCase()}
        </span>
        <button
          onClick={() => remove(appliedCoupon)}
          disabled={isRemoving}
          className="ml-auto text-gray-400 hover:text-gray-600 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder="Coupon code"
          className="h-12 flex-1 rounded-l border border-r-0 border-[#ebedf1] bg-white px-[13px] py-[7px] text-base text-[#00204a] placeholder:text-[#75879d] focus:border-[#9e6f21] focus:outline-none"
        />
        <button
          onClick={handleApply}
          disabled={isApplying || !code.trim()}
          className={cn(
            "h-12 rounded-r border border-[#9e6f21] bg-[#9e6f21] px-[13px] py-[7px] text-base text-white transition-colors",
            "hover:border-[#7d5819] hover:bg-[#7d5819] disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isApplying ? "Applying…" : "Apply Coupon"}
        </button>
      </div>
      {applyError && (
        <ParsedHtml
          as="p"
          className="text-xs text-red-500"
          content={(applyError as Error).message ?? "Invalid coupon code"}
        />
      )}
    </div>
  );
}
