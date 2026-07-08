"use client";

import Link from "next/link";
import { useSubscriptionPromos } from "@/lib/hooks/useStudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { PromoCardVariant } from "@/types/student-dashboard";

const VARIANT_STYLES: Record<PromoCardVariant, { bg: string; buttonClass: string; maxW: string }> =
  {
    hardcopy: {
      bg: "bg-[#0b1759]",
      maxW: "max-w-lg",
      buttonClass:
        "bg-linear-to-r from-[#EE3D7B] to-[#FBB43F] text-white hover:from-[#d4356b] hover:to-[#e8a030]",
    },
    team: {
      bg: "bg-[#108a97]",
      maxW: "max-w-xl",
      buttonClass: "bg-white text-[#2e4450] hover:bg-white/90",
    },
  };

export function PromoCardsSection() {
  const { data, isLoading } = useSubscriptionPromos();

  if (isLoading) {
    return (
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[250px] rounded-2xl" />
        <Skeleton className="h-[250px] rounded-2xl" />
      </div>
    );
  }

  if (!data?.promos?.length) return null;

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {data.promos.map((promo) => {
        const variant = promo.variant === "team" ? "team" : "hardcopy";
        const styles = VARIANT_STYLES[variant];
        const external = /^https?:\/\//i.test(promo.button_url);

        return (
          <div
            key={promo.id}
            className={`flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center text-white ${styles.bg}`}
          >
            <h3 className="text-xl font-bold">{promo.title}</h3>
            <p className={`leading-relaxed text-white/85 ${styles.maxW}`}>{promo.description}</p>
            <Button asChild className={styles.buttonClass}>
              {external ? (
                <a href={promo.button_url} target="_blank" rel="noopener noreferrer">
                  {promo.button_label}
                </a>
              ) : (
                <Link href={promo.button_url}>{promo.button_label}</Link>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
