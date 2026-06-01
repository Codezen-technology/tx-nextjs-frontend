"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ParsedHtml } from "@/components/ui/parsed-html";
import { useCartStore } from "@/lib/stores/cart.store";
import type { CartItem } from "@/lib/stores/cart.store";
import { useUpdateCartItem, useRemoveCartItem } from "@/lib/hooks/useCart";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const currency = useCartStore((s) => s.totals?.currency ?? "£");
  const { mutate: updateQty, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();

  const [localQty, setLocalQty] = useState(item.quantity);
  const debouncedQty = useDebounce(localQty, 400);

  // Sync server qty → local when not in the middle of an update
  useEffect(() => {
    if (!isUpdating) setLocalQty(item.quantity);
  }, [item.quantity, isUpdating]);

  // Fire mutation only when debounced value differs from server value
  useEffect(() => {
    if (debouncedQty !== item.quantity && debouncedQty >= 1) {
      updateQty({ key: item.key, quantity: debouncedQty });
    }
  }, [debouncedQty, item.quantity, item.key, updateQty]);

  const handleQty = (delta: number) => {
    setLocalQty((prev) => Math.min(item.max_quantity, Math.max(1, prev + delta)));
  };

  const isOnSale = item.regular_price > item.price;
  const showStepper = !item.sold_individually;

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray-100 py-6 transition-opacity",
        isRemoving && "pointer-events-none opacity-50",
      )}
    >
      {/* Thumbnail + title */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-[120px] shrink-0 overflow-hidden rounded bg-gray-100">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.name}
              fill
              className="object-cover"
              sizes="120px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <ParsedHtml
            as="p"
            content={item.name}
            className="line-clamp-2 max-w-[24rem] font-medium text-[#00204a]"
          />
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            {isOnSale && (
              <span className="text-gray-400 line-through">
                {currency}
                {item.regular_price.toFixed(2)}
              </span>
            )}
            <span className={cn("text-[#3b5374]", isOnSale && "font-medium text-[#9e6f21]")}>
              {currency}
              {item.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-6 pl-4">
        {showStepper ? (
          <div
            className={cn(
              "flex h-12 items-center rounded border transition-colors",
              isUpdating ? "border-[#9e6f21]/40 bg-[#9e6f21]/5" : "border-[#ced4da]",
            )}
          >
            <button
              onClick={() => handleQty(-1)}
              disabled={localQty <= 1 || isRemoving || isUpdating}
              aria-label="Decrease quantity"
              className="flex h-full w-10 items-center justify-center text-[#00204a] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="relative flex w-8 items-center justify-center">
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin text-[#9e6f21]" />
              ) : (
                <span className="text-sm font-medium text-[#00204a]">{localQty}</span>
              )}
            </span>
            <button
              onClick={() => handleQty(1)}
              disabled={localQty >= item.max_quantity || isRemoving || isUpdating}
              aria-label="Increase quantity"
              className="flex h-full w-10 items-center justify-center text-[#00204a] hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <span className="text-sm text-[#3b5374]">Qty: 1</span>
        )}

        {/* Line total — show skeleton while server recalculates */}
        <span className="flex w-20 justify-end font-semibold text-[#00204a]">
          {isUpdating ? (
            <span className="h-5 w-14 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              {currency}
              {item.line_total.toFixed(2)}
            </>
          )}
        </span>

        {/* Remove */}
        <button
          onClick={() => removeItem(item.key)}
          disabled={isUpdating || isRemoving}
          aria-label={`Remove ${item.name}`}
          className="flex items-center justify-center rounded-full p-1 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
