"use client";

import Image from "next/image";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Sidebar promo banner. Data-driven from the `promo_banner` block on
 * GET /lms-backend/v1/settings (admin "Promo banner" settings + linked
 * WooCommerce product pricing). Renders nothing when the backend provides none.
 */
export function DashboardPromoCard({ className }: { className?: string }) {
  const { promo_banner: promo } = useSiteSettings();

  if (!promo) return null;

  const hasDiscount =
    promo.regular_price != null && promo.price != null && promo.regular_price > promo.price;

  return (
    <div className={cn("rounded-2xl bg-[#0a0e1a] p-4 text-center", className)}>
      {promo.image_url && (
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
          <Image
            src={promo.image_url}
            alt={promo.title}
            fill
            className="object-cover"
            sizes="248px"
          />
        </div>
      )}

      <span className="inline-block rounded-full border border-[#dc3545] px-4 py-1.5 text-sm font-semibold text-[#dc3545]">
        For a Limited Time
      </span>

      <h3 className="mt-3 text-lg font-bold text-white">{promo.title}</h3>

      {promo.subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-white/60">{promo.subtitle}</p>
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

      {promo.button_url && (
        <a
          href={promo.button_url}
          className="mt-4 inline-block w-full rounded-full bg-white py-3 text-sm font-semibold text-[#0a0e1a] transition hover:bg-white/90"
        >
          Buy Now
        </a>
      )}
    </div>
  );
}
