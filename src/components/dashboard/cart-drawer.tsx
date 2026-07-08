"use client";

import Link from "next/link";
import Image from "next/image";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveCartItem } from "@/lib/hooks/useCart";
import { useQuantityEditor } from "@/lib/hooks/useQuantityEditor";
import type { CartItem } from "@/lib/stores/cart.store";

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * One basket line. Extracted so each row owns its own `useQuantityEditor` state
 * (typeable field + debounced writes) — same editing behavior as the cart page.
 */
function BasketItemRow({ item, currency: sym }: { item: CartItem; currency: string }) {
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem();
  const { localQty, draft, isUpdating, step, onDraftChange, onDraftBlur } = useQuantityEditor(item);

  const canEdit = item.editable && !item.sold_individually;

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
        {item.thumbnail && (
          <Image src={item.thumbnail} alt={item.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
        <p className="text-muted-foreground text-sm">{fmt(item.line_total, sym)}</p>
        {canEdit ? (
          <div className="mt-1.5 inline-flex items-center rounded border border-neutral-200">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={localQty <= 1 || isRemoving}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="relative flex w-9 items-center justify-center">
              <input
                type="text"
                inputMode="numeric"
                aria-label="Quantity"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onBlur={onDraftBlur}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                disabled={isRemoving}
                className="w-full bg-transparent text-center text-sm font-medium focus:outline-hidden disabled:opacity-40"
              />
              {isUpdating && (
                <Loader2 className="text-lms-secondary absolute -top-1.5 -right-1.5 h-2.5 w-2.5 animate-spin" />
              )}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={localQty >= item.max_quantity || isRemoving}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">Qty: {item.quantity}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => removeItem(item.key)}
        disabled={isRemoving}
        className="rounded p-1 hover:bg-neutral-100"
        aria-label={`Remove ${item.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totals, currency: sym } = useCart();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Basket</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Your basket is empty.</p>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {items.map((item) => (
                <BasketItemRow key={item.key} item={item} currency={sym} />
              ))}
            </ul>
            <div className="border-t pt-4">
              <div className="mb-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>{fmt(totals?.total ?? 0, sym)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={onClose}>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button
                  asChild
                  className="hover:bg-lms-secondary/90 bg-lms-secondary"
                  onClick={onClose}
                >
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
