"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAddToCart } from "@/lib/hooks/useCart";
import type { HomePricingPlan } from "@/types/home";
import { cn } from "@/lib/utils/cn";

interface PricingCtaProps {
  plan: HomePricingPlan;
  className?: string;
  style?: React.CSSProperties;
}

export function PricingCta({ plan, className, style }: PricingCtaProps) {
  const router = useRouter();
  const { mutate: addToCart, isPending } = useAddToCart();

  // No linked product → plain link CTA (falls back to ctaHref).
  if (!plan.product) {
    return (
      <Link href={plan.ctaHref || "#"} className={className} style={style}>
        {plan.ctaLabel}
      </Link>
    );
  }

  const productId = plan.product.id;

  const handleAddToCart = () => {
    addToCart(
      { product_id: productId },
      {
        onSuccess: () => {
          toast.success(`${plan.product?.name ?? plan.name} added to cart`);
          router.push("/checkout");
        },
        onError: (err) => {
          toast.error((err as Error).message ?? "Could not add to cart.");
        },
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isPending}
      className={cn(className, "disabled:cursor-not-allowed disabled:opacity-70")}
      style={style}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : plan.ctaLabel}
    </button>
  );
}
