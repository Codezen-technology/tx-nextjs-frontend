"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAddToCart } from "@/lib/hooks/useCart";
import type { HomePricingPlan } from "@/types/home";
import { cn } from "@/lib/utils/cn";

interface PricingCtaProps {
  plan: HomePricingPlan;
  quantity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PricingCta({ plan, quantity = 1, className, style }: PricingCtaProps) {
  const router = useRouter();
  const { mutate: addToCart, isPending } = useAddToCart();

  const handleAddToCart = () => {
    if (!plan.product) {
      router.push(plan.ctaHref || "#");
      return;
    }
    addToCart(
      { product_id: plan.product.id, quantity },
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
      data-testid="plan-cta"
      // `product` decides whether this adds to the cart or merely navigates, and that
      // difference is invisible in the rendered markup — the spec's load-bearing clause.
      // Expose it so the parity test can compare purchasability, not just the label.
      data-plan-purchasable={plan.product ? "true" : "false"}
      onClick={handleAddToCart}
      disabled={isPending}
      className={cn(className, "disabled:cursor-not-allowed disabled:opacity-70")}
      style={style}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : plan.ctaLabel}
    </button>
  );
}
