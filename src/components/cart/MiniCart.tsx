"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart, useRemoveCartItem } from "@/lib/hooks/useCart";

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function MiniCart({ onClose }: { onClose: () => void }) {
  const { items, totals, currency: sym } = useCart();
  const { mutate: removeItem, isPending } = useRemoveCartItem();

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-md border border-neutral-200 bg-white shadow-xl">
      {items.length === 0 ? (
        <p className="px-5 py-6 text-center font-open-sans text-sm text-neutral-500">
          Your basket is empty.
        </p>
      ) : (
        <>
          <ul className="max-h-[300px] divide-y divide-neutral-100 overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {item.thumbnail && (
                    <Image src={item.thumbnail} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-open-sans text-[13px] font-medium leading-snug text-neutral-800">
                    {item.name}
                  </p>
                  <p className="mt-0.5 font-open-sans text-[13px] text-neutral-500">
                    {fmt(item.price, sym)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.key)}
                  disabled={isPending}
                  aria-label={`Remove ${item.name}`}
                  className="shrink-0 rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-neutral-100 px-4 py-3">
            <div className="flex items-center justify-between font-open-sans">
              <span className="text-[14px] font-medium text-neutral-700">Total:</span>
              <span className="text-[15px] font-semibold text-neutral-900">
                {fmt(totals?.total ?? 0, sym)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded bg-[#00204a] font-open-sans text-[13px] font-semibold text-white transition hover:bg-[#001733]"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded bg-[#9e6f21] font-open-sans text-[13px] font-semibold text-white transition hover:bg-[#7d5819]"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
