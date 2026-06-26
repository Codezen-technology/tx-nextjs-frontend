"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
import { useOrderDetail } from "@/lib/hooks/useCheckout";
import { UpsellBanner } from "@/components/cart/UpsellBanner";

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

function currencySymbol(code?: string): string {
  return (code && CURRENCY_SYMBOLS[code]) || "£";
}

/** Figma receipt format: DD-MM-YYYY, HH:mm:ss */
function formatPurchaseDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full items-start justify-between gap-6">
      <span className="font-suse text-lg font-medium text-[#3b5374] sm:text-xl">{label}</span>
      <span className="text-right font-suse text-lg font-bold text-[#00204a] sm:text-xl">
        {children}
      </span>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const id = Number(orderId);
  const orderKey = searchParams.get("key");
  const { data: order, isLoading, isError } = useOrderDetail(id, orderKey);

  if (isError) {
    return (
      <div className="container py-20 text-center">
        <p className="text-[#3b5374]">
          We could not load your order. Check your confirmation email or log in to view orders.
        </p>
        <Link href="/login" className="mt-4 inline-block text-[#9e6f21] underline">
          Log in
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-[636px] space-y-4">
          <div className="h-10 animate-pulse rounded bg-gray-100" />
          <div className="h-96 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  const symbol = currencySymbol(order?.currency);
  const firstName = order?.billing?.first_name?.trim();
  const subtotal = order?.subtotal ?? 0;
  const discount = order?.discount ?? 0;
  const tax = order?.tax ?? 0;
  const total = order?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#fafbfb]">
      <div className="container py-12 sm:py-16">
        <div className="mx-auto flex w-full max-w-[636px] flex-col items-center gap-10 rounded-lg bg-white p-6 shadow-[0_8px_16px_rgba(0,0,0,0.15)] sm:gap-[53px] sm:p-10">
          {/* Header: success icon + headings */}
          <div className="flex w-full flex-col items-center gap-6 text-center">
            <div className="flex size-[88px] items-center justify-center rounded-full bg-[#e8f3ec]">
              <div className="flex size-[54px] items-center justify-center rounded-full bg-[#198754]">
                <Check className="size-7 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-3">
              <p className="font-suse text-[28px] font-medium leading-tight text-[#198754] sm:text-[32px]">
                Payment Success!
              </p>
              <h1 className="font-suse text-[32px] font-bold leading-[1.2] text-[#00204a] sm:text-[40px]">
                Thank you for your purchase{firstName ? `, ${firstName}` : ""}!
              </h1>
              {order?.billing?.email && (
                <p className="max-w-[455px] text-base text-[#3b5374]">
                  We&apos;ve sent an email with next steps to{" "}
                  <strong className="text-[#00204a]">{order.billing.email}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-[#ebedf1]" />

          {/* Payment details */}
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex w-full flex-col gap-5">
              <DetailRow label="Order ID">#{order?.id ?? id}</DetailRow>
              <DetailRow label="Purchase Date">{formatPurchaseDate(order?.date_created)}</DetailRow>
              {order?.payment_method_title && (
                <DetailRow label="Payment Method">
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="size-5 text-[#00204a]" />
                    {order.payment_method_title}
                  </span>
                </DetailRow>
              )}
            </div>

            <div className="h-px w-full bg-[#ebedf1]" />

            {/* Amounts */}
            <div className="flex w-full flex-col gap-5">
              <DetailRow label="Sub Total">
                {symbol}
                {subtotal.toFixed(2)}
              </DetailRow>
              {discount > 0 && (
                <div className="flex w-full items-start justify-between gap-6 font-suse text-lg font-bold text-[#dc3545] sm:text-xl">
                  <span className="flex-1">Discount</span>
                  <span className="text-right">
                    -{symbol}
                    {discount.toFixed(2)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <DetailRow label="VAT">
                  {symbol}
                  {tax.toFixed(2)}
                </DetailRow>
              )}
              <DetailRow label="Total">
                {symbol}
                {total.toFixed(2)}
              </DetailRow>
            </div>
          </div>

          <div className="h-px w-full bg-[#ebedf1]" />

          {/* Actions */}
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/courses"
              className="flex flex-1 items-center justify-center rounded border border-[#9e6f21] px-4 py-2.5 text-base font-medium text-[#9e6f21] transition-colors hover:bg-[#f5f1e9]"
            >
              Browse more courses
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-1 items-center justify-center rounded border border-[#9e6f21] bg-[#9e6f21] px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-[#7d5819]"
            >
              Start Learning
            </Link>
          </div>
        </div>

        {/* Membership upsell banner */}
        <div className="mx-auto mt-10 w-full max-w-[636px]">
          <UpsellBanner variant="checkout" />
        </div>
      </div>
    </div>
  );
}
