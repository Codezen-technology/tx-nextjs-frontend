"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { OrderPaymentForm } from "@/components/checkout/OrderPaymentForm";
import { Button } from "@/components/ui/button";
import { checkoutService } from "@/lib/services/checkout";
import { queryKeys } from "@/lib/utils/query-keys";

/** Only allow internal redirect targets. */
function safeReturn(raw: string | null): string {
  return raw && raw.startsWith("/") ? raw : "/dashboard";
}

export default function OrderPayPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="flex items-center gap-2 py-10 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        </Shell>
      }
    >
      <PayContent />
    </Suspense>
  );
}

function PayContent() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const orderId = Number(params.get("order") ?? 0);
  const orderKey = params.get("key") ?? "";
  const fallbackTotal = Number(params.get("total") ?? 0);
  const returnUrl = safeReturn(params.get("return"));
  const valid = orderId > 0 && orderKey.length > 0;

  const [paid, setPaid] = useState(false);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: queryKeys.orders.detail(orderId, orderKey),
    queryFn: () => checkoutService.getStoreOrder(orderId, orderKey),
    enabled: valid,
    staleTime: 30_000,
  });

  // Prefer the authoritative Store API total; fall back to the URL param while loading.
  const total = order?.total ?? fallbackTotal;
  const currency = order?.currencySymbol ?? "£";

  const handlePaid = () => {
    setPaid(true);
    // Payment is a rare, high-impact event — refresh everything (balances, orders, etc.).
    queryClient.invalidateQueries();
  };

  if (!valid) {
    return (
      <Shell>
        <p className="text-sm text-neutral-600">No order to pay for.</p>
        <Button className="mt-4" onClick={() => router.push(returnUrl)}>
          Go back
        </Button>
      </Shell>
    );
  }

  if (paid) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <div>
            <h2 className="text-lg font-semibold text-[#1a171b]">Payment successful</h2>
            <p className="mt-1 text-sm text-neutral-600">Your order has been paid.</p>
          </div>
          <Button
            className="bg-[#9e6f21] hover:bg-[#7d5819]"
            onClick={() => router.push(returnUrl)}
          >
            Continue
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-8 md:grid-cols-[1fr_minmax(280px,340px)]">
        <div className="order-2 md:order-1">
          <h2 className="mb-4 text-base font-semibold text-[#1a171b]">Billing &amp; payment</h2>
          <OrderPaymentForm
            orderId={orderId}
            orderKey={orderKey}
            total={total}
            onPaid={handlePaid}
            onCancel={() => router.push(returnUrl)}
          />
        </div>

        <aside className="order-1 h-fit rounded-lg border border-neutral-200 bg-neutral-50 p-5 md:order-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1a171b]">Order summary</h2>
            <span className="text-xs text-neutral-400">#{orderId}</span>
          </div>

          {order ? (
            <ul className="space-y-3">
              {order.items.map((item, i) => (
                <li key={`${item.name}-${i}`} className="flex justify-between gap-3 text-sm">
                  <span className="text-neutral-700">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-neutral-400"> × {item.quantity}</span>
                    )}
                  </span>
                  <span className="font-medium text-[#1a171b]">
                    {currency}
                    {item.total.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : orderLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading items…
            </div>
          ) : null}

          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base font-semibold text-[#1a171b]">
            <span>Total due</span>
            <span>
              {currency}
              {total.toFixed(2)}
            </span>
          </div>
          <p className="mt-3 text-xs text-neutral-400">Inclusive of any applicable VAT.</p>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-[#1a171b]">Checkout</h1>
      {children}
    </div>
  );
}
