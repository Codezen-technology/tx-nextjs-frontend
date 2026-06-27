"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  // Tracks the quantity we last sent to the server to avoid duplicate mutations.
  const inFlightQty = useRef<number | null>(null);

  // Sync to server quantity whenever the store updates (mutation success, external change).
  // Does NOT depend on isUpdating — that causes a race where isPending goes false before
  // the Zustand store processes setCart, resetting localQty and re-triggering the mutation.
  useEffect(() => {
    setLocalQty(item.quantity);
    inFlightQty.current = null;
  }, [item.quantity]);

  // Fire mutation when debounced value diverges from server value.
  // updateQty is intentionally omitted from deps: useMutation's mutate is not a stable
  // reference — including it causes the effect to re-run on every status change (pending →
  // success), firing a duplicate mutation before item.quantity has synced from the store.
  useEffect(() => {
    if (
      debouncedQty !== item.quantity &&
      debouncedQty >= 1 &&
      debouncedQty !== inFlightQty.current
    ) {
      inFlightQty.current = debouncedQty;
      updateQty({ key: item.key, quantity: debouncedQty });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQty, item.quantity, item.key]);

  const handleQty = (delta: number) => {
    setLocalQty((prev) => Math.min(item.max_quantity, Math.max(1, prev + delta)));
  };

  const isOnSale = item.regular_price > item.price;
  const showStepper = !item.sold_individually;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-gray-100 py-6 transition-opacity sm:flex-row sm:items-center sm:justify-between",
        isRemoving && "pointer-events-none opacity-50",
      )}
    >
      {/* Thumbnail + title */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-gray-100 sm:h-20 sm:w-[120px]">
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
      <div className="flex shrink-0 items-center gap-4 pl-0 sm:gap-6 sm:pl-4">
        {showStepper ? (
          <div
            className={cn(
              "flex h-12 items-center rounded border transition-colors",
              isUpdating ? "border-[#9e6f21]/40 bg-[#9e6f21]/5" : "border-[#ced4da]",
            )}
          >
            <button
              onClick={() => handleQty(-1)}
              disabled={localQty <= 1 || isRemoving}
              aria-label="Decrease quantity"
              className="flex h-full w-10 items-center justify-center text-[#00204a] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="relative flex w-8 items-center justify-center">
              <span className="text-sm font-medium text-[#00204a]">{localQty}</span>
              {isUpdating && (
                <Loader2
                  size={10}
                  className="absolute -right-3 -top-2 animate-spin text-[#9e6f21]"
                />
              )}
            </span>
            <button
              onClick={() => handleQty(1)}
              disabled={localQty >= item.max_quantity || isRemoving}
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
