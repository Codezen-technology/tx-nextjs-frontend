"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/lib/stores/cart.store";
import { useUpdateCartItem, useRemoveCartItem } from "@/lib/hooks/useCart";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { mutate: updateQty, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();

  const isPending = isUpdating || isRemoving;

  const handleQty = (delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    updateQty({ key: item.key, quantity: next });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray-100 py-6 transition-opacity",
        isPending && "pointer-events-none opacity-50",
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
          <p className="line-clamp-2 max-w-[24rem] font-medium text-[#00204a]">{item.name}</p>
          <p className="mt-1 text-sm text-[#3b5374]">Price: £{item.price.toFixed(2)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-6 pl-4">
        {/* Qty stepper */}
        <div className="flex h-12 items-center rounded border border-[#ced4da]">
          <button
            onClick={() => handleQty(-1)}
            disabled={item.quantity <= 1 || isPending}
            aria-label="Decrease quantity"
            className="flex h-full w-10 items-center justify-center text-[#00204a] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-sm font-medium text-[#00204a]">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQty(1)}
            disabled={isPending}
            aria-label="Increase quantity"
            className="flex h-full w-10 items-center justify-center text-[#00204a] hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Line total */}
        <span className="w-20 text-right font-semibold text-[#00204a]">
          £{item.line_total.toFixed(2)}
        </span>

        {/* Remove */}
        <button
          onClick={() => removeItem(item.key)}
          disabled={isPending}
          aria-label={`Remove ${item.name}`}
          className="flex items-center justify-center rounded-full p-1 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
