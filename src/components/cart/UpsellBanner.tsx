"use client";

import Image from "next/image";
import { useMembershipUpsell } from "@/lib/hooks/useMembershipUpsell";
import { useAddToCart, useCart } from "@/lib/hooks/useCart";

export function UpsellBanner() {
  const { data: upsell } = useMembershipUpsell();
  const addToCart = useAddToCart();
  const { items: cartItems } = useCart();

  if (!upsell) return null;

  const alreadyInCart = cartItems.some((i) => i.product_id === upsell.product_id);

  function handleAddToCart() {
    if (!upsell || alreadyInCart) return;
    addToCart.mutate({ product_id: upsell.product_id, quantity: 1 });
  }

  return (
    <div
      className="border-neutral-30 relative rounded-lg border"
      style={{ background: "linear-gradient(187.43deg, #f5f1e9 14.85%, #e1d2ba 96.39%)" }}
    >
      {upsell.badge && (
        <div className="absolute top-[-20px] right-5.75 z-20 flex items-start">
          <div className="text-secondary-500 flex h-10 items-center justify-center rounded-br-[8px] rounded-bl-[8px] bg-white px-4 text-base font-normal">
            {upsell.badge}
            <svg
              className="absolute top-0 -right-3"
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={26}
              viewBox="0 0 12 16"
              fill="none"
            >
              <path d="M12 15.0588H0V0L12 15.0588Z" fill="#E1D2BA" />
            </svg>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
        {/* Title + price */}
        <div className="flex flex-col gap-2">
          <p className="font-suse text-secondary-500 text-xl font-bold">{upsell.name}</p>
          <p className="text-2xl font-bold text-neutral-900">
            {upsell.regular_price > upsell.price && (
              <span className="text-[#dc3545] line-through">
                {upsell.currency}
                {upsell.regular_price}
              </span>
            )}
            {upsell.currency}
            {upsell.price}
          </p>
        </div>

        {/* Feature list */}
        {upsell.features.length > 0 && (
          <ul className="flex flex-col gap-4">
            {upsell.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-base text-neutral-900">
                <Image
                  src="/icons/tick-circle-green.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-60">
          <button
            onClick={handleAddToCart}
            disabled={alreadyInCart || addToCart.isPending}
            className="bg-secondary-500 w-full cursor-pointer rounded-full px-6 py-2 text-base font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {alreadyInCart ? "Added" : addToCart.isPending ? "Adding…" : upsell.cta_label}
          </button>
        </div>
      </div>
    </div>
  );
}
