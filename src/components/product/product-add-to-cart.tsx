"use client";

import Link from "next/link";
import { useAddToCart, useCart } from "@/lib/hooks/useCart";

interface ProductAddToCartProps {
  productId: number;
  label: string;
  /** When set, the product can't be purchased from this page — show a disabled state. */
  disabledReason?: string;
}

export function ProductAddToCart({ productId, label, disabledReason }: ProductAddToCartProps) {
  const addToCart = useAddToCart();
  const { items } = useCart();
  const inCart = items.some((i) => i.product_id === productId);

  if (disabledReason) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-md bg-neutral-200 px-6 py-3 text-center text-sm font-semibold text-neutral-500"
      >
        {disabledReason}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => !inCart && addToCart.mutate({ product_id: productId, quantity: 1 })}
        disabled={inCart || addToCart.isPending}
        className="w-full rounded-md bg-secondary-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {inCart ? "Added to cart" : addToCart.isPending ? "Adding…" : label}
      </button>
      {inCart && (
        <Link
          href="/cart"
          className="text-center text-sm font-medium text-secondary-500 underline underline-offset-2 hover:text-secondary-600"
        >
          View cart
        </Link>
      )}
      {addToCart.isError && (
        <p className="text-center text-sm text-red-600">Could not add to cart. Please try again.</p>
      )}
    </div>
  );
}
