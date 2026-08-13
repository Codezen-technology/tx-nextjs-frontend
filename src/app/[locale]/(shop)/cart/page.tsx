"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useAuthStore, selectUser } from "@/lib/stores/auth.store";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { CouponInput } from "@/components/cart/CouponInput";
import { UpsellBanner } from "@/components/cart/UpsellBanner";

export default function CartPage() {
  const { items, itemCount, isLoading, errors } = useCart();
  const user = useAuthStore(selectUser);
  const browseCoursesHref = user ? "/dashboard/all-courses" : "/all-courses";

  return (
    <div className="bg-neutral-10 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-neutral-900 py-2.5">
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
        <h1 className="font-suse mb-8 text-3xl font-medium text-neutral-900">Cart</h1>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mb-6 space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {errors.map((e) => (
              <p key={e.code + e.message}>{e.message}</p>
            ))}
          </div>
        )}

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
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">Your cart is empty</h2>
            <p className="mb-6 text-neutral-500">Browse our courses and add something you love.</p>
            <Link
              href={browseCoursesHref}
              className="bg-secondary-600 rounded px-6 py-3 text-sm font-medium text-white hover:bg-[#7d5819]"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* Left: items + coupon */}
            <div>
              <div className="rounded-lg bg-white shadow-xs">
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
              <p className="mt-3 text-sm text-neutral-500">
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
