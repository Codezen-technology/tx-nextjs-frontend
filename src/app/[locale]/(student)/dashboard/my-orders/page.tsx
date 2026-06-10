"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { DashboardErrorBanner } from "@/components/dashboard/dashboard-error-banner";
import { useStudentOrder, useStudentOrders } from "@/lib/hooks/useStudentDashboard";
import {
  formatCurrency,
  formatOrderDate,
  getOrderStatusStyle,
} from "@/lib/utils/student-dashboard";

function StatusChip({ status }: { status: string }) {
  const style = getOrderStatusStyle(status);
  return (
    <span
      className="rounded-full border px-3 py-1 text-xs font-semibold uppercase"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="space-y-2 border-b py-4">
      <Skeleton className="h-6 w-full max-w-md" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

function OrderDetail({ orderId, currency }: { orderId: number; currency: string }) {
  const { data, isLoading, isError } = useStudentOrder(orderId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="p-4 text-sm text-[#586973]">Could not load order details.</p>;
  }

  return (
    <div className="space-y-4 rounded-lg bg-white p-4">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-medium">Billed to:</span>{" "}
          {`${data.billing.first_name} ${data.billing.last_name}`.trim() || "—"}
        </p>
        <p>
          <span className="font-medium">Order Total:</span>{" "}
          {formatCurrency(data.total, data.currency)}
        </p>
      </div>
      <hr />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[#586973]">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.product_id} className="border-b last:border-0">
              <td className="py-2">{item.name}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2 text-right">{formatCurrency(item.total, data.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-[#586973]">
            <td className="pt-3" colSpan={2}>
              Subtotal
            </td>
            <td className="pt-3 text-right">{formatCurrency(data.subtotal, data.currency)}</td>
          </tr>
          {data.discount > 0 && (
            <tr className="text-[#586973]">
              <td colSpan={2}>Discount</td>
              <td className="text-right">−{formatCurrency(data.discount, data.currency)}</td>
            </tr>
          )}
          {data.tax > 0 && (
            <tr className="text-[#586973]">
              <td colSpan={2}>Tax</td>
              <td className="text-right">{formatCurrency(data.tax, data.currency)}</td>
            </tr>
          )}
          <tr className="font-semibold text-[#2e4450]">
            <td className="pt-1" colSpan={2}>
              Total
            </td>
            <td className="pt-1 text-right">
              {formatCurrency(data.total, currency || data.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string>("");
  const { data, isLoading, isError } = useStudentOrders(page, 20);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-[#2e4450]">My Orders</h1>
        {data?.total !== undefined && (
          <span className="text-sm text-[#586973]">{data.total} orders</span>
        )}
      </div>
      <hr className="mb-6 border-[#eaecee]" />

      {isError && <DashboardErrorBanner />}

      {isLoading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : !data?.orders.length ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No orders yet"
          description="Your purchase history will appear here."
        />
      ) : (
        <>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={openId}
            onValueChange={setOpenId}
          >
            {data.orders.map((order) => (
              <AccordionItem key={order.id} value={String(order.id)}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-4 text-left">
                    <span className="font-semibold text-[#2e4450]">Order #{order.id}</span>
                    <StatusChip status={order.status} />
                    <span className="text-sm text-[#586973]">
                      {formatOrderDate(order.date_created)}
                    </span>
                    <span className="font-semibold text-[#2e4450]">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {openId === String(order.id) && (
                    <OrderDetail orderId={order.id} currency={order.currency} />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {data.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
}
