"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart.store";
import { useRemoveCartItem } from "@/lib/hooks/useCart";

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals);
  const { mutate: removeItem, isPending } = useRemoveCartItem();
  const sym = totals?.currency ?? "£";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Basket</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Your basket is empty.</p>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {item.thumbnail && (
                      <Image src={item.thumbnail} alt={item.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{fmt(item.price, sym)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    disabled={isPending}
                    className="rounded p-1 hover:bg-neutral-100"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
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
