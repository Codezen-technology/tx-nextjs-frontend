"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartQuery } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart.store";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { CouponInput } from "@/components/cart/CouponInput";
import { UpsellBanner } from "@/components/cart/UpsellBanner";
import { RelatedCourses } from "@/components/cart/RelatedCourses";
import { CourseTrustedStrip } from "@/components/courses/course-trusted-strip";

export default function CartPage() {
  const { isLoading } = useCartQuery();
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <div className="min-h-screen bg-[#fafbfb]">
      {/* Trust badges */}
      <CourseTrustedStrip />

      {/* Breadcrumb */}
      <div className="bg-[#00204a] py-2.5">
        <div className="container">
          <p className="text-sm text-white">
            <Link href="/" className="font-bold underline">
              Home
            </Link>
            <span className="mx-1">›</span>
            <span>Cart</span>
          </p>
        </div>
      </div>

      <div className="container py-10">
        <h1 className="mb-8 font-suse text-3xl font-medium text-[#00204a]">Cart</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart size={56} className="mb-4 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-[#00204a]">Your cart is empty</h2>
            <p className="mb-6 text-[#3b5374]">Browse our courses and add something you love.</p>
            <Link
              href="/courses"
              className="rounded bg-[#9e6f21] px-6 py-3 text-sm font-medium text-white hover:bg-[#7d5819]"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left: items + coupon */}
            <div>
              <div className="rounded-lg bg-white shadow-sm">
                <div className="px-6">
                  {items.map((item) => (
                    <CartItemRow key={item.key} item={item} />
                  ))}
                </div>
                <div className="border-t border-gray-100 px-6 py-4">
                  <CouponInput />
                </div>
              </div>

              {/* Item count label */}
              <p className="mt-3 text-sm text-[#3b5374]">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            {/* Right: summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <CartSummary />
            </div>
          </div>
        )}

        {/* Upsell banner — always shown */}
        {!isLoading && (
          <div className="mt-12 space-y-10">
            <UpsellBanner variant="cart" />
          </div>
        )}
      </div>
    </div>
  );
}
