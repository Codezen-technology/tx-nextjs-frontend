"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useOrderDetail } from "@/lib/hooks/useCheckout";

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);
  const { data: order, isLoading } = useOrderDetail(id);

  if (isLoading) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="h-10 animate-pulse rounded bg-gray-100" />
          <div className="h-40 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfb]">
      <div className="container py-16">
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
          <h1 className="mb-2 font-suse text-3xl font-medium text-[#00204a]">Order Confirmed!</h1>
          <p className="mb-1 text-[#3b5374]">
            Thank you for your purchase. Your order #{id} has been placed.
          </p>
          {order?.billing?.email && (
            <p className="text-sm text-[#3b5374]">
              A confirmation has been sent to <strong>{order.billing.email}</strong>.
            </p>
          )}
        </div>

        {/* Order items */}
        {order?.items && order.items.length > 0 && (
          <div className="mx-auto mt-10 max-w-lg rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-suse text-lg font-medium text-[#00204a]">What you ordered</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4 text-sm text-[#3b5374]">
                  <span className="flex-1">
                    {item.name} <span className="text-[#00204a]">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-[#00204a]">£{item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-[#00204a]">
                  <span>Total paid</span>
                  <span>£{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded bg-[#9e6f21] px-6 py-3 text-sm font-medium text-white hover:bg-[#7d5819]"
          >
            Start Learning
          </Link>
          <Link
            href="/courses"
            className="rounded border border-[#9e6f21] px-6 py-3 text-sm font-medium text-[#9e6f21] hover:bg-[#f5f1e9]"
          >
            Browse more courses
          </Link>
        </div>
      </div>
    </div>
  );
}
