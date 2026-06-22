"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePromoBanner } from "@/lib/hooks/usePromoBanner";
import { useAddToCart } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils/cn";

/**
 * Sidebar promo banner. Fetched client-side via React Query from
 * GET /lms-backend/v1/promo-banner (admin "Promo banner" settings + linked
 * WooCommerce product pricing). Shows a skeleton while loading and renders
 * nothing on error/empty.
 */
export function DashboardPromoCard({ className }: { className?: string }) {
  const { data: promo, isLoading } = usePromoBanner();
  const router = useRouter();
  const addToCart = useAddToCart();

  if (isLoading) {
    return <div className={cn("h-72 animate-pulse rounded-2xl bg-white/5", className)} />;
  }

  if (!promo || (!promo.title && promo.price == null && !promo.image_url)) return null;

  const hasDiscount =
    promo.regular_price != null && promo.price != null && promo.regular_price > promo.price;

  function handleBuy() {
    if (!promo?.product_id || addToCart.isPending) return;
    addToCart.mutate(
      { product_id: promo.product_id, quantity: 1 },
      { onSuccess: () => router.push("/checkout") },
    );
  }

  return (
    <div className={cn("rounded-2xl bg-[#0a0e1a] p-4 text-center", className)}>
      {promo.image_url && (
        <div className="relative mx-auto mb-4 aspect-square w-3/4 overflow-hidden rounded-2xl">
          <Image
            src={promo.image_url}
            alt={promo.title}
            fill
            className="object-cover"
            sizes="186px"
          />
        </div>
      )}

      <span className="inline-block rounded-full border border-[#dc3545] bg-white px-5 py-1.5 text-sm font-bold text-[#dc3545]">
        For a Limited Time
      </span>

      <h3 className="mt-3 text-lg font-bold text-white">{promo.title}</h3>

      {promo.subtitle && (
        <p className="mt-2 text-xs leading-snug text-white/60">{promo.subtitle}</p>
      )}

      {promo.price != null && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="text-sm text-white/80">Just for</span>
          <span className="text-3xl font-extrabold text-[#f5c518]">
            {promo.currency}
            {promo.price}
          </span>
          {hasDiscount && (
            <span className="text-sm text-white/40 line-through">
              (was {promo.currency}
              {promo.regular_price})
            </span>
          )}
        </div>
      )}

      {promo.product_id ? (
        <button
          type="button"
          onClick={handleBuy}
          disabled={addToCart.isPending}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-[#0a0e1a] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {addToCart.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {addToCart.isPending ? "Adding…" : "Buy Now"}
        </button>
      ) : (
        promo.button_url && (
          <a
            href={promo.button_url}
            className="mt-4 inline-block w-full rounded-full bg-white py-3 text-sm font-semibold text-[#0a0e1a] transition hover:bg-white/90"
          >
            Buy Now
          </a>
        )
      )}
    </div>
  );
}
