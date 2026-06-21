"use client";

import { useAddToCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { Loader2, ShoppingCart } from "lucide-react";

interface BundleAddToCartProps {
  /** Bundle WC product ID (the bundle's own `id`). */
  productId: number;
  className?: string;
}

export function BundleAddToCart({ productId, className }: BundleAddToCartProps) {
  const addToCart = useAddToCart();
  const openCart = useCartStore((s) => s.toggleCart);

  const handleAdd = () => {
    addToCart.mutate(
      { product_id: productId, quantity: 1 },
      {
        onSuccess: () => {
          if (!useCartStore.getState().isOpen) openCart();
        },
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={addToCart.isPending}
      className={
        className ??
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 font-open-sans text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
      }
    >
      {addToCart.isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      {addToCart.isPending ? "Adding…" : "Add Bundle to Basket"}
    </button>
  );
}
