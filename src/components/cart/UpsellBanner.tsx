"use client";

import { CheckCircle } from "lucide-react";
import { useMembershipUpsell } from "@/lib/hooks/useMembershipUpsell";
import { useAddToCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";

interface UpsellBannerProps {
  variant?: "cart" | "checkout";
}

export function UpsellBanner({ variant = "cart" }: UpsellBannerProps) {
  const { data: upsell } = useMembershipUpsell();
  const addToCart = useAddToCart();
  const cartItems = useCartStore((s) => s.items);

  if (!upsell) return null;

  const alreadyInCart = cartItems.some((i) => i.product_id === upsell.product_id);

  function handleAddToCart() {
    if (!upsell || alreadyInCart) return;
    addToCart.mutate({ product_id: upsell.product_id, quantity: 1 });
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ background: "linear-gradient(6deg, #00204a 9%, #1c395e 92%)" }}
    >
      {upsell.badge && (
        <div className="absolute right-0 top-0">
          <div
            className="px-4 py-1.5 text-xs font-medium text-[#00204a]"
            style={{ background: "linear-gradient(69deg, #01aee0 0%, #00c7ff 100%)" }}
          >
            {upsell.badge}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Title + price */}
        <div>
          <p className="text-sm font-semibold text-[#00bbf0]">{upsell.name}</p>
          {upsell.regular_price > upsell.price && (
            <p className="mt-1 text-xl font-bold text-[#dc3545] line-through">
              {upsell.currency}
              {upsell.regular_price}
            </p>
          )}
          <p className="text-2xl font-bold text-white">
            {upsell.currency}
            {upsell.price}
            <span className="text-base font-normal">/Year</span>
          </p>
        </div>

        {/* Feature list */}
        {upsell.features.length > 0 && (
          <ul className="space-y-1.5">
            {upsell.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white">
                <CheckCircle size={14} className="shrink-0 text-[#00bbf0]" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-2 sm:w-56">
          <button
            onClick={handleAddToCart}
            disabled={alreadyInCart || addToCart.isPending}
            className="w-full rounded-full border border-[#00bbf0] bg-gradient-to-r from-[#00bbf0] to-[#8ae0f8] px-6 py-2.5 text-center text-sm font-medium text-[#00204a] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {alreadyInCart
              ? "Added"
              : addToCart.isPending
                ? "Adding…"
                : variant === "cart"
                  ? "Add to Cart"
                  : "Get Started"}
          </button>
          {upsell.permalink && (
            <a
              href={upsell.permalink}
              className="text-xs text-white underline underline-offset-2 hover:text-gray-300"
            >
              View more details
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
