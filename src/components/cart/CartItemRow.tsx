"use client";

import Image from "next/image";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ParsedHtml } from "@/components/ui/parsed-html";
import type { CartItem } from "@/lib/stores/cart.store";
import { useCart, useRemoveCartItem } from "@/lib/hooks/useCart";
import { useQuantityEditor } from "@/lib/hooks/useQuantityEditor";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { currency } = useCart();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();
  // Editable quantity (typeable field + debounced, event-driven writes) lives in a
  // shared hook — same behavior as the dashboard basket drawer.
  const { localQty, draft, isUpdating, step, onDraftChange, onDraftBlur } = useQuantityEditor(item);

  const isOnSale = item.regular_price > item.price;
  // Respect WC's authoritative signal: hide the stepper when the line isn't
  // editable (sold-individually, fixed quantity, or stock-capped), not just for
  // sold-individually items.
  const showStepper = item.editable && !item.sold_individually;

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
            className="line-clamp-2 max-w-[24rem] font-medium text-neutral-900"
          />
          {/* The frame labels this "Price: £24.99" (QA-CART-A1). A row shows two
              money values — this one and the line total — and an unlabelled
              pair invites reading one for the other. */}
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-neutral-900">Price:</span>
            {isOnSale && (
              <span className="text-gray-400 line-through">
                {currency}
                {item.regular_price.toFixed(2)}
              </span>
            )}
            <span className={cn("text-neutral-500", isOnSale && "text-secondary-500 font-medium")}>
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
              isUpdating ? "border-secondary-500/40 bg-secondary-500/5" : "border-[#ced4da]",
            )}
          >
            <button
              onClick={() => step(-1)}
              disabled={localQty <= 1 || isRemoving}
              aria-label="Decrease quantity"
              className="flex h-full w-10 items-center justify-center text-neutral-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="relative flex w-10 items-center justify-center">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Quantity"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onBlur={onDraftBlur}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                disabled={isRemoving}
                className="w-full bg-transparent text-center text-sm font-medium text-neutral-900 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-40"
              />
              {isUpdating && (
                <Loader2
                  size={10}
                  className="text-secondary-500 absolute -top-2 -right-2 animate-spin"
                />
              )}
            </span>
            <button
              onClick={() => step(1)}
              disabled={localQty >= item.max_quantity || isRemoving}
              aria-label="Increase quantity"
              className="flex h-full w-10 items-center justify-center text-neutral-900 hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <span className="text-sm text-[#8a97a8]">Qty: {item.quantity}</span>
        )}

        {/* Line total — show skeleton while server recalculates */}
        <span className="flex w-20 justify-end font-semibold text-neutral-900">
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
